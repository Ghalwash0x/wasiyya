const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { encryptText, decryptText } = require('../services/encryption.service');

const getAssets = async (req, res) => {
    try {
        const { willId } = req.params;

        const will = await pool.query(
            'SELECT id FROM wills WHERE id = $1 AND user_id = $2',
            [willId, req.user.id]
        );
        if (will.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الوصية غير موجودة' });
        }

        const result = await pool.query(
            'SELECT * FROM assets WHERE will_id = $1 ORDER BY created_at DESC',
            [willId]
        );

        const assets = result.rows.map(asset => ({
            ...asset,
            content: decryptText(asset.content, asset.iv)
        }));

        res.json({ success: true, data: assets });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const createAsset = async (req, res) => {
    try {
        const { will_id, asset_type, title, content } = req.body;

        if (!will_id || !asset_type || !title || !content) {
            return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
        }

        const will = await pool.query(
            'SELECT id FROM wills WHERE id = $1 AND user_id = $2',
            [will_id, req.user.id]
        );
        if (will.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الوصية غير موجودة' });
        }

        const { encrypted, iv } = encryptText(content);
        const id = uuidv4();

        await pool.query(
            `INSERT INTO assets (id, will_id, asset_type, title, content, iv)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, will_id, asset_type, title, encrypted, iv]
        );

        const result = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        const { encrypted, iv } = content ? encryptText(content) : { encrypted: null, iv: null };

        const affected = await pool.query(
            `UPDATE assets
             SET title = COALESCE($1, title),
                 content = COALESCE($2, content),
                 iv = COALESCE($3, iv),
                 updated_at = NOW()
             WHERE id = $4 AND will_id IN (SELECT id FROM wills WHERE user_id = $5)`,
            [title, encrypted, iv, id, req.user.id]
        );

        if (affected.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'الأصل غير موجود' });
        }

        const result = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
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
