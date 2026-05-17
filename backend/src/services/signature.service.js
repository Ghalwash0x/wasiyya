// Phase 1: SHA-256 hash for document integrity verification
// Phase 2: Add RSA signing here

const crypto = require('crypto');

function generateHash(fileBuffer) {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

function signHash(hash) {
    // Phase 2: RSA private key signing
    return null;
}

function verifySignature(hash, signature) {
    // Phase 2: RSA signature verification
    return true;
}

module.exports = { generateHash, signHash, verifySignature };
