const router = require('express').Router();
const { getMyWill, createWill, updateWill, deleteWill } = require('../controllers/will.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', getMyWill);
router.post('/', createWill);
router.put('/:id', updateWill);
router.delete('/:id', deleteWill);

module.exports = router;
