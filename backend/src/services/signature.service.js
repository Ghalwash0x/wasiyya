const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const PRIVATE_KEY_PATH = path.join(__dirname, '../../certs/private.pem');
const PUBLIC_KEY_PATH  = path.join(__dirname, '../../certs/public.pem');

// Auto-generate RSA-2048 key pair if not present
function ensureRSAKeys() {
    if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) return;

    const certsDir = path.dirname(PRIVATE_KEY_PATH);
    if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });

    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding:  { type: 'spki',  format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
    fs.writeFileSync(PUBLIC_KEY_PATH,  publicKey);
    console.log('🔑 RSA key pair generated at certs/');
}

function getPrivateKey() {
    ensureRSAKeys();
    return fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
}

function getPublicKey() {
    ensureRSAKeys();
    return fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
}

// SHA-256 hash of a Buffer → hex string
function generateHash(fileBuffer) {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

// Sign a hex hash string with RSA private key → hex signature
function signHash(hash) {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(hash);
    return sign.sign(getPrivateKey(), 'hex');
}

// Verify a hex signature against a hex hash → boolean
function verifySignature(hash, signature) {
    try {
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(hash);
        return verify.verify(getPublicKey(), signature, 'hex');
    } catch {
        return false;
    }
}

// Called once at startup to ensure keys exist
ensureRSAKeys();

module.exports = { generateHash, signHash, verifySignature };
