const crypto = require('crypto');
const fs     = require('fs');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const getMasterKey = () => {
    const hex = process.env.AES_SECRET_KEY;
    if (!hex || hex.length !== 64) {
        throw new Error('AES_SECRET_KEY must be a 64-character hex string (32 bytes) in .env');
    }
    return Buffer.from(hex, 'hex');
};

/** Per-user key derived from master secret — same derivation used on server and exposed to owner via wallet-key */
const getUserKey = (userId) => {
    if (!userId) throw new Error('userId required for asset encryption');
    return crypto.createHmac('sha256', getMasterKey()).update(userId).digest();
};

function encryptBuffer(plainBuffer, key = getMasterKey()) {
    const iv     = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
    const authTag   = cipher.getAuthTag();
    return {
        encryptedBuffer: encrypted,
        ivHex:      iv.toString('hex'),
        authTagHex: authTag.toString('hex'),
    };
}

function decryptBuffer(encryptedBuffer, ivHex, authTagHex, key = getMasterKey()) {
    const iv       = Buffer.from(ivHex, 'hex');
    const authTag  = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

function encryptFile(filePath) {
    const plainBuffer = fs.readFileSync(filePath);
    const { encryptedBuffer, ivHex, authTagHex } = encryptBuffer(plainBuffer);
    fs.writeFileSync(filePath, encryptedBuffer);
    return `${ivHex}:${authTagHex}`;
}

function decryptFile(filePath, ivField) {
    const [ivHex, authTagHex] = (ivField || '').split(':');
    if (!ivHex || !authTagHex) {
        return fs.readFileSync(filePath);
    }
    const encryptedBuffer = fs.readFileSync(filePath);
    return decryptBuffer(encryptedBuffer, ivHex, authTagHex);
}

/** Encrypt asset text — stored as base64 ciphertext, iv column = ivHex:authTagHex */
function encryptText(plaintext, userId) {
    if (plaintext == null || plaintext === '') {
        return { encrypted: '', iv: null };
    }
    const key = getUserKey(userId);
    const iv     = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
    const authTag   = cipher.getAuthTag();
    return {
        encrypted: encrypted.toString('base64'),
        iv: `${iv.toString('hex')}:${authTag.toString('hex')}`,
    };
}

/** Decrypt asset text; returns plaintext or legacy passthrough if not encrypted */
function decryptText(encryptedB64, ivField, userId) {
    if (!encryptedB64) return '';
    if (!ivField) {
        return encryptedB64;
    }
    try {
        const [ivHex, authTagHex] = ivField.split(':');
        if (!ivHex || !authTagHex) return encryptedB64;
        const key = getUserKey(userId);
        const plain = decryptBuffer(
            Buffer.from(encryptedB64, 'base64'),
            ivHex,
            authTagHex,
            key
        );
        return plain.toString('utf8');
    } catch {
        return encryptedB64;
    }
}

function getUserKeyHex(userId) {
    return getUserKey(userId).toString('hex');
}

module.exports = {
    encryptBuffer,
    decryptBuffer,
    encryptFile,
    decryptFile,
    encryptText,
    decryptText,
    getUserKey,
    getUserKeyHex,
};
