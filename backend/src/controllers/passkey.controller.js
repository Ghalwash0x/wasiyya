const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const pool = require('../config/database');
const {
    getWebAuthnConfig,
    setChallenge,
    consumeChallenge,
    userIdToBuffer,
    get2FAMethods,
    listUserPasskeys,
    getUserPasskeysForAuth,
    findPasskeyByCredentialId,
    updatePasskeyCounter,
    enable2FAIfNeeded,
} = require('../services/passkey.service');

const issueLoginSuccess = async (req, res, user) => {
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    await pool.query(
        'INSERT INTO audit_logs (id, user_id, action, ip_address) VALUES ($1, $2, $3, $4)',
        [uuidv4(), user.id, 'USER_LOGIN_PASSKEY', req.ip]
    );
    const { password: _, two_fa_secret: __, ...safeUser } = user;
    res.json({ success: true, message: 'تم تسجيل الدخول بنجاح', data: { user: safeUser, token } });
};

const verifyTempToken = (tempToken) => {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (!decoded.pending2FA) throw new Error('invalid');
    return decoded.userId;
};

// GET /api/auth/passkey/register-options
const registerOptions = async (req, res) => {
    try {
        const { rpName, rpID } = getWebAuthnConfig();
        const existing = await getUserPasskeysForAuth(req.user.id);

        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userName: req.user.email,
            userDisplayName: req.user.full_name,
            userID: userIdToBuffer(req.user.id),
            attestationType: 'none',
            excludeCredentials: existing.map((c) => ({
                id: c.id,
                transports: c.transports,
            })),
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
            },
        });

        setChallenge(`reg:${req.user.id}`, options.challenge);

        res.json({ success: true, data: options });
    } catch (error) {
        console.error('passkey registerOptions:', error);
        res.status(500).json({ success: false, message: 'خطأ في إعداد Passkey' });
    }
};

