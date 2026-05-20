const crypto  = require('crypto');
const pool    = require('../config/database');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { getUserKeyHex } = require('../services/encryption.service');
const { get2FAMethods } = require('../services/passkey.service');

const BCRYPT_ROUNDS = 12;

// In-memory brute-force tracker: email → { count, lockedUntil }
const loginAttempts = new Map();
const MAX_ATTEMPTS  = 5;
const LOCKOUT_MS    = 15 * 60 * 1000; // 15 minutes

const checkBruteForce = (email) => {
    const entry = loginAttempts.get(email);
    if (!entry) return null;
    if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
        const mins = Math.ceil((entry.lockedUntil - Date.now()) / 60000);
        return `الحساب مقفل مؤقتاً بسبب محاولات متعددة، حاول بعد ${mins} دقيقة`;
    }
    return null;
};

const recordFailedAttempt = (email) => {
    const entry = loginAttempts.get(email) || { count: 0, lockedUntil: null };
    entry.count += 1;
    if (entry.count >= MAX_ATTEMPTS) {
        entry.lockedUntil = Date.now() + LOCKOUT_MS;
        entry.count = 0;
    }
    loginAttempts.set(email, entry);
};

const clearAttempts = (email) => loginAttempts.delete(email);

const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8)
        errors.push('كلمة السر لازم تكون 8 أحرف على الأقل');
    if (!/[A-Z]/.test(password))
        errors.push('كلمة السر لازم تحتوي على حرف كبير واحد على الأقل');
    if (!/[0-9]/.test(password))
        errors.push('كلمة السر لازم تحتوي على رقم واحد على الأقل');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
        errors.push('كلمة السر لازم تحتوي على رمز خاص واحد على الأقل');
    return errors;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = async (req, res) => {
    try {
        const full_name = (req.body.full_name || '').trim();
        const email     = (req.body.email    || '').trim().toLowerCase();
        const password  = req.body.password  || '';

        if (!full_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
        }

        if (!EMAIL_RE.test(email)) {
            return res.status(400).json({ success: false, message: 'صيغة البريد الإلكتروني غير صحيحة' });
        }

        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            return res.status(400).json({ success: false, message: 'كلمة السر لا تستوفي الشروط', errors: passwordErrors });
        }

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقاً' });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const id = uuidv4();

        await pool.query(
            `INSERT INTO users (id, full_name, email, password, role) VALUES ($1, $2, $3, $4, 'user')`,
            [id, full_name, email, hashedPassword]
        );

        const result = await pool.query(
            'SELECT id, full_name, email, role, created_at FROM users WHERE id = $1', [id]
        );
        const user = result.rows[0];

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, ip_address) VALUES ($1, $2, $3, $4)',
            [uuidv4(), user.id, 'USER_REGISTERED', req.ip]
        );

        res.status(201).json({ success: true, message: 'تم التسجيل بنجاح', data: { user, token } });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'البريد الإلكتروني وكلمة السر مطلوبان' });
        }

        // Brute-force: check lockout before hitting DB
        const lockMsg = checkBruteForce(email.toLowerCase());
        if (lockMsg) {
            return res.status(429).json({ success: false, message: lockMsg });
        }

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = 1', [email]
        );

        if (result.rows.length === 0) {
            recordFailedAttempt(email.toLowerCase());
            return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
        }

        const user = result.rows[0];

        // Support both bcrypt hashes and legacy plaintext (auto-migrates on login)
        let passwordValid = false;
        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
            passwordValid = await bcrypt.compare(password, user.password);
        } else {
            // Legacy plaintext — compare then upgrade to bcrypt
            passwordValid = (password === user.password);
            if (passwordValid) {
                const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
                await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
            }
        }

        if (!passwordValid) {
            recordFailedAttempt(email.toLowerCase());
            return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
        }

        clearAttempts(email.toLowerCase()); // reset on success

        // If 2FA is enabled, return a temporary token instead of the full JWT
        if (user.two_fa_enabled) {
            const tempToken = jwt.sign(
                { userId: user.id, pending2FA: true },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );
            const methods = await get2FAMethods(user.id);
            return res.json({ success: true, requires2FA: true, tempToken, methods });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, ip_address) VALUES ($1, $2, $3, $4)',
            [uuidv4(), user.id, 'USER_LOGIN', req.ip]
        );

        const { password: _, two_fa_secret: __, ...userWithoutSecrets } = user;
        res.json({ success: true, message: 'تم تسجيل الدخول بنجاح', data: { user: userWithoutSecrets, token } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const getMe = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, full_name, email, role, two_fa_enabled, two_fa_secret, last_checkin, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        const user = result.rows[0];
        const methods = await get2FAMethods(req.user.id);
        res.json({
            success: true,
            data: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                two_fa_enabled: user.two_fa_enabled,
                two_fa_totp: !!user.two_fa_secret,
                two_fa_passkey: methods.passkey,
                last_checkin: user.last_checkin,
                created_at: user.created_at,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const logout = async (req, res) => {
    await pool.query(
        'INSERT INTO audit_logs (id, user_id, action, ip_address) VALUES ($1, $2, $3, $4)',
        [uuidv4(), req.user.id, 'USER_LOGOUT', req.ip]
    );
    res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
};

const verifyPendingOAuthToken = (token) => {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.pendingOAuthRegister) {
        throw new Error('invalid');
    }
    return payload;
};

const getPendingOAuth = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ success: false, message: 'رمز OAuth مطلوب' });
        }

        const payload = verifyPendingOAuthToken(token);
        res.json({
            success: true,
            data: {
                email: payload.email,
                full_name: payload.full_name,
                provider: payload.provider,
            },
        });
    } catch {
        res.status(400).json({ success: false, message: 'انتهت صلاحية رمز OAuth — حاول التسجيل مرة أخرى' });
    }
};

