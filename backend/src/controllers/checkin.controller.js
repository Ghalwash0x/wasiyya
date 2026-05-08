const pool = require('../config/database');

const doCheckin = async (req, res) => {
    try {
        await pool.query(
            'UPDATE users SET last_checkin = NOW() WHERE id = $1',
            [req.user.id]
        );

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, $2, $3)',
            [req.user.id, 'CHECKIN', req.ip]
        );

        res.json({ success: true, message: 'تم تجديد وجودك بنجاح', last_checkin: new Date() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const getCheckinStatus = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.last_checkin, w.checkin_interval_days, w.grace_period_days, w.status
             FROM users u
             LEFT JOIN wills w ON w.user_id = u.id
             WHERE u.id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        const row = result.rows[0];
        const daysSince = Math.floor(
            (new Date() - new Date(row.last_checkin)) / (1000 * 60 * 60 * 24)
        );
        const interval = row.checkin_interval_days || 30;

        res.json({
            success: true,
            data: {
                last_checkin: row.last_checkin,
                days_since_checkin: daysSince,
                days_remaining: Math.max(0, interval - daysSince),
                checkin_interval_days: interval,
                grace_period_days: row.grace_period_days,
                will_status: row.status,
                is_overdue: daysSince > interval
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

module.exports = { doCheckin, getCheckinStatus };
