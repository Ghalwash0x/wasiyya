const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'غير مصرح - يرجى تسجيل الدخول'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
            'SELECT id, email, role, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0 || !result.rows[0].is_active) {
            return res.status(401).json({
                success: false,
                message: 'المستخدم غير موجود أو تم تعطيل الحساب'
            });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'انتهت صلاحية الجلسة - يرجى تسجيل الدخول مجدداً'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Token غير صالح'
        });
    }
};

module.exports = { authenticate };
