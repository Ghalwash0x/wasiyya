const pool = require('../config/database');
const { runCheckinCheck } = require('../services/checkin.service');

const isMinutes = process.env.TIME_UNIT === 'minutes';

const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, full_name, email, role, is_active, last_checkin, created_at
             FROM users ORDER BY created_at DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.user.id) {
            return res.status(400).json({ success: false, message: 'لا يمكنك تعطيل حسابك الخاص' });
        }
        const affected = await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = $1', [id]);
        if (affected.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        const result = await pool.query('SELECT id, full_name, email, is_active FROM users WHERE id = $1', [id]);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const changeUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['admin', 'user', 'manager'].includes(role)) {
            return res.status(400).json({ success: false, message: 'دور غير صالح' });
        }
        const affected = await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
        if (affected.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        const result = await pool.query('SELECT id, full_name, email, role FROM users WHERE id = $1', [id]);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const page   = parseInt(req.query.page)  || 1;
        const limit  = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT l.*, u.email, u.full_name
             FROM audit_logs l
             LEFT JOIN users u ON l.user_id = u.id
             ORDER BY l.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        const count = await pool.query('SELECT COUNT(*) AS total FROM audit_logs');
        res.json({
            success: true,
            data: result.rows,
            pagination: { total: parseInt(count.rows[0].total), page, limit }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const getStats = async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users)                             AS total_users,
                (SELECT COUNT(*) FROM users WHERE is_active = 1)        AS active_users,
                (SELECT COUNT(*) FROM wills)                             AS total_wills,
                (SELECT COUNT(*) FROM wills WHERE status = 'active')    AS active_wills,
                (SELECT COUNT(*) FROM wills WHERE status = 'triggered') AS triggered_wills,
                (SELECT COUNT(*) FROM documents)                         AS total_documents,
                (SELECT COUNT(*) FROM assets)                            AS total_assets
        `);
        res.json({ success: true, data: stats.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// تشغيل فحص Dead Man's Switch الآن يدوياً
const forceCheck = async (req, res) => {
    try {
        const result = await runCheckinCheck();
        res.json({
            success: true,
            message: `تم تشغيل الفحص — وصايا فُعِّلت: ${result.triggered}، تحذيرات: ${result.warned}`,
            data: result
        });
    } catch (error) {
        console.error('Force check error:', error);
        res.status(500).json({ success: false, message: 'خطأ أثناء الفحص' });
    }
};

// ضبط آخر تجديد للمستخدم للتيست
const resetCheckin = async (req, res) => {
    try {
        const { id }  = req.params;
        const ago     = parseInt(req.query.ago) || 5;
        const unit    = isMinutes ? 'MINUTE' : 'DAY';
        const unitAr  = isMinutes ? 'دقيقة' : 'يوم';

        await pool.query(
            `UPDATE users SET last_checkin = DATE_SUB(NOW(), INTERVAL ${ago} ${unit}) WHERE id = $1`,
            [id]
        );

        const result = await pool.query(
            'SELECT id, full_name, email, last_checkin FROM users WHERE id = $1', [id]
        );

        res.json({
            success: true,
            message: `تم ضبط آخر تجديد إلى ${ago} ${unitAr} مضت`,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// إعادة تعيين وصية من "مُفعَّلة" إلى "نشطة" للتيست
const resetWill = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE wills SET status = 'active', triggered_at = NULL WHERE id = $1`, [id]
        );
        await pool.query(
            `UPDATE beneficiaries SET access_token = NULL, token_expires = NULL, notified_at = NULL WHERE will_id = $1`, [id]
        );
        res.json({ success: true, message: 'تم إعادة تعيين الوصية إلى نشطة' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const getTimeUnit = async (req, res) => {
    res.json({ success: true, data: { time_unit: isMinutes ? 'minutes' : 'days' } });
};

module.exports = {
    getAllUsers, toggleUserStatus, changeUserRole, getAuditLogs, getStats,
    forceCheck, resetCheckin, resetWill, getTimeUnit
};
