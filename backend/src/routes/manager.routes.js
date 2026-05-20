const router = require('express').Router();
const { getAllDocuments, verifyDocument, getStats } = require('../controllers/manager.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/rbac.middleware');

router.use(authenticate, authorize('manager'));

router.get('/documents',           getAllDocuments);
router.post('/documents/:id/verify', verifyDocument);
router.get('/stats',               getStats);

module.exports = router;
