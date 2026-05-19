const speakeasy = require('speakeasy');
const QRCode    = require('qrcode');
const jwt       = require('jsonwebtoken');
const pool      = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/auth/2fa/setup
// Returns a TOTP secret + QR code URL for the user to scan
const setup2FA = async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name:   `Wasiyya (${req.user.email})`,
            length: 20,
        });

        // Store the temp secret in DB (not yet enabled)
        await pool.query(
            'UPDATE users SET two_fa_secret = $1 WHERE id = $2',
            [secret.base32, req.user.id]
        );

        const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            success: true,
            data: {
                secret:    secret.base32,
                qr_code:   qrDataUrl,
                otpauth:   secret.otpauth_url,
            }
        });
    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ success: false, message: 'خطأ في إعداد 2FA' });
    }
};

// POST /api/auth/2fa/enable  { code }
// Verifies the first TOTP code and enables 2FA
const enable2FA = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'كود التحقق مطلوب' });

        const result = await pool.query(
            'SELECT two_fa_secret FROM users WHERE id = $1', [req.user.id]
        );

        const secret = result.rows[0]?.two_fa_secret;
        if (!secret) {
            return res.status(400).json({ success: false, message: 'قم بإعداد 2FA أولاً من /api/auth/2fa/setup' });
        }

        const valid = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token:    code,
            window:   1,
        });

        if (!valid) {
            return res.status(400).json({ success: false, message: 'الكود غير صحيح' });
        }

        await pool.query(
            'UPDATE users SET two_fa_enabled = 1 WHERE id = $1', [req.user.id]
        );

        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, ip_address) VALUES ($1, $2, $3, $4)',
            [uuidv4(), req.user.id, '2FA_ENABLED', req.ip]
        );

        res.json({ success: true, message: 'تم تفعيل المصادقة الثنائية بنجاح' });
    } catch (error) {
        console.error('2FA enable error:', error);
        res.status(500).json({ success: false, message: 'خطأ في تفعيل 2FA' });
    }
};

// POST /api/auth/2fa/verify  { tempToken, code }
// Called after login when requires2FA=true — returns full JWT on success
const verify2FA = async (req, res) => {
    try {
        const { tempToken, code } = req.body;
        if (!tempToken || !code) {
            return res.status(400).json({ success: false, message: 'tempToken والكود مطلوبان' });
        }

        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ success: false, message: 'التوكن منتهي أو غير صالح' });
        }

        if (!decoded.pending2FA) {
            return res.status(401).json({ success: false, message: 'توكن غير صالح لـ 2FA' });
        }

        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1 AND is_active = 1', [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
        }

        const user = result.rows[0];
        const valid = speakeasy.totp.verify({
            secret:   user.two_fa_secret,
            encoding: 'base32',
            token:    code,
            window:   1,
        });

        if (!valid) {
            return res.status(401).json({ success: false, message: 'كود التحقق غير صحيح' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, ip_address) VALUES ($1, $2, $3, $4)',
            [uuidv4(), user.id, 'USER_LOGIN_2FA', req.ip]
        );

        const { password: _, two_fa_secret: __, ...safeUser } = user;
        res.json({ success: true, message: 'تم تسجيل الدخول بنجاح', data: { user: safeUser, token } });
    } catch (error) {
        console.error('2FA verify error:', error);
        res.status(500).json({ success: false, message: 'خطأ في التحقق' });
    }
};

// POST /api/auth/2fa/disable  { code }
const disable2FA = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'كود التحقق مطلوب' });

        const result = await pool.query(
            'SELECT two_fa_secret FROM users WHERE id = $1', [req.user.id]
        );

        const secret = result.rows[0]?.two_fa_secret;
        const valid  = speakeasy.totp.verify({
            secret, encoding: 'base32', token: code, window: 1
        });

        if (!valid) {
            return res.status(400).json({ success: false, message: 'الكود غير صحيح' });
        }

        await pool.query(
            'UPDATE users SET two_fa_enabled = 0, two_fa_secret = NULL WHERE id = $1', [req.user.id]
        );

        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, ip_address) VALUES ($1, $2, $3, $4)',
            [uuidv4(), req.user.id, '2FA_DISABLED', req.ip]
        );

        res.json({ success: true, message: 'تم إلغاء تفعيل المصادقة الثنائية' });
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ success: false, message: 'خطأ في إلغاء 2FA' });
    }
};

module.exports = { setup2FA, enable2FA, verify2FA, disable2FA };
