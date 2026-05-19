const pool    = require('../config/database');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const BCRYPT_ROUNDS = 12;

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

const register = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
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

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = 1', [email]
        );

        if (result.rows.length === 0) {
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
            return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
        }

        // If 2FA is enabled, return a temporary token instead of the full JWT
        if (user.two_fa_enabled) {
            const tempToken = jwt.sign(
                { userId: user.id, pending2FA: true },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );
            return res.json({ success: true, requires2FA: true, tempToken });
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
            'SELECT id, full_name, email, role, two_fa_enabled, last_checkin, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        res.json({ success: true, data: result.rows[0] });
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

module.exports = { register, login, getMe, logout };
