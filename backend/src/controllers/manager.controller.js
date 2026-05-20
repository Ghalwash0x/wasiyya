const pool   = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { decryptFile }                    = require('../services/encryption.service');
const { generateHash, verifySignature }  = require('../services/signature.service');

// All document metadata across system — NEVER returns stored_path, iv, or file bytes
const getAllDocuments = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                d.id, d.original_name, d.file_size, d.mime_type,
                d.sha256_hash, d.signature, d.uploaded_at,
                w.id AS will_id, w.title AS will_title, w.status AS will_status,
                u.full_name AS owner_name, u.email AS owner_email
            FROM documents d
            JOIN wills    w ON d.will_id  = w.id
            JOIN users    u ON w.user_id  = u.id
            ORDER BY d.uploaded_at DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Manager getAllDocuments error:', error);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// Verify integrity of any document — decrypts in-memory, returns verdict only (no file bytes)
const verifyDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الملف غير موجود' });
        }

        const doc = result.rows[0];

        if (!doc.sha256_hash) {
            return res.json({
                success: true,
                intact:  false,
                message: 'الملف لا يحتوي على hash — رُفع قبل تفعيل التحقق'
            });
        }

        // Decrypt in-memory → re-hash → compare (plainBuffer is NOT sent to client)
        const plainBuffer  = decryptFile(doc.stored_path, doc.iv);
        const currentHash  = generateHash(plainBuffer);
        const hashMatch    = currentHash === doc.sha256_hash;
        const sigValid     = doc.signature ? verifySignature(doc.sha256_hash, doc.signature) : null;

        // Log the manager's verification action
        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)',
            [uuidv4(), req.user.id, 'MANAGER_VERIFY_DOC', JSON.stringify({ doc_id: id, intact: hashMatch })]
        );

        res.json({
            success:         true,
            intact:          hashMatch && (sigValid !== false),
            hash_match:      hashMatch,
            signature_valid: sigValid,
            stored_hash:     doc.sha256_hash,
            current_hash:    currentHash,
            message: hashMatch
                ? (sigValid ? '✅ الملف سليم والتوقيع صحيح' : '✅ الملف سليم (بدون توقيع)')
                : '❌ الملف تم التلاعب به أو تعديله'
        });
    } catch (error) {
        console.error('Manager verifyDocument error:', error);
        res.status(500).json({ success: false, message: 'خطأ في التحقق' });
    }
};

// Aggregate stats for manager dashboard
const getStats = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM documents)                                       AS total_documents,
                (SELECT COUNT(*) FROM documents WHERE sha256_hash IS NOT NULL)         AS encrypted_documents,
                (SELECT COUNT(*) FROM documents WHERE signature   IS NOT NULL)         AS signed_documents,
                (SELECT COUNT(*) FROM wills)                                           AS total_wills,
                (SELECT COUNT(*) FROM wills   WHERE status = 'triggered')              AS triggered_wills,
                (SELECT COUNT(*) FROM users   WHERE role   = 'user' AND is_active = 1) AS active_users
        `);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

module.exports = { getAllDocuments, verifyDocument, getStats };
