const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { encryptText } = require('../services/encryption.service');

const toPublicAsset = (row) => ({
    id: row.id,
    will_id: row.will_id,
    asset_type: row.asset_type,
    title: row.title,
    content_encrypted: row.content,
    iv: row.iv,
    created_at: row.created_at,
    updated_at: row.updated_at,
});

const assertWillOwner = async (willId, userId) => {
    const will = await pool.query(
        'SELECT id FROM wills WHERE id = $1 AND user_id = $2',
        [willId, userId]
    );
    return will.rows.length > 0;
};

const getAssets = async (req, res) => {
    try {
        const { willId } = req.params;

        if (!(await assertWillOwner(willId, req.user.id))) {
            return res.status(404).json({ success: false, message: 'الوصية غير موجودة' });
        }

        const result = await pool.query(
            'SELECT id, will_id, asset_type, title, content, iv, created_at, updated_at FROM assets WHERE will_id = $1 ORDER BY created_at DESC',
            [willId]
        );

        res.json({ success: true, data: result.rows.map(toPublicAsset) });
    } catch (error) {
        console.error('getAssets error:', error);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const createAsset = async (req, res) => {
    try {
        const { will_id, asset_type, title, content } = req.body;

        if (!will_id || !asset_type || !title || !content) {
            return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
        }

        if (!(await assertWillOwner(will_id, req.user.id))) {
            return res.status(404).json({ success: false, message: 'الوصية غير موجودة' });
        }

        const { encrypted, iv } = encryptText(content, req.user.id);
        const id = uuidv4();

        await pool.query(
            `INSERT INTO assets (id, will_id, asset_type, title, content, iv)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, will_id, asset_type, title, encrypted, iv]
        );

        const result = await pool.query(
            'SELECT id, will_id, asset_type, title, content, iv, created_at, updated_at FROM assets WHERE id = $1',
            [id]
        );
        res.status(201).json({ success: true, data: toPublicAsset(result.rows[0]) });
    } catch (error) {
        console.error('createAsset error:', error);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, asset_type } = req.body;

        const existing = await pool.query(
            `SELECT a.* FROM assets a
             JOIN wills w ON a.will_id = w.id
             WHERE a.id = $1 AND w.user_id = $2`,
            [id, req.user.id]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الأصل غير موجود' });
        }

        let encrypted = existing.rows[0].content;
        let iv = existing.rows[0].iv;
        if (content != null && content !== '') {
            ({ encrypted, iv } = encryptText(content, req.user.id));
        }

        await pool.query(
            `UPDATE assets
             SET title = COALESCE($1, title),
                 asset_type = COALESCE($2, asset_type),
                 content = $3,
                 iv = $4,
                 updated_at = NOW()
             WHERE id = $5`,
            [title ?? null, asset_type ?? null, encrypted, iv, id]
        );

        const result = await pool.query(
            'SELECT id, will_id, asset_type, title, content, iv, created_at, updated_at FROM assets WHERE id = $1',
            [id]
        );
        res.json({ success: true, data: toPublicAsset(result.rows[0]) });
    } catch (error) {
        console.error('updateAsset error:', error);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const deleteAsset = async (req, res) => {
    try {
        const { id } = req.params;

        const affected = await pool.query(
            `DELETE FROM assets
             WHERE id = $1 AND will_id IN (SELECT id FROM wills WHERE user_id = $2)`,
            [id, req.user.id]
        );

        if (affected.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'الأصل غير موجود' });
        }

        res.json({ success: true, message: 'تم الحذف بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

module.exports = { getAssets, createAsset, updateAsset, deleteAsset };
