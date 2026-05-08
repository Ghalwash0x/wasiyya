import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const MyWill = () => {
    const [will, setWill]       = useState(null);
    const [form, setForm]       = useState({ title: '', description: '', checkin_interval_days: 30, grace_period_days: 7 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [msg, setMsg]         = useState('');

    useEffect(() => {
        api.get('/wills').then(r => {
            const w = r.data.data[0];
            if (w) {
                setWill(w);
                setForm({ title: w.title, description: w.description || '', checkin_interval_days: w.checkin_interval_days, grace_period_days: w.grace_period_days });
            }
        }).finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg('');
        try {
            if (will) {
                const r = await api.put(`/wills/${will.id}`, form);
                setWill(r.data.data);
                setMsg('✅ تم حفظ التغييرات');
            } else {
                const r = await api.post('/wills', form);
                setWill(r.data.data);
                setMsg('✅ تم إنشاء الوصية');
            }
        } catch (err) {
            setMsg('❌ ' + (err.response?.data?.message || 'خطأ في الحفظ'));
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!confirm('هل أنت متأكد من حذف الوصية؟ سيتم حذف كل البيانات المرتبطة بها.')) return;
        await api.delete(`/wills/${will.id}`);
        setWill(null);
        setForm({ title: '', description: '', checkin_interval_days: 30, grace_period_days: 7 });
        setMsg('تم حذف الوصية');
    };

    if (loading) return <div className="flex min-h-screen"><Sidebar /><div className="flex-1 p-10 text-gray-500">جاري التحميل...</div></div>;

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar title="وصيّتي" />
                <main className="flex-1 p-6 max-w-2xl">
                    <div className="card">
                        <h3 className="font-bold text-gray-800 mb-6 text-lg">
                            {will ? 'تعديل الوصية' : 'إنشاء وصية جديدة'}
                        </h3>

                        {msg && (
                            <div className={`mb-4 px-4 py-2 rounded text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {msg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">عنوان الوصية *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    required
                                    placeholder="وصيتي الرقمية"
                                />
                            </div>
                            <div>
                                <label className="label">وصف (اختياري)</label>
                                <textarea
                                    className="input-field min-h-24"
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="ملاحظات عامة عن الوصية..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">فترة تجديد الوجود (أيام)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        className="input-field"
                                        value={form.checkin_interval_days}
                                        onChange={e => setForm({ ...form, checkin_interval_days: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="label">فترة السماح (أيام)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        className="input-field"
                                        value={form.grace_period_days}
                                        onChange={e => setForm({ ...form, grace_period_days: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                                    {saving ? 'جاري الحفظ...' : (will ? 'حفظ التغييرات' : 'إنشاء الوصية')}
                                </button>
                                {will && (
                                    <button type="button" onClick={handleDelete} className="btn-danger">
                                        حذف الوصية
                                    </button>
                                )}
                            </div>
                        </form>

                        {will && (
                            <div className="mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500 space-y-1">
                                <p>الحالة: <span className={`font-medium ${will.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{will.status}</span></p>
                                <p>تاريخ الإنشاء: {new Date(will.created_at).toLocaleDateString('ar')}</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MyWill;
