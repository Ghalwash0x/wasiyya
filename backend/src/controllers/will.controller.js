const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const getMyWill = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM wills WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const createWill = async (req, res) => {
    try {
        const { title, description, checkin_interval_days, grace_period_days } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: 'عنوان الوصية مطلوب' });
        }

        const existing = await pool.query('SELECT id FROM wills WHERE user_id = $1', [req.user.id]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'لديك وصية بالفعل. يمكنك تعديلها فقط' });
        }

        const id = uuidv4();
        await pool.query(
            `INSERT INTO wills (id, user_id, title, description, checkin_interval_days, grace_period_days)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, req.user.id, title, description || null, checkin_interval_days || 30, grace_period_days || 7]
        );

        const result = await pool.query('SELECT * FROM wills WHERE id = $1', [id]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const updateWill = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, checkin_interval_days, grace_period_days } = req.body;

        const affected = await pool.query(
            `UPDATE wills
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 checkin_interval_days = COALESCE($3, checkin_interval_days),
                 grace_period_days = COALESCE($4, grace_period_days),
                 updated_at = NOW()
             WHERE id = $5 AND user_id = $6`,
            [title, description, checkin_interval_days, grace_period_days, id, req.user.id]
        );

        if (affected.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'الوصية غير موجودة' });
        }

        const result = await pool.query('SELECT * FROM wills WHERE id = $1', [id]);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const deleteWill = async (req, res) => {
    try {
        const { id } = req.params;
        const affected = await pool.query(
            'DELETE FROM wills WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (affected.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'الوصية غير موجودة' });
        }

        res.json({ success: true, message: 'تم حذف الوصية بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

module.exports = { getMyWill, createWill, updateWill, deleteWill };
