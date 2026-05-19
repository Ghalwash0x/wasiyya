const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const fs   = require('fs');
const { encryptFile, decryptFile } = require('../services/encryption.service');
const { generateHash, signHash, verifySignature } = require('../services/signature.service');

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

        // 1. Read original buffer → hash → sign (before encryption)
        const originalBuffer = fs.readFileSync(req.file.path);
        const hash      = generateHash(originalBuffer);
        const signature = signHash(hash);

        // 2. Encrypt the file in-place, get "ivHex:authTagHex"
        const ivField = encryptFile(req.file.path);

        const id = uuidv4();
        await pool.query(
            `INSERT INTO documents
             (id, will_id, original_name, stored_name, stored_path, file_size, mime_type, sha256_hash, signature, iv)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [id, will_id, req.file.originalname, req.file.filename, req.file.path,
             req.file.size, req.file.mimetype, hash, signature, ivField]
        );

        const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Upload error:', error);
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

        // Decrypt in memory → send buffer (does not modify the stored encrypted file)
        const plainBuffer = decryptFile(doc.stored_path, doc.iv);

        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.original_name)}"`);
        res.setHeader('Content-Type', doc.mime_type);
        res.send(plainBuffer);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await pool.query(
            `SELECT d.* FROM documents d
             JOIN wills w ON d.will_id = w.id
             WHERE d.id = $1 AND w.user_id = $2`,
            [id, req.user.id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الملف غير موجود' });
        }

        await pool.query('DELETE FROM documents WHERE id = $1', [id]);
        try { fs.unlinkSync(existing.rows[0].stored_path); } catch (_) {}

        res.json({ success: true, message: 'تم حذف الملف بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

const verifyDocument = async (req, res) => {
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

        if (!doc.sha256_hash) {
            return res.json({
                success: true,
                intact: false,
                message: 'الملف لا يحتوي على hash — رُفع قبل تفعيل التحقق'
            });
        }

        // Decrypt the stored file → re-hash → compare
        const plainBuffer  = decryptFile(doc.stored_path, doc.iv);
        const currentHash  = generateHash(plainBuffer);
        const hashMatch    = currentHash === doc.sha256_hash;
        const sigValid     = doc.signature ? verifySignature(doc.sha256_hash, doc.signature) : null;

        res.json({
            success:         true,
            intact:          hashMatch && (sigValid !== false),
            hash_match:      hashMatch,
            signature_valid: sigValid,
            stored_hash:     doc.sha256_hash,
            current_hash:    currentHash,
            message:         hashMatch
                ? (sigValid ? '✅ الملف سليم والتوقيع صحيح' : '✅ الملف سليم (بدون توقيع)')
                : '❌ الملف تم التلاعب به أو تعديله'
        });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ success: false, message: 'خطأ في التحقق' });
    }
};

module.exports = { uploadDocument, getDocuments, downloadDocument, deleteDocument, verifyDocument };
