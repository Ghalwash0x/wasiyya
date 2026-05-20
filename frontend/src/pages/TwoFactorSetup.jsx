import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api     from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    isPasskeySupported,
    registerPasskey,
    verifyPasskeyAction,
} from '../utils/passkeyClient';

const TwoFactorSetup = () => {
    const { user, refreshUser } = useAuth();
    const [tab, setTab] = useState('totp');
    const [step, setStep] = useState('idle');
    const [qr, setQr] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [deviceName, setDeviceName] = useState('جهازي');
    const [passkeys, setPasskeys] = useState([]);
    const [methods, setMethods] = useState({ totp: false, passkey: false });
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [passkeyOk, setPasskeyOk] = useState(false);

    const loadPasskeys = async () => {
        try {
            const r = await api.get('/auth/passkey/list');
            setPasskeys(r.data.data.passkeys || []);
            setMethods(r.data.data.methods || {});
        } catch (_) {}
    };

    useEffect(() => {
        isPasskeySupported().then(setPasskeyOk).catch(() => setPasskeyOk(false));
        loadPasskeys();
    }, []);

    const startSetup = async () => {
        setLoading(true); setMsg(null);
        try {
            const r = await api.get('/auth/2fa/setup');
            setQr(r.data.data.qr_code);
            setSecret(r.data.data.secret);
            setStep('verify');
        } catch (e) {
            setMsg({ type: 'error', text: e.response?.data?.message || 'خطأ' });
        }
        setLoading(false);
    };

    const confirmEnable = async (e) => {
        e.preventDefault();
        setLoading(true); setMsg(null);
        try {
            await api.post('/auth/2fa/enable', { code });
            await refreshUser();
            await loadPasskeys();
            setMsg({ type: 'success', text: 'تم تفعيل TOTP بنجاح' });
            setStep('done');
        } catch (e) {
            setMsg({ type: 'error', text: e.response?.data?.message || 'الكود غير صحيح' });
        }
        setLoading(false);
        setCode('');
    };

    const handleRegisterPasskey = async () => {
        setLoading(true); setMsg(null);
        try {
            await registerPasskey(deviceName);
            await refreshUser();
            await loadPasskeys();
            setMsg({ type: 'success', text: 'تم تسجيل Passkey وتفعيل المصادقة الثنائية' });
        } catch (e) {
            const text = e.response?.data?.message
                || (e.name === 'NotAllowedError' ? 'تم إلغاء العملية من المتصفح' : 'فشل تسجيل Passkey');
            setMsg({ type: 'error', text });
        }
        setLoading(false);
    };

    const handleDeletePasskey = async (id) => {
        if (!confirm('حذف هذا Passkey؟')) return;
        setLoading(true);
        try {
            await api.delete(`/auth/passkey/${id}`);
            await refreshUser();
            await loadPasskeys();
            setMsg({ type: 'success', text: 'تم الحذف' });
        } catch (e) {
            setMsg({ type: 'error', text: e.response?.data?.message || 'خطأ' });
        }
        setLoading(false);
    };

    const disable = async (e) => {
        e?.preventDefault();
        setLoading(true); setMsg(null);
        try {
            if (code && methods.totp) {
                await api.post('/auth/2fa/disable', { code });
            } else if (methods.passkey && passkeyOk) {
                const passkeyResponse = await verifyPasskeyAction();
                await api.post('/auth/2fa/disable', { passkeyResponse });
            } else {
                setMsg({ type: 'error', text: 'أدخل كود TOTP أو استخدم Passkey' });
                setLoading(false);
                return;
            }
            await refreshUser();
            setPasskeys([]);
            setMsg({ type: 'success', text: 'تم إلغاء المصادقة الثنائية' });
            setStep('idle');
            setCode('');
        } catch (e) {
            setMsg({ type: 'error', text: e.response?.data?.message || 'فشل الإلغاء' });
        }
        setLoading(false);
    };

    const is2FAEnabled = user?.two_fa_enabled;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col">
                <Navbar title="المصادقة الثنائية (2FA)" />
                <main className="flex-1 p-4 lg:p-6 max-w-xl">

                    {msg && (
                        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {msg.text}
                        </div>
                    )}

                    <div className="card mb-6">
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">{is2FAEnabled ? '🔐' : '🔓'}</span>
                            <div>
                                <h3 className="font-bold text-gray-800">المصادقة الثنائية</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${is2FAEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {is2FAEnabled ? 'مفعّلة' : 'غير مفعّلة'}
                                </span>
                                {is2FAEnabled && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {methods.totp && 'TOTP '}
                                        {methods.totp && methods.passkey && '+ '}
                                        {methods.passkey && 'Passkey'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {!is2FAEnabled && (
                        <div className="flex gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setTab('totp')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'totp' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                            >
                                تطبيق المصادقة (TOTP)
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab('passkey')}
                                disabled={!passkeyOk}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'passkey' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'} disabled:opacity-50`}
                            >
                                Passkey
                            </button>
                        </div>
                    )}

                    {!is2FAEnabled && tab === 'totp' && step === 'idle' && (
                        <div className="card">
                            <h4 className="font-bold text-gray-800 mb-2">تفعيل عبر Google Authenticator / Authy</h4>
                            <p className="text-sm text-gray-500 mb-4">
                                امسح QR Code وأدخل الكود عند كل تسجيل دخول.
                            </p>
                            <button onClick={startSetup} disabled={loading} className="btn-primary disabled:opacity-60">
                                {loading ? 'جاري الإعداد...' : 'بدء الإعداد'}
                            </button>
                        </div>
                    )}

                    {!is2FAEnabled && tab === 'passkey' && (
                        <div className="card">
                            <h4 className="font-bold text-gray-800 mb-2">تفعيل عبر Passkey</h4>
                            <p className="text-sm text-gray-500 mb-4">
                                استخدم بصمة الإصبع أو Face ID أو مفتاح الأمان (YubiKey) — بدون كود يدوي.
                            </p>
                            {!passkeyOk && (
                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                    المتصفح أو الجهاز لا يدعم Passkey. جرّب Chrome/Safari على HTTPS أو localhost.
                                </p>
                            )}
                            <div className="mb-3">
                                <label className="label">اسم الجهاز</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={deviceName}
                                    onChange={e => setDeviceName(e.target.value)}
                                    placeholder="MacBook / iPhone"
                                />
                            </div>
                            <button
                                onClick={handleRegisterPasskey}
                                disabled={loading || !passkeyOk}
                                className="btn-primary disabled:opacity-60 w-full"
                            >
                                {loading ? 'جاري التسجيل...' : 'إضافة Passkey'}
                            </button>
                        </div>
                    )}

                    {step === 'verify' && tab === 'totp' && (
                        <div className="card">
                            <h4 className="font-bold text-gray-800 mb-4">امسح QR Code</h4>
                            {qr && (
                                <div className="flex justify-center mb-4">
                                    <img src={qr} alt="QR Code" className="w-48 h-48 border rounded-lg" />
                                </div>
                            )}
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <p className="text-xs text-gray-500 mb-1">أو أدخل الكود يدوياً:</p>
                                <p className="font-mono text-sm text-gray-800 break-all select-all">{secret}</p>
                            </div>
                            <form onSubmit={confirmEnable} className="space-y-3">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="input-field text-center text-2xl tracking-widest"
                                    placeholder="000000"
                                    value={code}
                                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                                <button type="submit" disabled={loading || code.length !== 6} className="w-full btn-primary disabled:opacity-60">
                                    {loading ? 'جاري التحقق...' : 'تأكيد التفعيل'}
                                </button>
                            </form>
                        </div>
                    )}

                    {is2FAEnabled && passkeys.length > 0 && (
                        <div className="card mb-4">
                            <h4 className="font-bold text-gray-800 mb-3">أجهزة Passkey المسجّلة</h4>
                            <ul className="space-y-2">
                                {passkeys.map(pk => (
                                    <li key={pk.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 text-sm">
                                        <span>{pk.device_name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePasskey(pk.id)}
                                            className="text-red-500 hover:text-red-700 text-xs"
                                        >
                                            حذف
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {passkeyOk && (
                                <button
                                    type="button"
                                    onClick={handleRegisterPasskey}
                                    disabled={loading}
                                    className="mt-3 text-sm text-indigo-600 hover:underline"
                                >
                                    + إضافة Passkey آخر
                                </button>
                            )}
                        </div>
                    )}

                    {is2FAEnabled && !methods.passkey && passkeyOk && (
                        <div className="card mb-4">
                            <h4 className="font-bold text-gray-800 mb-2">إضافة Passkey</h4>
                            <p className="text-sm text-gray-500 mb-3">طريقة ثانية للتحقق — بصمة أو Face ID.</p>
                            <input
                                type="text"
                                className="input-field mb-3"
                                value={deviceName}
                                onChange={e => setDeviceName(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={handleRegisterPasskey}
                                disabled={loading}
                                className="btn-primary w-full disabled:opacity-60"
                            >
                                تسجيل Passkey
                            </button>
                        </div>
                    )}

                    {is2FAEnabled && step !== 'done' && (
                        <div className="card border-red-200 bg-red-50">
                            <h4 className="font-bold text-red-800 mb-2">إلغاء تفعيل المصادقة الثنائية</h4>
                            <p className="text-sm text-red-600 mb-4">
                                {methods.totp && 'أدخل كود TOTP من التطبيق. '}
                                {methods.passkey && 'أو استخدم Passkey للتأكيد.'}
                            </p>
                            {methods.totp && (
                                <form onSubmit={disable} className="space-y-3 mb-3">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        className="input-field text-center text-2xl tracking-widest"
                                        placeholder="000000"
                                        value={code}
                                        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || code.length !== 6}
                                        className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-60"
                                    >
                                        إلغاء بـ TOTP
                                    </button>
                                </form>
                            )}
                            {methods.passkey && passkeyOk && (
                                <button
                                    type="button"
                                    onClick={disable}
                                    disabled={loading}
                                    className="w-full border border-red-300 text-red-700 py-2.5 rounded-lg font-medium hover:bg-red-100 disabled:opacity-60"
                                >
                                    {loading ? 'جاري التحقق...' : 'إلغاء بـ Passkey'}
                                </button>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TwoFactorSetup;
