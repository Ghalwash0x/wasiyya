const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const isMinutes = process.env.TIME_UNIT === 'minutes';

const getElapsed = (lastCheckin) => {
    const diff = Date.now() - new Date(lastCheckin).getTime();
    return isMinutes
        ? Math.floor(diff / (1000 * 60))
        : Math.floor(diff / (1000 * 60 * 60 * 24));
};

const doCheckin = async (req, res) => {
    try {
        await pool.query('UPDATE users SET last_checkin = NOW() WHERE id = $1', [req.user.id]);

        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, ip_address) VALUES ($1, $2, $3, $4)',
            [uuidv4(), req.user.id, 'CHECKIN', req.ip]
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

        const row       = result.rows[0];
        const elapsed   = getElapsed(row.last_checkin);
        const interval  = row.checkin_interval_days || 30;
        const grace     = row.grace_period_days     || 7;

        res.json({
            success: true,
            data: {
                last_checkin:           row.last_checkin,
                elapsed:                elapsed,
                days_since_checkin:     elapsed,   // backwards compat
                days_remaining:         Math.max(0, interval - elapsed),
                checkin_interval_days:  interval,
                grace_period_days:      grace,
                will_status:            row.status,
                is_overdue:             elapsed > interval,
                time_unit:              isMinutes ? 'minutes' : 'days',
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

module.exports = { doCheckin, getCheckinStatus };
