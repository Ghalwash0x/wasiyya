const router = require('express').Router();
const {
    getAllUsers, toggleUserStatus, changeUserRole, getAuditLogs, getStats,
    forceCheck, resetCheckin, resetWill, getTimeUnit, getTriggeredWills, getEmailMode,
    getAllWills
} = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/rbac.middleware');

router.use(authenticate, authorize('admin'));

// User management
router.get('/users',               getAllUsers);
router.put('/users/:id/toggle',    toggleUserStatus);
router.put('/users/:id/role',      changeUserRole);

// Logs & Stats
router.get('/logs',   getAuditLogs);
router.get('/stats',  getStats);

// Testing / Dev tools
router.get('/time-unit',               getTimeUnit);
router.get('/email-mode',              getEmailMode);
router.get('/all-wills',               getAllWills);
router.get('/triggered-wills',         getTriggeredWills);
router.post('/force-check',            forceCheck);
router.post('/reset-checkin/:id',      resetCheckin);
router.post('/reset-will/:id',         resetWill);

module.exports = router;
