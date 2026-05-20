const router = require('express').Router();
const {
    getBeneficiaries,
    addBeneficiary,
    deleteBeneficiary,
    getBeneficiaryAccess
} = require('../controllers/beneficiary.controller');
const { downloadBeneficiaryDocument } = require('../controllers/document.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/rbac.middleware');

// Public — token-based (no JWT required)
router.get('/access/:token', getBeneficiaryAccess);
router.get('/access/:token/document/:docId', downloadBeneficiaryDocument);

router.use(authenticate, authorize('user'));
router.get('/:willId', getBeneficiaries);
router.post('/', addBeneficiary);
router.delete('/:id', deleteBeneficiary);

module.exports = router;
