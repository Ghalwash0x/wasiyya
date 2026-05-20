const pool = require('../config/database');
const { runCheckinCheck } = require('../services/checkin.service');
const emailService = require('../services/email.service');

const isMinutes = process.env.TIME_UNIT === 'minutes';

const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, full_name, email, role, is_active, last_checkin, created_at
             FROM users WHERE role != 'developer' ORDER BY created_at DESC`
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
        const target = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
        if (target.rows[0]?.role === 'developer') {
            return res.status(403).json({ success: false, message: 'غير مسموح' });
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
        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({ success: false, message: 'دور غير صالح' });
        }
        const target = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
        if (target.rows[0]?.role === 'developer') {
            return res.status(403).json({ success: false, message: 'غير مسموح' });
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

// جلب الوصايا المُفعَّلة مع روابط الوصول لكل وارث
const getTriggeredWills = async (req, res) => {
    try {
        const wills = await pool.query(`
            SELECT w.id, w.title, w.triggered_at, u.full_name, u.email AS owner_email
            FROM wills w
            JOIN users u ON w.user_id = u.id
            WHERE w.status = 'triggered'
            ORDER BY w.triggered_at DESC
        `);

        const result = [];
        for (const w of wills.rows) {
            const bens = await pool.query(`
                SELECT id, name, email, access_token, token_expires, notified_at, accessed_at,
                       email_status, email_attempts, last_attempt_at
                FROM beneficiaries
                WHERE will_id = $1
            `, [w.id]);

            result.push({
                ...w,
                beneficiaries: bens.rows.map(b => ({
                    ...b,
                    access_url: b.access_token
                        ? `${process.env.FRONTEND_URL}/access/${b.access_token}`
                        : null,
                    token_valid:   b.token_expires ? new Date(b.token_expires) > new Date() : false,
                    email_preview: emailService.getPreview(b.id)
                }))
            });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// جلب كل الوصايا في النظام
const getAllWills = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT w.*, u.full_name, u.email AS owner_email,
                (SELECT COUNT(*) FROM assets  WHERE will_id = w.id) AS assets_count,
                (SELECT COUNT(*) FROM documents WHERE will_id = w.id) AS docs_count,
                (SELECT COUNT(*) FROM beneficiaries WHERE will_id = w.id) AS ben_count
            FROM wills w
            JOIN users u ON w.user_id = u.id
            ORDER BY w.created_at DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const getEmailMode = (req, res) => {
    res.json({
        success: true,
        data: {
            configured: emailService.isGmailConfigured(),
            mode: emailService.isGmailConfigured() ? 'gmail' : 'ethereal'
        }
    });
};

// One-time bootstrap: promotes calling admin to developer when no developer accounts exist
const bootstrapDeveloper = async (req, res) => {
    try {
        const devCount = await pool.query(
            `SELECT COUNT(*) AS cnt FROM users WHERE role = 'developer'`
        );
        if (parseInt(devCount.rows[0].cnt) > 0) {
            return res.status(403).json({
                success: false,
                message: 'Developer accounts already exist — use the Developer Console to manage roles'
            });
        }
        await pool.query(
            `UPDATE users SET role = 'developer' WHERE id = $1`, [req.user.id]
        );
        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)',
            [uuidv4(), req.user.id, 'BOOTSTRAP_DEVELOPER', JSON.stringify({ promoted_id: req.user.id })]
        );
        res.json({
            success: true,
            message: 'تم ترقية الحساب إلى Developer — أعد تسجيل الدخول للوصول للوحة المطور',
            data: { message: 'Re-login required' }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

module.exports = {
    getAllUsers, toggleUserStatus, changeUserRole, getAuditLogs, getStats,
    forceCheck, resetCheckin, resetWill, getTimeUnit, getTriggeredWills, getEmailMode,
    getAllWills, bootstrapDeveloper
};
