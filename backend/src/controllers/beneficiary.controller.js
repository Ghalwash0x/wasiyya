const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const getBeneficiaries = async (req, res) => {
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
            `SELECT id, name, email, phone, relationship, notified_at, accessed_at, created_at
             FROM beneficiaries WHERE will_id = $1 ORDER BY created_at DESC`,
            [willId]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const addBeneficiary = async (req, res) => {
    try {
        const { will_id, name, email, phone, relationship } = req.body;

        if (!will_id || !name || !email) {
            return res.status(400).json({ success: false, message: 'will_id والاسم والبريد الإلكتروني مطلوبان' });
        }

        const will = await pool.query(
            'SELECT id FROM wills WHERE id = $1 AND user_id = $2',
            [will_id, req.user.id]
        );
        if (will.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الوصية غير موجودة' });
        }

        const id = uuidv4();
        await pool.query(
            `INSERT INTO beneficiaries (id, will_id, name, email, phone, relationship)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, will_id, name, email, phone || null, relationship || null]
        );

        const result = await pool.query('SELECT * FROM beneficiaries WHERE id = $1', [id]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const deleteBeneficiary = async (req, res) => {
    try {
        const { id } = req.params;

        const affected = await pool.query(
            `DELETE FROM beneficiaries
             WHERE id = $1 AND will_id IN (SELECT id FROM wills WHERE user_id = $2)`,
            [id, req.user.id]
        );

        if (affected.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'الوصي غير موجود' });
        }

        res.json({ success: true, message: 'تم الحذف بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const getBeneficiaryAccess = async (req, res) => {
    try {
        const { token } = req.params;

        const result = await pool.query(
            `SELECT b.*, w.title AS will_title, w.description AS will_description, w.id AS will_id
             FROM beneficiaries b
             JOIN wills w ON b.will_id = w.id
             WHERE b.access_token = $1 AND b.token_expires > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الرابط غير صالح أو منتهي الصلاحية' });
        }

        const ben = result.rows[0];

        await pool.query(
            'UPDATE beneficiaries SET accessed_at = NOW() WHERE id = $1',
            [ben.id]
        );

        const assets = await pool.query(
            'SELECT id, asset_type, title, content FROM assets WHERE will_id = $1',
            [ben.will_id]
        );

        const documents = await pool.query(
            `SELECT id, original_name, file_size, mime_type, uploaded_at
             FROM documents WHERE will_id = $1`,
            [ben.will_id]
        );

        res.json({
            success: true,
            data: {
                beneficiary: { name: ben.name, email: ben.email },
                will: { title: ben.will_title, description: ben.will_description },
                assets: assets.rows,
                documents: documents.rows
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

module.exports = { getBeneficiaries, addBeneficiary, deleteBeneficiary, getBeneficiaryAccess };
