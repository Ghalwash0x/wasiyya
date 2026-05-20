/**
 * Client-side AES-256-GCM decryption for asset content.
 * Key is fetched once per session from GET /api/auth/wallet-key (owner only).
 */

const hexToBytes = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
};

const importKey = async (keyHex) =>
    crypto.subtle.importKey(
        'raw',
        hexToBytes(keyHex),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

export const decryptAssetContent = async (contentEncrypted, ivField, keyHex) => {
    if (!contentEncrypted) return '';
    if (!ivField || !keyHex) return contentEncrypted;

    const [ivHex, authTagHex] = ivField.split(':');
    if (!ivHex || !authTagHex) return contentEncrypted;

    try {
        const key = await importKey(keyHex);
        const ciphertext = Uint8Array.from(atob(contentEncrypted), (c) => c.charCodeAt(0));
        const iv = hexToBytes(ivHex);
        const authTag = hexToBytes(authTagHex);
        const combined = new Uint8Array(ciphertext.length + authTag.length);
        combined.set(ciphertext);
        combined.set(authTag, ciphertext.length);

        const plainBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv, tagLength: 128 },
            key,
            combined
        );
        return new TextDecoder().decode(plainBuffer);
    } catch {
        return contentEncrypted;
    }
};

export const decryptAssets = async (assets, keyHex) =>
    Promise.all(
        assets.map(async (asset) => ({
            ...asset,
            content: await decryptAssetContent(
                asset.content_encrypted ?? asset.content,
                asset.iv,
                keyHex
            ),
        }))
    );
