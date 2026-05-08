const pool = require('../config/database');
const fs = require('fs');
const { generateHash, signHash } = require('../services/signature.service');

const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'لا يوجد ملف مرفوع' });
        }

        const { will_id } = req.body;
        if (!will_id) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'will_id مطلوب' });
        }

        const will = await pool.query(
            'SELECT id FROM wills WHERE id = $1 AND user_id = $2',
            [will_id, req.user.id]
        );
        if (will.rows.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: 'الوصية غير موجودة' });
        }

        const fileBuffer = fs.readFileSync(req.file.path);
        const hash = generateHash(fileBuffer);
        const signature = signHash(hash);

        const result = await pool.query(
            `INSERT INTO documents
             (will_id, original_name, stored_name, stored_path, file_size, mime_type, sha256_hash, signature)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                will_id,
                req.file.originalname,
                req.file.filename,
                req.file.path,
                req.file.size,
                req.file.mimetype,
                hash,
                signature
            ]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (req.file?.path) { try { fs.unlinkSync(req.file.path); } catch (_) {} }
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const getDocuments = async (req, res) => {
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
            `SELECT id, original_name, file_size, mime_type, sha256_hash, uploaded_at
             FROM documents WHERE will_id = $1 ORDER BY uploaded_at DESC`,
            [willId]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT d.* FROM documents d
             JOIN wills w ON d.will_id = w.id
             WHERE d.id = $1 AND w.user_id = $2`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الملف غير موجود' });
        }

        const doc = result.rows[0];
        res.download(doc.stored_path, doc.original_name);
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM documents
             WHERE id = $1 AND will_id IN (SELECT id FROM wills WHERE user_id = $2)
             RETURNING *`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الملف غير موجود' });
        }

        try { fs.unlinkSync(result.rows[0].stored_path); } catch (_) {}

        res.json({ success: true, message: 'تم حذف الملف بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const verifyDocument = async (req, res) => {
    res.json({
        success: true,
        message: 'التحقق من سلامة الملف سيكون متاحاً في المرحلة الثانية (Phase 2)',
        phase: 1
    });
};

module.exports = { uploadDocument, getDocuments, downloadDocument, deleteDocument, verifyDocument };
