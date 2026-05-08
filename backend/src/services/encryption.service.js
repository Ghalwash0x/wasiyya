// Phase 1: Passthrough — no encryption
// Phase 2: Add AES-256-CBC here

function encryptText(plaintext) {
    return { encrypted: plaintext, iv: null };
}

function decryptText(encrypted, iv) {
    return encrypted;
}

async function encryptFile(inputPath, outputPath) {
    return { encryptedPath: inputPath, iv: null };
}

async function decryptFile(encryptedPath, iv, outputPath) {
    return encryptedPath;
}

module.exports = { encryptText, decryptText, encryptFile, decryptFile };
