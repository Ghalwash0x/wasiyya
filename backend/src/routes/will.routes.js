const router = require('express').Router();
const { getMyWill, createWill, updateWill, deleteWill } = require('../controllers/will.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/rbac.middleware');

router.use(authenticate, authorize('user'));

router.get('/', getMyWill);
router.post('/', createWill);
router.put('/:id', updateWill);
router.delete('/:id', deleteWill);

module.exports = router;
