const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// All users including developer accounts
const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, full_name, email, role, is_active, last_checkin, created_at, two_fa_enabled
             FROM users ORDER BY role, created_at DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// Hard-delete any user (including admins) — irreversible
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.user.id) {
            return res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك الخاص' });
        }
        const affected = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (affected.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)',
            [uuidv4(), req.user.id, 'DEV_DELETE_USER', JSON.stringify({ deleted_id: id })]
        );
        res.json({ success: true, message: 'تم حذف المستخدم نهائياً' });
    } catch {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// Set any role (admin, user, manager, developer)
const setRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['admin', 'user', 'manager', 'developer'].includes(role)) {
            return res.status(400).json({ success: false, message: 'دور غير صالح' });
        }
        const affected = await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
        if (affected.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)',
            [uuidv4(), req.user.id, 'DEV_SET_ROLE', JSON.stringify({ target_id: id, role })]
        );
        const result = await pool.query('SELECT id, full_name, email, role FROM users WHERE id = $1', [id]);
        res.json({ success: true, data: result.rows[0] });
    } catch {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// Force-toggle any user active/inactive
const toggleUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.user.id) {
            return res.status(400).json({ success: false, message: 'لا يمكنك تعطيل حسابك الخاص' });
        }
        await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = $1', [id]);
        const result = await pool.query('SELECT id, full_name, email, is_active FROM users WHERE id = $1', [id]);
        res.json({ success: true, data: result.rows[0] });
    } catch {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// Reset user password
const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' });
        }
        const hashed = await bcrypt.hash(password, 12);
        const affected = await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, id]);
        if (affected.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)',
            [uuidv4(), req.user.id, 'DEV_RESET_PASSWORD', JSON.stringify({ target_id: id })]
        );
        res.json({ success: true, message: 'تم إعادة تعيين كلمة السر' });
    } catch {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// Reactivate a triggered will → active
const restoreWill = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE wills SET status = 'active', triggered_at = NULL WHERE id = $1`, [id]
        );
        await pool.query(
            `UPDATE beneficiaries SET access_token = NULL, token_expires = NULL,
             notified_at = NULL, email_status = 'pending', email_attempts = 0,
             last_attempt_at = NULL WHERE will_id = $1`, [id]
        );
        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)',
            [uuidv4(), req.user.id, 'DEV_RESTORE_WILL', JSON.stringify({ will_id: id })]
        );
        res.json({ success: true, message: 'تم استعادة الوصية إلى نشطة' });
    } catch {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// Disable/clear 2FA for any user
const clear2FA = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            'UPDATE users SET two_fa_enabled = 0, two_fa_secret = NULL WHERE id = $1', [id]
        );
        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)',
            [uuidv4(), req.user.id, 'DEV_CLEAR_2FA', JSON.stringify({ target_id: id })]
        );
        res.json({ success: true, message: 'تم مسح المصادقة الثنائية' });
    } catch {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// System-wide stats (unrestricted)
const getSystemStats = async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users)                              AS total_users,
                (SELECT COUNT(*) FROM users WHERE role = 'developer')    AS developer_accounts,
                (SELECT COUNT(*) FROM users WHERE role = 'admin')        AS admin_accounts,
                (SELECT COUNT(*) FROM users WHERE is_active = 0)         AS disabled_users,
                (SELECT COUNT(*) FROM wills)                              AS total_wills,
                (SELECT COUNT(*) FROM wills WHERE status = 'active')     AS active_wills,
                (SELECT COUNT(*) FROM wills WHERE status = 'triggered')  AS triggered_wills,
                (SELECT COUNT(*) FROM documents)                          AS total_documents,
                (SELECT COUNT(*) FROM assets)                             AS total_assets,
                (SELECT COUNT(*) FROM beneficiaries)                      AS total_beneficiaries,
                (SELECT COUNT(*) FROM audit_logs)                         AS total_logs
        `);
        res.json({ success: true, data: stats.rows[0] });
    } catch {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// All audit logs (unrestricted, all actions including dev)
const getAuditLogs = async (req, res) => {
    try {
        const page   = parseInt(req.query.page)  || 1;
        const limit  = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;
        const result = await pool.query(
            `SELECT l.*, u.email, u.full_name, u.role
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
    } catch {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

module.exports = {
    getAllUsers, deleteUser, setRole, toggleUser, resetPassword,
    restoreWill, clear2FA, getSystemStats, getAuditLogs
};
