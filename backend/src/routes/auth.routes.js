const router = require('express').Router();
const { register, login, getMe, logout, testEmail } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.post('/test-email', authenticate, testEmail);

module.exports = router;
