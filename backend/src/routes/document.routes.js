const router = require('express').Router();
const {
    uploadDocument,
    getDocuments,
    downloadDocument,
    deleteDocument,
    verifyDocument
} = require('../controllers/document.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../config/multer');

router.use(authenticate);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/download/:id', downloadDocument);
router.post('/verify/:id', verifyDocument);
router.get('/:willId', getDocuments);
router.delete('/:id', deleteDocument);

module.exports = router;
