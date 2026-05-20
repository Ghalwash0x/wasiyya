import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Beneficiaries = () => {
    const [will, setWill]                 = useState(null);
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [showForm, setShowForm]         = useState(false);
    const [form, setForm]                 = useState({ name: '', email: '', phone: '', relationship: '' });
    const [saving, setSaving]             = useState(false);

    useEffect(() => {
        api.get('/wills').then(r => {
            const w = r.data.data[0];
            setWill(w);
            if (w) return api.get(`/beneficiaries/${w.id}`).then(br => setBeneficiaries(br.data.data));
        }).finally(() => setLoading(false));
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const r = await api.post('/beneficiaries', { ...form, will_id: will.id });
            setBeneficiaries(prev => [r.data.data, ...prev]);
            setForm({ name: '', email: '', phone: '', relationship: '' });
            setShowForm(false);
        } catch (err) {
            alert(err.response?.data?.message || 'خطأ في الإضافة');
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('حذف هذا الوصي؟')) return;
        await api.delete(`/beneficiaries/${id}`);
        setBeneficiaries(prev => prev.filter(b => b.id !== id));
    };

    if (loading) return <div className="flex min-h-screen"><Sidebar /><div className="p-10 text-gray-500">جاري التحميل...</div></div>;

    if (!will) return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col">
                <Navbar title="الوصيّون" />
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    يجب إنشاء وصية أولاً — <a href="/will" className="text-indigo-600 mr-1">إنشاء وصية</a>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col">
                <Navbar title="الوصيّون" />
                <main className="flex-1 p-4 lg:p-6">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-600 text-sm">{beneficiaries.length} وصي مسجل</p>
                        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                            {showForm ? 'إلغاء' : '+ إضافة وصي'}
                        </button>
                    </div>

                    {showForm && (
                        <div className="card mb-6">
                            <h3 className="font-bold mb-4">إضافة وصي جديد</h3>
                            <form onSubmit={handleAdd} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="label">الاسم *</label>
                                        <input type="text" className="input-field" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">البريد الإلكتروني *</label>
                                        <input type="email" className="input-field" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">الهاتف</label>
                                        <input type="tel" className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">صلة القرابة</label>
                                        <input type="text" className="input-field" value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })} placeholder="ابن، زوجة، أخ..." />
                                    </div>
                                </div>
                                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                                    {saving ? 'جاري الحفظ...' : 'إضافة'}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        {beneficiaries.map(ben => (
                            <div key={ben.id} className="card">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                                            {ben.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{ben.name}</p>
                                            <p className="text-sm text-gray-500">{ben.email}</p>
                                            {ben.phone && <p className="text-xs text-gray-400">{ben.phone}</p>}
                                            {ben.relationship && <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{ben.relationship}</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(ben.id)} className="text-red-400 hover:text-red-600 text-sm">حذف</button>
                                </div>
                                {ben.notified_at && (
                                    <p className="mt-3 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                        ✓ تم الإشعار في {new Date(ben.notified_at).toLocaleDateString('ar')}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {beneficiaries.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <p className="text-5xl mb-3">👥</p>
                            <p>لا يوجد وصيّون مضافون بعد</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Beneficiaries;
