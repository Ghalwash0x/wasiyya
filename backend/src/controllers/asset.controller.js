const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { encryptText, decryptText } = require('../services/encryption.service');

const toPublicAsset = (row, userId) => ({
    id:                row.id,
    will_id:           row.will_id,
    asset_type:        row.asset_type,
    title:             decryptText(row.title, row.title_iv, userId),
    content_encrypted: row.content,
    iv:                row.iv,
    created_at:        row.created_at,
    updated_at:        row.updated_at,
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
            'SELECT id, will_id, asset_type, title, title_iv, content, iv, created_at, updated_at FROM assets WHERE will_id = $1 ORDER BY created_at DESC',
            [willId]
        );

        res.json({ success: true, data: result.rows.map(r => toPublicAsset(r, req.user.id)) });
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

        const { encrypted: encTitle, iv: titleIv } = encryptText(title,   req.user.id);
        const { encrypted: encContent, iv: contentIv } = encryptText(content, req.user.id);

        const id = uuidv4();
        await pool.query(
            `INSERT INTO assets (id, will_id, asset_type, title, title_iv, content, iv)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, will_id, asset_type, encTitle, titleIv, encContent, contentIv]
        );

        const result = await pool.query(
            'SELECT id, will_id, asset_type, title, title_iv, content, iv, created_at, updated_at FROM assets WHERE id = $1',
            [id]
        );
        res.status(201).json({ success: true, data: toPublicAsset(result.rows[0], req.user.id) });
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

        const row = existing.rows[0];

        let encTitle   = row.title;
        let titleIv    = row.title_iv;
        if (title != null && title !== '') {
            ({ encrypted: encTitle, iv: titleIv } = encryptText(title, req.user.id));
        }

        let encContent = row.content;
        let contentIv  = row.iv;
        if (content != null && content !== '') {
            ({ encrypted: encContent, iv: contentIv } = encryptText(content, req.user.id));
        }

        await pool.query(
            `UPDATE assets
             SET title      = $1,
                 title_iv   = $2,
                 asset_type = COALESCE($3, asset_type),
                 content    = $4,
                 iv         = $5,
                 updated_at = NOW()
             WHERE id = $6`,
            [encTitle, titleIv, asset_type ?? null, encContent, contentIv, id]
        );

        const result = await pool.query(
            'SELECT id, will_id, asset_type, title, title_iv, content, iv, created_at, updated_at FROM assets WHERE id = $1',
            [id]
        );
        res.json({ success: true, data: toPublicAsset(result.rows[0], req.user.id) });
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
        console.error('deleteAsset error:', error);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

module.exports = { getAssets, createAsset, updateAsset, deleteAsset };