// POST /api/auth/passkey/register-verify  { response, device_name? }
const registerVerify = async (req, res) => {
    try {
        const { response, device_name } = req.body;
        if (!response) {
            return res.status(400).json({ success: false, message: 'بيانات Passkey مطلوبة' });
        }

        const { origin, rpID } = getWebAuthnConfig();
        const expectedChallenge = consumeChallenge(`reg:${req.user.id}`);
        if (!expectedChallenge) {
            return res.status(400).json({ success: false, message: 'انتهت صلاحية الجلسة — أعد المحاولة' });
        }

        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });

        if (!verification.verified || !verification.registrationInfo) {
            return res.status(400).json({ success: false, message: 'فشل التحقق من Passkey' });
        }

        const { credential } = verification.registrationInfo;
        const id = uuidv4();

        await pool.query(
            `INSERT INTO passkeys (id, user_id, credential_id, public_key, counter, device_name, transports)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                id,
                req.user.id,
                credential.id,
                Buffer.from(credential.publicKey).toString('base64'),
                credential.counter,
                (device_name || 'جهاز').trim().slice(0, 255),
                (credential.transports || []).join(','),
            ]
        );

        await enable2FAIfNeeded(req.user.id);

        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, ip_address) VALUES ($1, $2, $3, $4)',
            [uuidv4(), req.user.id, 'PASSKEY_REGISTERED', req.ip]
        );

        res.json({
            success: true,
            message: 'تم تسجيل Passkey وتفعيل المصادقة الثنائية',
            data: { id, device_name: device_name || 'جهاز' },
        });
    } catch (error) {
        console.error('passkey registerVerify:', error);
        res.status(500).json({ success: false, message: 'خطأ في تسجيل Passkey' });
    }
};

// GET /api/auth/passkey/list
const listPasskeys = async (req, res) => {
    try {
        const passkeys = await listUserPasskeys(req.user.id);
        const methods = await get2FAMethods(req.user.id);
        res.json({ success: true, data: { passkeys, methods } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// DELETE /api/auth/passkey/:id
const deletePasskey = async (req, res) => {
    try {
        const affected = await pool.query(
            'DELETE FROM passkeys WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (affected.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Passkey غير موجود' });
        }

        const methods = await get2FAMethods(req.user.id);
        if (!methods.totp && !methods.passkey) {
            await pool.query(
                'UPDATE users SET two_fa_enabled = 0, two_fa_secret = NULL WHERE id = $1',
                [req.user.id]
            );
        }

        res.json({ success: true, message: 'تم حذف Passkey' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
};

// POST /api/auth/passkey/login-options  { tempToken }
const loginOptions = async (req, res) => {
    try {
        const { tempToken } = req.body;
        if (!tempToken) {
            return res.status(400).json({ success: false, message: 'tempToken مطلوب' });
        }

        let userId;
        try {
            userId = verifyTempToken(tempToken);
        } catch {
            return res.status(401).json({ success: false, message: 'التوكن منتهي أو غير صالح' });
        }

        const allowCredentials = await getUserPasskeysForAuth(userId);
        if (allowCredentials.length === 0) {
            return res.status(400).json({ success: false, message: 'لا يوجد Passkey مسجل' });
        }

        const { rpID } = getWebAuthnConfig();
        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: allowCredentials.map((c) => ({
                id: c.id,
                transports: c.transports,
            })),
            userVerification: 'preferred',
        });

        setChallenge(`login:${userId}`, options.challenge);

        res.json({ success: true, data: options });
    } catch (error) {
        console.error('passkey loginOptions:', error);
        res.status(500).json({ success: false, message: 'خطأ في إعداد Passkey' });
    }
};

// POST /api/auth/passkey/login-verify  { tempToken, response }
const loginVerify = async (req, res) => {
    try {
        const { tempToken, response } = req.body;
        if (!tempToken || !response) {
            return res.status(400).json({ success: false, message: 'tempToken و Passkey مطلوبان' });
        }

        let userId;
        try {
            userId = verifyTempToken(tempToken);
        } catch {
            return res.status(401).json({ success: false, message: 'التوكن منتهي أو غير صالح' });
        }

        const stored = await findPasskeyByCredentialId(response.id);
        if (!stored || stored.user_id !== userId) {
            return res.status(401).json({ success: false, message: 'Passkey غير معروف' });
        }

        const { origin, rpID } = getWebAuthnConfig();
        const expectedChallenge = consumeChallenge(`login:${userId}`);
        if (!expectedChallenge) {
            return res.status(400).json({ success: false, message: 'انتهت صلاحية الجلسة — أعد المحاولة' });
        }

        const verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            credential: {
                id: stored.credential_id,
                publicKey: Buffer.from(stored.public_key, 'base64'),
                counter: Number(stored.counter),
                transports: stored.transports ? stored.transports.split(',') : undefined,
            },
        });

        if (!verification.verified) {
            return res.status(401).json({ success: false, message: 'فشل التحقق من Passkey' });
        }

        const newCounter = verification.authenticationInfo.newCounter;
        await updatePasskeyCounter(stored.id, newCounter);

        const userResult = await pool.query(
            'SELECT * FROM users WHERE id = $1 AND is_active = 1',
            [userId]
        );
        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
        }

        await issueLoginSuccess(req, res, userResult.rows[0]);
    } catch (error) {
        console.error('passkey loginVerify:', error);
        res.status(500).json({ success: false, message: 'خطأ في التحقق' });
    }
};

// GET /api/auth/passkey/action-options — confirm identity (e.g. disable 2FA)
const actionOptions = async (req, res) => {
    try {
        const allowCredentials = await getUserPasskeysForAuth(req.user.id);
        if (allowCredentials.length === 0) {
            return res.status(400).json({ success: false, message: 'لا يوجد Passkey مسجل' });
        }

        const { rpID } = getWebAuthnConfig();
        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: allowCredentials.map((c) => ({
                id: c.id,
                transports: c.transports,
            })),
            userVerification: 'preferred',
        });

        setChallenge(`action:${req.user.id}`, options.challenge);

        res.json({ success: true, data: options });
    } catch (error) {
        console.error('passkey actionOptions:', error);
        res.status(500).json({ success: false, message: 'خطأ في إعداد Passkey' });
    }
};

// GET /api/auth/2fa/methods?tempToken= — for OAuth login step
const getMethodsForLogin = async (req, res) => {
    try {
        const { tempToken } = req.query;
        if (!tempToken) {
            return res.status(400).json({ success: false, message: 'tempToken مطلوب' });
        }
        const userId = verifyTempToken(tempToken);
        const methods = await get2FAMethods(userId);
        res.json({ success: true, data: methods });
    } catch {
        res.status(401).json({ success: false, message: 'توكن غير صالح' });
    }
};

module.exports = {
    registerOptions,
    registerVerify,
    listPasskeys,
    deletePasskey,
    actionOptions,
    loginOptions,
    loginVerify,
    getMethodsForLogin,
};
