const crypto = require('crypto');
const fs     = require('fs');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

const getKey = () => {
    const hex = process.env.AES_SECRET_KEY;
    if (!hex || hex.length !== 64) {
        throw new Error('AES_SECRET_KEY must be a 64-character hex string (32 bytes) in .env');
    }
    return Buffer.from(hex, 'hex');
};

// Encrypt a Buffer → returns { encryptedBuffer, ivHex, authTagHex }
function encryptBuffer(plainBuffer) {
    const key    = getKey();
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

// Decrypt a Buffer → returns plainBuffer
function decryptBuffer(encryptedBuffer, ivHex, authTagHex) {
    const key      = getKey();
    const iv       = Buffer.from(ivHex, 'hex');
    const authTag  = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

// Encrypt a file on disk in-place, returns "ivHex:authTagHex" for DB storage
function encryptFile(filePath) {
    const plainBuffer = fs.readFileSync(filePath);
    const { encryptedBuffer, ivHex, authTagHex } = encryptBuffer(plainBuffer);
    fs.writeFileSync(filePath, encryptedBuffer);
    return `${ivHex}:${authTagHex}`;
}

// Decrypt a file on disk → returns plainBuffer (does NOT modify the file)
function decryptFile(filePath, ivField) {
    const [ivHex, authTagHex] = (ivField || '').split(':');
    if (!ivHex || !authTagHex) {
        // File was stored before encryption was enabled — return as-is
        return fs.readFileSync(filePath);
    }
    const encryptedBuffer = fs.readFileSync(filePath);
    return decryptBuffer(encryptedBuffer, ivHex, authTagHex);
}

// Legacy passthrough stubs kept for interface compatibility
function encryptText(plaintext) { return { encrypted: plaintext, iv: null }; }
function decryptText(encrypted) { return encrypted; }

module.exports = { encryptBuffer, decryptBuffer, encryptFile, decryptFile, encryptText, decryptText };
