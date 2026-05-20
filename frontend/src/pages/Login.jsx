import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Mail, Lock, LogIn, ShieldCheck, ArrowRight, AlertCircle, X, Loader2, KeyRound } from 'lucide-react';
import { isPasskeySupported, loginWithPasskey } from '../utils/passkeyClient';

const Login = () => {
    const [form,      setForm]      = useState({ email: '', password: '' });
    const [step,      setStep]      = useState('login');
    const [tempToken, setTempToken] = useState('');
    const [otpCode,   setOtpCode]   = useState('');
    const [error,     setError]     = useState('');
    const [loading,   setLoading]   = useState(false);
    const [methods,   setMethods]   = useState({ totp: true, passkey: false });
    const [passkeyOk, setPasskeyOk] = useState(false);
    const { login }   = useAuth();
    const navigate    = useNavigate();

    useEffect(() => {
        if (!error) return;
        const t = setTimeout(() => setError(''), 10000);
        return () => clearTimeout(t);
    }, [error]);

    useEffect(() => {
        isPasskeySupported().then(setPasskeyOk).catch(() => setPasskeyOk(false));
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token  = params.get('token');
        const err    = params.get('error');
        const needs2FA = params.get('requires2FA') === '1';
        const oauthTempToken = params.get('tempToken');

        if (err === 'oauth_not_configured') {
            setError('تسجيل الدخول عبر Google/GitHub غير مفعّل');
            return;
        }
        if (err === 'account_not_found') {
            setError('لا يوجد حساب مرتبط بهذا البريد — أنشئ حساباً جديداً أولاً');
            return;
        }
        if (err) { setError('فشل تسجيل الدخول — حاول مجدداً'); return; }

        if (needs2FA && oauthTempToken) {
            setTempToken(oauthTempToken);
            setMethods({
                totp: params.get('totp') === '1',
                passkey: params.get('passkey') === '1',
            });
            setStep('2fa');
            window.history.replaceState({}, '', '/login');
            if (params.get('totp') === null && params.get('passkey') === null) {
                api.get('/auth/2fa/methods', { params: { tempToken: oauthTempToken } })
                    .then(r => setMethods(r.data.data))
                    .catch(() => {});
            }
            return;
        }

        if (!token) return;

        api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                const user = res.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                const dest = user.role === 'developer' ? '/developer'
                           : user.role === 'admin'     ? '/admin'
                           : user.role === 'manager'   ? '/manager'
                           : '/dashboard';
                navigate(dest);
                window.location.reload();
            })
            .catch(() => setError('فشل التحقق من token OAuth'));
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await api.post('/auth/login', { email: form.email, password: form.password });
            if (res.data.requires2FA) {
                setTempToken(res.data.tempToken);
                setMethods(res.data.methods || { totp: true, passkey: false });
                setStep('2fa');
            } else {
                const { user, token } = res.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                const dest = user.role === 'developer' ? '/developer'
                           : user.role === 'admin'     ? '/admin'
                           : user.role === 'manager'   ? '/manager'
                           : '/dashboard';
                navigate(dest);
                window.location.reload();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ، حاول مجدداً');
        }
        setLoading(false);
    };

    const handle2FA = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await api.post('/auth/2fa/verify', { tempToken, code: otpCode });
            finishLogin(res.data.data.user, res.data.data.token);
        } catch (err) {
            setError(err.response?.data?.message || 'كود التحقق غير صحيح');
        }
        setLoading(false);
    };

    const handlePasskeyLogin = async () => {
        setError(''); setLoading(true);
        try {
            const { user, token } = await loginWithPasskey(tempToken);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            const dest = user.role === 'developer' ? '/developer'
                       : user.role === 'admin'     ? '/admin'
                       : user.role === 'manager'   ? '/manager'
                       : '/dashboard';
            navigate(dest);
            window.location.reload();
        } catch (err) {
            const text = err.response?.data?.message
                || (err.name === 'NotAllowedError' ? 'تم إلغاء Passkey' : 'فشل التحقق بـ Passkey');
            setError(text);
        }
        setLoading(false);
    };

    const finishLogin = (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        const dest = user.role === 'developer' ? '/developer'
                   : user.role === 'admin'     ? '/admin'
                   : user.role === 'manager'   ? '/manager'
                   : '/dashboard';
        navigate(dest);
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-7 text-center">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <ShieldCheck size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-wide">وصيّة</h1>
                        <p className="text-indigo-200 text-sm mt-1">Digital Will Management</p>
                    </div>

                    <div className="px-8 py-7">
                        {step === 'login' ? (
                            <>
                                <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                    <LogIn size={18} className="text-indigo-400" />
                                    تسجيل الدخول
                                </h2>

                                {error && (
                                    <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                            <span>{error}</span>
                                        </div>
                                        <button onClick={() => setError('')} className="text-red-400 hover:text-red-200 shrink-0">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">البريد الإلكتروني</label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="email"
                                                className="input-dark pr-9"
                                                value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                                required
                                                placeholder="example@email.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">كلمة السر</label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="password"
                                                className="input-dark pr-9"
                                                value={form.password}
                                                onChange={e => setForm({ ...form, password: e.target.value })}
                                                required
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 mt-2"
                                    >
                                        {loading
                                            ? <><Loader2 size={16} className="animate-spin" /> جاري الدخول...</>
                                            : <><LogIn size={16} /> تسجيل الدخول</>}
                                    </button>
                                </form>

                                <div className="relative my-5">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10" />
                                    </div>
                                    <div className="relative flex justify-center text-xs text-slate-500 bg-transparent px-3">أو</div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <a href="/api/auth/google"
                                        className="flex items-center justify-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/15 hover:text-white transition-all">
                                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        Google
                                    </a>
                                    <a href="/api/auth/github"
                                        className="flex items-center justify-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/15 hover:text-white transition-all">
                                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                                        </svg>
                                        GitHub
                                    </a>
                                </div>

                                <p className="text-center text-sm text-slate-400 mt-6">
                                    ليس لديك حساب؟{' '}
                                    <Link to="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                                        إنشاء حساب جديد
                                    </Link>
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck size={30} className="text-indigo-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">التحقق الثنائي</h2>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {methods.passkey && methods.totp
                                            ? 'Passkey أو كود التطبيق'
                                            : methods.passkey
                                                ? 'استخدم Passkey'
                                                : 'أدخل الكود من تطبيق المصادقة'}
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                            <span>{error}</span>
                                        </div>
                                        <button onClick={() => setError('')} className="text-red-400 hover:text-red-200 shrink-0">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                {methods.passkey && passkeyOk && (
                                    <button
                                        type="button"
                                        onClick={handlePasskeyLogin}
                                        disabled={loading}
                                        className="w-full mb-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {loading
                                            ? <><Loader2 size={16} className="animate-spin" /> جاري التحقق...</>
                                            : <><KeyRound size={16} /> الدخول بـ Passkey</>}
                                    </button>
                                )}

                                {methods.totp && methods.passkey && passkeyOk && (
                                    <div className="relative my-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-white/10" />
                                        </div>
                                        <div className="relative flex justify-center text-xs text-slate-500 bg-transparent px-3">أو</div>
                                    </div>
                                )}

                                {methods.totp && (
                                    <form onSubmit={handle2FA} className="space-y-4">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            className="input-dark text-center text-3xl tracking-widest"
                                            placeholder="000000"
                                            value={otpCode}
                                            onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            autoFocus={!methods.passkey}
                                            required={!methods.passkey}
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading || otpCode.length !== 6}
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
                                        >
                                            {loading
                                                ? <><Loader2 size={16} className="animate-spin" /> جاري التحقق...</>
                                                : <><ShieldCheck size={16} /> تأكيد بـ TOTP</>}
                                        </button>
                                    </form>
                                )}

                                <button
                                    onClick={() => { setStep('login'); setError(''); setOtpCode(''); }}
                                    className="w-full mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <ArrowRight size={14} />
                                    العودة لتسجيل الدخول
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
