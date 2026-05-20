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
const passkey = require('../controllers/passkey.controller');
const { get2FAMethods } = require('../services/passkey.service');
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
router.get('/2fa/methods', passkey.getMethodsForLogin);

// Passkey (WebAuthn) 2FA
router.get('/passkey/register-options', authenticate, passkey.registerOptions);
router.post('/passkey/register-verify', authenticate, passkey.registerVerify);
router.get('/passkey/list', authenticate, passkey.listPasskeys);
router.delete('/passkey/:id', authenticate, passkey.deletePasskey);
router.get('/passkey/action-options', authenticate, passkey.actionOptions);
router.post('/passkey/login-options', passkey.loginOptions);
router.post('/passkey/login-verify', passkey.loginVerify);

const issueOAuthLogin = async (res, user) => {
    const base = `${frontendUrl()}/login`;

    if (user.two_fa_enabled) {
        const tempToken = jwt.sign(
            { userId: user.id, pending2FA: true },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );
        const methods = await get2FAMethods(user.id);
        const q = new URLSearchParams({
            requires2FA: '1',
            tempToken,
            totp: methods.totp ? '1' : '0',
            passkey: methods.passkey ? '1' : '0',
        });
        return res.redirect(`${base}?${q.toString()}`);
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
                return await oauthRegisterCallback(res, oauthProfile);
            }
            return await oauthLoginCallback(res, oauthProfile);
        } catch (e) {
            console.error(`OAuth callback (${provider}):`, e.message || e);
            const page = req.query.state === 'register' ? 'register' : 'login';
            return res.redirect(`${frontendUrl()}/${page}?error=oauth_failed`);
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
    const page = mode === 'register' ? 'register' : 'login';
    const scope = provider === 'google' ? ['profile', 'email'] : ['user:email'];

    passport.authenticate(provider, { scope, session: true, state: mode })(req, res, (err) => {
        if (err) {
            console.error(`OAuth start (${provider}):`, err.message || err);
            return res.redirect(`${frontendUrl()}/${page}?error=oauth_failed`);
        }
        if (res.headersSent) return;
        next(err);
    });
};

const handleOAuthRouteError = (err, req, res, next) => {
    console.error('OAuth route error:', err.message || err);
    if (res.headersSent) return next(err);
    const page = (req.query?.state === 'register' || req.originalUrl?.includes('register'))
        ? 'register'
        : 'login';
    res.redirect(`${frontendUrl()}/${page}?error=oauth_failed`);
};

router.get('/google', requireOAuth('google'), startOAuth('google'));
router.get('/google/callback', requireOAuth('google'), handleOAuthCallback('google'));

router.get('/github', requireOAuth('github'), startOAuth('github'));
router.get('/github/callback', requireOAuth('github'), handleOAuthCallback('github'));

router.use(handleOAuthRouteError);

module.exports = router;
