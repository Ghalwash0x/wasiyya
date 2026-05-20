const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { encryptText, decryptText } = require('../services/encryption.service');

const decryptWill = (row, userId) => ({
    ...row,
    title:       decryptText(row.title,       row.title_iv,       userId),
    description: decryptText(row.description, row.description_iv, userId),
});

const getMyWill = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM wills WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ success: true, data: result.rows.map(r => decryptWill(r, req.user.id)) });
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

        const { encrypted: encTitle, iv: titleIv }             = encryptText(title,       req.user.id);
        const { encrypted: encDesc,  iv: descIv  }             = encryptText(description, req.user.id);

        const id = uuidv4();
        await pool.query(
            `INSERT INTO wills (id, user_id, title, title_iv, description, description_iv, checkin_interval_days, grace_period_days)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [id, req.user.id, encTitle, titleIv, encDesc || null, descIv || null, checkin_interval_days || 30, grace_period_days || 7]
        );

        const result = await pool.query('SELECT * FROM wills WHERE id = $1', [id]);
        res.status(201).json({ success: true, data: decryptWill(result.rows[0], req.user.id) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const updateWill = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, checkin_interval_days, grace_period_days } = req.body;

        const encTitle = title       != null ? encryptText(title,       req.user.id) : null;
        const encDesc  = description != null ? encryptText(description, req.user.id) : null;

        const affected = await pool.query(
            `UPDATE wills
             SET title             = COALESCE($1, title),
                 title_iv          = COALESCE($2, title_iv),
                 description       = COALESCE($3, description),
                 description_iv    = COALESCE($4, description_iv),
                 checkin_interval_days = COALESCE($5, checkin_interval_days),
                 grace_period_days     = COALESCE($6, grace_period_days),
                 updated_at        = NOW()
             WHERE id = $7 AND user_id = $8`,
            [
                encTitle?.encrypted ?? null, encTitle?.iv ?? null,
                encDesc?.encrypted  ?? null, encDesc?.iv  ?? null,
                checkin_interval_days ?? null, grace_period_days ?? null,
                id, req.user.id
            ]
        );

        if (affected.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'الوصية غير موجودة' });
        }

        const result = await pool.query('SELECT * FROM wills WHERE id = $1', [id]);
        res.json({ success: true, data: decryptWill(result.rows[0], req.user.id) });
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
