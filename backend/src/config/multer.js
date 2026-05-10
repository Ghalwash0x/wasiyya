const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = process.env.UPLOAD_PATH || './uploads';
        const resolved = path.isAbsolute(dir)
            ? dir
            : path.join(process.cwd(), dir);
        try {
            fs.mkdirSync(resolved, { recursive: true });
        } catch (err) {
            return cb(err);
        }
        cb(null, resolved);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('نوع الملف غير مسموح. الأنواع المسموحة: PDF, JPG, PNG, TXT, DOC, DOCX'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE }
});

module.exports = upload;
