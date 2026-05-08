import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const passwordRules = [
    { test: p => p.length >= 8,                  label: '8 أحرف على الأقل' },
    { test: p => /[A-Z]/.test(p),               label: 'حرف كبير واحد على الأقل' },
    { test: p => /[0-9]/.test(p),               label: 'رقم واحد على الأقل' },
    { test: p => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: 'رمز خاص واحد على الأقل' },
];

const Register = () => {
    const [form, setForm] = useState({ full_name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form.full_name, form.email, form.password);
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.errors?.join(' — ') || err.response?.data?.message || 'حدث خطأ';
            setError(msg);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-indigo-900">وصيّة</h1>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-6">إنشاء حساب جديد</h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">الاسم الكامل</label>
                        <input
                            type="text"
                            className="input-field"
                            value={form.full_name}
                            onChange={e => setForm({ ...form, full_name: e.target.value })}
                            required
                            placeholder="عمر عبدالعال"
                        />
                    </div>
                    <div>
                        <label className="label">البريد الإلكتروني</label>
                        <input
                            type="email"
                            className="input-field"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">كلمة السر</label>
                        <input
                            type="password"
                            className="input-field"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            required
                        />
                        <div className="mt-2 space-y-1">
                            {passwordRules.map((rule, i) => (
                                <div key={i} className={`text-xs flex items-center gap-1.5 ${rule.test(form.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                    <span>{rule.test(form.password) ? '✓' : '○'}</span>
                                    <span>{rule.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3 text-base disabled:opacity-60"
                    >
                        {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
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
