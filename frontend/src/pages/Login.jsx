import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form.email, form.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ، حاول مجدداً');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-indigo-900">وصيّة</h1>
                    <p className="text-gray-500 mt-1 text-sm">Digital Will Management</p>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-6">تسجيل الدخول</h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">البريد الإلكتروني</label>
                        <input
                            type="email"
                            className="input-field"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            required
                            placeholder="example@email.com"
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
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3 text-base disabled:opacity-60"
                    >
                        {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    ليس لديك حساب؟{' '}
                    <Link to="/register" className="text-indigo-600 font-medium hover:underline">
                        إنشاء حساب جديد
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
