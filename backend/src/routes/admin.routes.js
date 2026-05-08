const router = require('express').Router();
const {
    getAllUsers,
    toggleUserStatus,
    changeUserRole,
    getAuditLogs,
    getStats
} = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate, authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.put('/users/:id/role', changeUserRole);
router.get('/logs', getAuditLogs);
router.get('/stats', getStats);

module.exports = router;
