const router = require('express').Router();
const {
    getAllUsers, deleteUser, setRole, toggleUser, resetPassword,
    restoreWill, clear2FA, getSystemStats, getAuditLogs
} = require('../controllers/developer.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/rbac.middleware');

router.use(authenticate, authorize('developer'));

// User management
router.get('/users',                    getAllUsers);
router.delete('/users/:id',             deleteUser);
router.put('/users/:id/role',           setRole);
router.put('/users/:id/toggle',         toggleUser);
router.put('/users/:id/reset-password', resetPassword);
router.delete('/users/:id/2fa',         clear2FA);

// Will management
router.post('/wills/:id/restore',       restoreWill);

// System
router.get('/stats',                    getSystemStats);
router.get('/logs',                     getAuditLogs);

module.exports = router;
