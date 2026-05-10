const pool = require('../config/database');
const jwt  = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

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

        const id = uuidv4();
        await pool.query(
            `INSERT INTO users (id, full_name, email, password, role) VALUES ($1, $2, $3, $4, 'user')`,
            [id, full_name, email, password]
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

        if (password !== user.password) {
            return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
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

        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, message: 'تم تسجيل الدخول بنجاح', data: { user: userWithoutPassword, token } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const getMe = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, full_name, email, role, last_checkin, created_at FROM users WHERE id = $1',
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

const emailService = require('../services/email.service');

const testEmail = async (req, res) => {
    try {
        const me = await pool.query(
            'SELECT full_name, email FROM users WHERE id = $1',
            [req.user.id]
        );
        if (me.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        const { full_name, email } = me.rows[0];
        const result = await emailService.sendTestEmail(email, full_name);
        if (result.error) {
            return res.status(502).json({
                success: false,
                message: `فشل الإرسال: ${result.error}`
            });
        }
        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, ip_address) VALUES ($1, $2, $3, $4)',
            [uuidv4(), req.user.id, 'EMAIL_TEST', req.ip]
        );
        res.json({
            success: true,
            message: 'تم إرسال رسالة الاختبار — راجع صندوق الوارد (والسبام).',
            data: { to: email, previewUrl: result.previewUrl || null }
        });
    } catch (error) {
        console.error('testEmail error:', error);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

module.exports = { register, login, getMe, logout, testEmail };
