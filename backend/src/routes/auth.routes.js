const router    = require('express').Router();
const passport  = require('../middleware/passport');
const jwt       = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool      = require('../config/database');
const { register, login, getMe, logout } = require('../controllers/auth.controller');
const { setup2FA, enable2FA, verify2FA, disable2FA } = require('../controllers/twofa.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        authenticate, getMe);
router.post('/logout',   authenticate, logout);

// 2FA routes
router.get('/2fa/setup',    authenticate, setup2FA);
router.post('/2fa/enable',  authenticate, enable2FA);
router.post('/2fa/verify',  verify2FA);
router.post('/2fa/disable', authenticate, disable2FA);

// OAuth helper — issues JWT and redirects to frontend
const oauthSuccess = async (req, res) => {
    try {
        const user = req.user;
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action) VALUES ($1, $2, $3)',
            [uuidv4(), user.id, 'OAUTH_LOGIN']
        );
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login?token=${token}&role=${user.role}`);
    } catch {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
};

// Google OAuth
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_failed' }),
    oauthSuccess
);

// GitHub OAuth
router.get('/github',
    passport.authenticate('github', { scope: ['user:email'], session: false })
);
router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/login?error=github_failed' }),
    oauthSuccess
);

module.exports = router;
