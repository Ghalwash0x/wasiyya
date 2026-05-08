const router = require('express').Router();
const { doCheckin, getCheckinStatus } = require('../controllers/checkin.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/', doCheckin);
router.get('/status', getCheckinStatus);

module.exports = router;
