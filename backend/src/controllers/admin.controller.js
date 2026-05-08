const pool = require('../config/database');

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

        const result = await pool.query(
            `UPDATE users SET is_active = NOT is_active WHERE id = $1
             RETURNING id, full_name, email, is_active`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

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

        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role',
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT l.*, u.email, u.full_name
             FROM audit_logs l
             LEFT JOIN users u ON l.user_id = u.id
             ORDER BY l.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const count = await pool.query('SELECT COUNT(*) FROM audit_logs');

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total: parseInt(count.rows[0].count),
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const getStats = async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users) AS total_users,
                (SELECT COUNT(*) FROM users WHERE is_active = true) AS active_users,
                (SELECT COUNT(*) FROM wills) AS total_wills,
                (SELECT COUNT(*) FROM wills WHERE status = 'active') AS active_wills,
                (SELECT COUNT(*) FROM wills WHERE status = 'triggered') AS triggered_wills,
                (SELECT COUNT(*) FROM documents) AS total_documents,
                (SELECT COUNT(*) FROM assets) AS total_assets
        `);

        res.json({ success: true, data: stats.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

module.exports = { getAllUsers, toggleUserStatus, changeUserRole, getAuditLogs, getStats };
