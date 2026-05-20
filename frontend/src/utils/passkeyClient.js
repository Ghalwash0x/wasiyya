import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import api from '../services/api';

/** Returns Promise<boolean> — checks WebAuthn API + platform authenticator when available */
export const isPasskeySupported = async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        return false;
    }
    try {
        if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
            return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        }
        return true;
    } catch {
        return false;
    }
};

export const registerPasskey = async (deviceName) => {
    const optRes = await api.get('/auth/passkey/register-options');
    const attResp = await startRegistration({ optionsJSON: optRes.data.data });
    await api.post('/auth/passkey/register-verify', {
        response: attResp,
        device_name: deviceName || 'جهازي',
    });
};

export const loginWithPasskey = async (tempToken) => {
    const optRes = await api.post('/auth/passkey/login-options', { tempToken });
    const authResp = await startAuthentication({ optionsJSON: optRes.data.data });
    const verifyRes = await api.post('/auth/passkey/login-verify', {
        tempToken,
        response: authResp,
    });
    return verifyRes.data.data;
};

export const verifyPasskeyAction = async () => {
    const optRes = await api.get('/auth/passkey/action-options');
    const authResp = await startAuthentication({ optionsJSON: optRes.data.data });
    return authResp;
};
