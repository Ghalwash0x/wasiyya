import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api     from '../services/api';
import { useAuth } from '../context/AuthContext';

const TwoFactorSetup = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [step,    setStep]    = useState('idle');   // idle | setup | verify
    const [qr,      setQr]      = useState('');
    const [secret,  setSecret]  = useState('');
    const [code,    setCode]    = useState('');
    const [msg,     setMsg]     = useState(null);
    const [loading, setLoading] = useState(false);

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
            setMsg({ type: 'success', text: 'تم تفعيل المصادقة الثنائية بنجاح ✅' });
            setStep('done');
        } catch (e) {
            setMsg({ type: 'error', text: e.response?.data?.message || 'الكود غير صحيح' });
        }
        setLoading(false);
        setCode('');
    };

    const disable = async (e) => {
        e.preventDefault();
        setLoading(true); setMsg(null);
        try {
            await api.post('/auth/2fa/disable', { code });
            setMsg({ type: 'success', text: 'تم إلغاء المصادقة الثنائية' });
            setStep('idle');
            setCode('');
        } catch (e) {
            setMsg({ type: 'error', text: e.response?.data?.message || 'الكود غير صحيح' });
        }
        setLoading(false);
    };

    const is2FAEnabled = user?.two_fa_enabled;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar title="المصادقة الثنائية (2FA)" />
                <main className="flex-1 p-6 max-w-xl">

                    {msg && (
                        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {msg.text}
                        </div>
                    )}

                    {/* Status card */}
                    <div className="card mb-6">
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">{is2FAEnabled ? '🔐' : '🔓'}</span>
                            <div>
                                <h3 className="font-bold text-gray-800">المصادقة الثنائية</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${is2FAEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {is2FAEnabled ? 'مفعّلة' : 'غير مفعّلة'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Enable flow */}
                    {!is2FAEnabled && step === 'idle' && (
                        <div className="card">
                            <h4 className="font-bold text-gray-800 mb-2">تفعيل المصادقة الثنائية</h4>
                            <p className="text-sm text-gray-500 mb-4">
                                بعد التفعيل، ستحتاج إلى كود من تطبيق <strong>Google Authenticator</strong> أو <strong>Authy</strong> عند كل تسجيل دخول.
                            </p>
                            <button onClick={startSetup} disabled={loading} className="btn-primary disabled:opacity-60">
                                {loading ? 'جاري الإعداد...' : 'بدء الإعداد'}
                            </button>
                        </div>
                    )}

                    {step === 'verify' && (
                        <div className="card">
                            <h4 className="font-bold text-gray-800 mb-4">امسح QR Code بتطبيق المصادقة</h4>

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
                                <div>
                                    <label className="label">أدخل الكود من التطبيق للتأكيد</label>
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
                                </div>
                                <button type="submit" disabled={loading || code.length !== 6} className="w-full btn-primary disabled:opacity-60">
                                    {loading ? 'جاري التحقق...' : 'تأكيد التفعيل'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Disable flow */}
                    {is2FAEnabled && step !== 'done' && (
                        <div className="card border-red-200 bg-red-50">
                            <h4 className="font-bold text-red-800 mb-2">إلغاء تفعيل المصادقة الثنائية</h4>
                            <p className="text-sm text-red-600 mb-4">أدخل كود التحقق من التطبيق لتأكيد الإلغاء.</p>
                            <form onSubmit={disable} className="space-y-3">
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
                                <button type="submit" disabled={loading || code.length !== 6}
                                    className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-60">
                                    {loading ? 'جاري الإلغاء...' : 'إلغاء التفعيل'}
                                </button>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TwoFactorSetup;
