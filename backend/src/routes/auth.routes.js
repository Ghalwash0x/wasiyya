const router    = require('express').Router();
const passport  = require('../middleware/passport');
const { findOAuthUser } = require('../middleware/passport');
const jwt       = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool      = require('../config/database');
const {
    register, login, getMe, logout,
    getPendingOAuth, registerOAuth, getWalletKey,
} = require('../controllers/auth.controller');
const { setup2FA, enable2FA, verify2FA, disable2FA } = require('../controllers/twofa.controller');
const { authenticate } = require('../middleware/auth.middleware');

const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';

router.post('/register', register);
router.post('/register/oauth', registerOAuth);
router.get('/oauth/pending', getPendingOAuth);
router.post('/login',    login);
router.get('/me',        authenticate, getMe);
router.get('/wallet-key', authenticate, getWalletKey);
router.post('/logout',   authenticate, logout);

// 2FA routes
router.get('/2fa/setup',    authenticate, setup2FA);
router.post('/2fa/enable',  authenticate, enable2FA);
router.post('/2fa/verify',  verify2FA);
router.post('/2fa/disable', authenticate, disable2FA);

const issueOAuthLogin = async (res, user) => {
    const base = `${frontendUrl()}/login`;

    if (user.two_fa_enabled) {
        const tempToken = jwt.sign(
            { userId: user.id, pending2FA: true },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );
        return res.redirect(`${base}?requires2FA=1&tempToken=${encodeURIComponent(tempToken)}`);
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    await pool.query(
        'INSERT INTO audit_logs (id, user_id, action) VALUES ($1, $2, $3)',
        [uuidv4(), user.id, 'OAUTH_LOGIN']
    );
    res.redirect(`${base}?token=${token}&role=${user.role}`);
};

const oauthLoginCallback = async (res, oauthProfile) => {
    const user = await findOAuthUser(
        oauthProfile.provider,
        oauthProfile.oauth_id,
        oauthProfile.email
    );
    if (!user) {
        return res.redirect(`${frontendUrl()}/login?error=account_not_found`);
    }
    return issueOAuthLogin(res, user);
};

const oauthRegisterCallback = async (res, oauthProfile) => {
    if (!oauthProfile.email) {
        return res.redirect(`${frontendUrl()}/register?error=oauth_no_email`);
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [oauthProfile.email]);
    if (existing.rows.length > 0) {
        return res.redirect(`${frontendUrl()}/register?error=email_exists`);
    }

    const oauthToken = jwt.sign(
        {
            pendingOAuthRegister: true,
            provider: oauthProfile.provider,
            oauth_id: oauthProfile.oauth_id,
            email: oauthProfile.email,
            full_name: oauthProfile.full_name,
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    res.redirect(`${frontendUrl()}/register?oauth_token=${oauthToken}`);
};

const handleOAuthCallback = (provider) => (req, res, next) => {
    passport.authenticate(provider, { session: false }, async (err, oauthProfile) => {
        if (err || !oauthProfile) {
            const mode = req.query.state === 'register' ? 'register' : 'login';
            const page = mode === 'register' ? 'register' : 'login';
            return res.redirect(`${frontendUrl()}/${page}?error=oauth_failed`);
        }

        try {
            const mode = req.query.state === 'register' ? 'register' : 'login';
            if (mode === 'register') {
                return oauthRegisterCallback(res, oauthProfile);
            }
            return oauthLoginCallback(res, oauthProfile);
        } catch {
            return res.redirect(`${frontendUrl()}/login?error=oauth_failed`);
        }
    })(req, res, next);
};

const requireOAuth = (provider) => (req, res, next) => {
    if (passport._strategies && passport._strategies[provider]) return next();
    const mode = req.query.mode === 'register' ? 'register' : 'login';
    const page = mode === 'register' ? 'register' : 'login';
    res.redirect(`${frontendUrl()}/${page}?error=oauth_not_configured`);
};

const startOAuth = (provider) => (req, res, next) => {
    const mode = req.query.mode === 'register' ? 'register' : 'login';
    const scope = provider === 'google' ? ['profile', 'email'] : ['user:email'];
    passport.authenticate(provider, { scope, session: false, state: mode })(req, res, next);
};

router.get('/google', requireOAuth('google'), startOAuth('google'));
router.get('/google/callback', requireOAuth('google'), handleOAuthCallback('google'));

router.get('/github', requireOAuth('github'), startOAuth('github'));
router.get('/github/callback', requireOAuth('github'), handleOAuthCallback('github'));

module.exports = router;
