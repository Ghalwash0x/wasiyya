import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const passwordRules = [
    { test: p => p.length >= 8,                      label: '8 أحرف على الأقل' },
    { test: p => /[A-Z]/.test(p),                    label: 'حرف كبير واحد على الأقل' },
    { test: p => /[0-9]/.test(p),                    label: 'رقم واحد على الأقل' },
    { test: p => /[!@#$%^&*(),.?":{}|<>]/.test(p),  label: 'رمز خاص واحد على الأقل' },
];

const providerLabel = { google: 'Google', github: 'GitHub' };

const Register = () => {
    const [form, setForm] = useState({ full_name: '', email: '', password: '' });
    const [oauthToken, setOauthToken] = useState('');
    const [oauthProvider, setOauthProvider] = useState('');
    const [oauthMode, setOauthMode] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState(false);
    const { register, registerOAuth } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const err = params.get('error');
        const token = params.get('oauth_token');

        if (err === 'oauth_not_configured') { setError('التسجيل عبر Google/GitHub غير مفعّل'); return; }
        if (err === 'oauth_no_email')        { setError('لم نتمكن من الحصول على بريدك — استخدم التسجيل بالبريد'); return; }
        if (err === 'email_exists')          { setError('هذا البريد مسجل مسبقاً — سجّل الدخول أو استخدم بريداً آخر'); return; }
        if (err === 'oauth_failed')          { setError('فشل التسجيل عبر OAuth — حاول مجدداً'); return; }
        if (!token) return;

        setOauthLoading(true);
        api.get('/auth/oauth/pending', { params: { token } })
            .then(res => {
                const { email, full_name, provider } = res.data.data;
                setForm({ full_name, email, password: '' });
                setOauthToken(token);
                setOauthProvider(provider);
                setOauthMode(true);
                window.history.replaceState({}, '', '/register');
            })
            .catch(() => setError('انتهت صلاحية رمز OAuth — اضغط Google أو GitHub للمحاولة مرة أخرى'))
            .finally(() => setOauthLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (oauthMode) {
                await registerOAuth(oauthToken, form.full_name, form.password || undefined);
            } else {
                await register(form.full_name, form.email, form.password);
            }
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.errors?.join(' — ') || err.response?.data?.message || 'حدث خطأ';
            setError(msg);
        }
        setLoading(false);
    };

    const showPasswordRules = oauthMode ? form.password : true;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-indigo-900">وصيّة</h1>
                    <p className="text-gray-500 mt-1 text-sm">إنشاء حساب جديد</p>
                </div>

                {oauthMode && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                        ✅ تم ربط حساب {providerLabel[oauthProvider] || oauthProvider} — أكمل بياناتك ثم أنشئ الحساب
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-start justify-between gap-2">
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="text-red-400 hover:text-red-700 font-bold leading-none shrink-0">×</button>
                    </div>
                )}

                {oauthLoading ? (
                    <div className="text-center py-10 text-gray-500 text-sm">جاري تحميل بيانات OAuth...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">الاسم الكامل</label>
                            <input type="text" className="input-field"
                                value={form.full_name}
                                onChange={e => setForm({ ...form, full_name: e.target.value })}
                                required placeholder="عمر عبدالعال" />
                        </div>

                        <div>
                            <label className="label">البريد الإلكتروني</label>
                            <input type="email"
                                className={`input-field ${oauthMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required readOnly={oauthMode} />
                        </div>

                        <div>
                            <label className="label">
                                كلمة السر
                                {oauthMode && <span className="text-gray-400 font-normal mr-1 text-xs">(اختياري)</span>}
                            </label>
                            <input type="password" className="input-field"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                required={!oauthMode}
                                placeholder={oauthMode ? 'اتركه فارغاً للدخول عبر OAuth فقط' : '••••••••'} />

                            {showPasswordRules && (
                                <div className="mt-2 grid grid-cols-2 gap-1.5">
                                    {passwordRules.map((rule, i) => {
                                        const ok = rule.test(form.password);
                                        return (
                                            <div key={i} className={`text-xs flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                                                <span>{ok ? '●' : '○'}</span>
                                                <span>{rule.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {oauthMode && !form.password && (
                                <p className="text-xs text-gray-400 mt-1.5">
                                    يمكنك إضافة كلمة سر لاحقاً أو الدخول دائماً عبر {providerLabel[oauthProvider] || 'OAuth'}
                                </p>
                            )}
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full btn-primary py-3 text-base disabled:opacity-60 mt-2">
                            {loading ? 'جاري التسجيل...' : '+ إنشاء الحساب'}
                        </button>
                    </form>
                )}

                {!oauthMode && (
                    <>
                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-3">أو سجّل بـ</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <a href="/api/auth/google?mode=register"
                                className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Google
                            </a>
                            <a href="/api/auth/github?mode=register"
                                className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                                </svg>
                                GitHub
                            </a>
                        </div>
                    </>
                )}

                <p className="text-center text-sm text-gray-600">
                    لديك حساب بالفعل؟{' '}
                    <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                        تسجيل الدخول
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
