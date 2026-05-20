const router = require('express').Router();
const { getAssets, createAsset, updateAsset, deleteAsset } = require('../controllers/asset.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/rbac.middleware');

router.use(authenticate, authorize('user'));

router.get('/:willId', getAssets);
router.post('/', createAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

module.exports = router;
