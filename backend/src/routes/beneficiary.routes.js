const router = require('express').Router();
const {
    getBeneficiaries,
    addBeneficiary,
    deleteBeneficiary,
    getBeneficiaryAccess
} = require('../controllers/beneficiary.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/rbac.middleware');

// Public — token-based access for beneficiaries
router.get('/access/:token', getBeneficiaryAccess);

// Protected routes (users and managers only)
router.use(authenticate, authorize('user', 'manager'));
router.get('/:willId', getBeneficiaries);
router.post('/', addBeneficiary);
router.delete('/:id', deleteBeneficiary);

module.exports = router;
