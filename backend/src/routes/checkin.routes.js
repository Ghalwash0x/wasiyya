const router = require('express').Router();
const { doCheckin, getCheckinStatus } = require('../controllers/checkin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/rbac.middleware');

router.use(authenticate, authorize('user', 'manager'));

router.post('/', doCheckin);
router.get('/status', getCheckinStatus);

module.exports = router;
