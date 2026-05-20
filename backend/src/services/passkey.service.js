const pool = require('../config/database');
const { getWebAuthnConfig } = require('../config/webauthn');

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const challenges = new Map();

const setChallenge = (key, challenge) => {
    challenges.set(key, { challenge, expires: Date.now() + CHALLENGE_TTL_MS });
};

const consumeChallenge = (key) => {
    const entry = challenges.get(key);
    challenges.delete(key);
    if (!entry || Date.now() > entry.expires) return null;
    return entry.challenge;
};

const userIdToBuffer = (userId) => Buffer.from(userId, 'utf8');

const getPasskeyCount = async (userId) => {
    try {
        const r = await pool.query('SELECT COUNT(*) AS c FROM passkeys WHERE user_id = $1', [userId]);
        return Number(r.rows[0].c);
    } catch {
        return 0;
    }
};

const get2FAMethods = async (userId) => {
    const user = await pool.query(
        'SELECT two_fa_secret, two_fa_enabled FROM users WHERE id = $1',
        [userId]
    );
    const passkeyCount = await getPasskeyCount(userId);
    return {
        totp: !!user.rows[0]?.two_fa_secret,
        passkey: passkeyCount > 0,
        enabled: !!user.rows[0]?.two_fa_enabled,
    };
};

const listUserPasskeys = async (userId) => {
    const r = await pool.query(
        `SELECT id, device_name, created_at, last_used_at, transports
         FROM passkeys WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    return r.rows;
};

const getUserPasskeysForAuth = async (userId) => {
    const r = await pool.query(
        'SELECT credential_id, public_key, counter, transports FROM passkeys WHERE user_id = $1',
        [userId]
    );
    return r.rows.map((row) => ({
        id: row.credential_id,
        publicKey: Buffer.from(row.public_key, 'base64'),
        counter: Number(row.counter),
        transports: row.transports ? row.transports.split(',') : undefined,
    }));
};

const findPasskeyByCredentialId = async (credentialId) => {
    const r = await pool.query('SELECT * FROM passkeys WHERE credential_id = $1', [credentialId]);
    return r.rows[0] || null;
};

const updatePasskeyCounter = async (id, counter) => {
    await pool.query(
        'UPDATE passkeys SET counter = $1, last_used_at = NOW() WHERE id = $2',
        [counter, id]
    );
};

const enable2FAIfNeeded = async (userId) => {
    await pool.query('UPDATE users SET two_fa_enabled = 1 WHERE id = $1', [userId]);
};

const deleteAllPasskeys = async (userId) => {
    await pool.query('DELETE FROM passkeys WHERE user_id = $1', [userId]);
};

module.exports = {
    getWebAuthnConfig,
    setChallenge,
    consumeChallenge,
    userIdToBuffer,
    getPasskeyCount,
    get2FAMethods,
    listUserPasskeys,
    getUserPasskeysForAuth,
    findPasskeyByCredentialId,
    updatePasskeyCounter,
    enable2FAIfNeeded,
    deleteAllPasskeys,
};
