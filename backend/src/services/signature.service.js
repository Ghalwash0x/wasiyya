// Phase 1: Passthrough — no signing
// Phase 2: Add SHA-256 + RSA here

const crypto = require('crypto');

function generateHash(fileBuffer) {
    // Phase 2: return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    return null;
}

function signHash(hash) {
    return null;
}

function verifySignature(hash, signature) {
    return true;
}

module.exports = { generateHash, signHash, verifySignature };
