const getWebAuthnConfig = () => {
    const origin = (process.env.WEBAUTHN_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    let rpID = process.env.WEBAUTHN_RP_ID;
    if (!rpID) {
        try {
            rpID = new URL(origin).hostname;
        } catch {
            rpID = 'localhost';
        }
    }
    return {
        rpName: process.env.WEBAUTHN_RP_NAME || 'Wasiyya',
        rpID,
        origin,
    };
};

module.exports = { getWebAuthnConfig };