const registerOAuth = async (req, res) => {
    try {
        const oauth_token = req.body.oauth_token || '';
        const full_name   = (req.body.full_name || '').trim();
        const password    = req.body.password || '';

        if (!oauth_token || !full_name) {
            return res.status(400).json({ success: false, message: 'الاسم الكامل مطلوب' });
        }

        let payload;
        try {
            payload = verifyPendingOAuthToken(oauth_token);
        } catch {
            return res.status(400).json({ success: false, message: 'انتهت صلاحية رمز OAuth — حاول التسجيل مرة أخرى' });
        }

        const email = payload.email;
        if (!email || !EMAIL_RE.test(email)) {
            return res.status(400).json({ success: false, message: 'لا يمكن إنشاء الحساب بدون بريد إلكتروني صالح' });
        }

        if (password) {
            const passwordErrors = validatePassword(password);
            if (passwordErrors.length > 0) {
                return res.status(400).json({ success: false, message: 'كلمة السر لا تستوفي الشروط', errors: passwordErrors });
            }
        }

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقاً' });
        }

        const plainPassword = password || crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
        const id = uuidv4();

        await pool.query(
            `INSERT INTO users (id, full_name, email, password, role, oauth_provider, oauth_id)
             VALUES ($1, $2, $3, $4, 'user', $5, $6)`,
            [id, full_name, email, hashedPassword, payload.provider, payload.oauth_id]
        );

        const result = await pool.query(
            'SELECT id, full_name, email, role, created_at FROM users WHERE id = $1', [id]
        );
        const user = result.rows[0];

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, ip_address) VALUES ($1, $2, $3, $4)',
            [uuidv4(), user.id, 'USER_REGISTERED_OAUTH', req.ip]
        );

        res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح', data: { user, token } });
    } catch (error) {
        console.error('Register OAuth error:', error);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

/** Decryption key for asset content — only the authenticated account owner (user/manager) */
const getWalletKey = async (req, res) => {
    try {
        if (req.user.role !== 'user') {
            return res.status(403).json({
                success: false,
                message: 'مفتاح فك التشفير متاح لصاحب الحساب فقط',
            });
        }
        res.json({ success: true, data: { key: getUserKeyHex(req.user.id) } });
    } catch (error) {
        console.error('getWalletKey error:', error);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

module.exports = { register, login, getMe, logout, getPendingOAuth, registerOAuth, getWalletKey };
