import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const typeLabels = { account: 'حساب', bank: 'بنك', password: 'كلمة سر', info: 'معلومات', note: 'ملاحظة' };
const typeIcons  = { account: '🔑', bank: '🏦', password: '🔐', info: 'ℹ️', note: '📝' };

const Assets = () => {
    const [will, setWill]       = useState(null);
    const [assets, setAssets]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm]       = useState({ asset_type: 'account', title: '', content: '' });
    const [saving, setSaving]   = useState(false);
    const [reveal, setReveal]   = useState({});

    useEffect(() => {
        api.get('/wills').then(r => {
            const w = r.data.data[0];
            setWill(w);
            if (w) {
                return api.get(`/assets/${w.id}`).then(ar => setAssets(ar.data.data));
            }
        }).finally(() => setLoading(false));
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const r = await api.post('/assets', { ...form, will_id: will.id });
            setAssets(prev => [r.data.data, ...prev]);
            setForm({ asset_type: 'account', title: '', content: '' });
            setShowForm(false);
        } catch (err) {
            alert(err.response?.data?.message || 'خطأ في الإضافة');
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('حذف هذا الأصل؟')) return;
        await api.delete(`/assets/${id}`);
        setAssets(prev => prev.filter(a => a.id !== id));
    };

    if (loading) return <div className="flex min-h-screen"><Sidebar /><div className="p-10 text-gray-500">جاري التحميل...</div></div>;

    if (!will) return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar title="الأصول" />
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    يجب إنشاء وصية أولاً — <a href="/will" className="text-indigo-600 mr-1">إنشاء وصية</a>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar title="الأصول النصية" />
                <main className="flex-1 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-600 text-sm">{assets.length} أصل مسجل</p>
                        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                            {showForm ? 'إلغاء' : '+ إضافة أصل'}
                        </button>
                    </div>

                    {showForm && (
                        <div className="card mb-6">
                            <h3 className="font-bold mb-4">إضافة أصل جديد</h3>
                            <form onSubmit={handleAdd} className="space-y-3">
                                <div>
                                    <label className="label">النوع</label>
                                    <select className="input-field" value={form.asset_type} onChange={e => setForm({ ...form, asset_type: e.target.value })}>
                                        {Object.entries(typeLabels).map(([v, l]) => (
                                            <option key={v} value={v}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">العنوان</label>
                                    <input type="text" className="input-field" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: حساب جوجل" />
                                </div>
                                <div>
                                    <label className="label">المحتوى</label>
                                    <textarea className="input-field min-h-20" required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="البريد الإلكتروني: ... كلمة السر: ..." />
                                </div>
                                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                                    {saving ? 'جاري الحفظ...' : 'حفظ'}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        {assets.map(asset => (
                            <div key={asset.id} className="card">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{typeIcons[asset.asset_type]}</span>
                                        <div>
                                            <p className="font-semibold text-gray-800">{asset.title}</p>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{typeLabels[asset.asset_type]}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(asset.id)} className="text-red-400 hover:text-red-600 text-sm">حذف</button>
                                </div>

                                {reveal[asset.id] ? (
                                    <pre className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap break-words">{asset.content}</pre>
                                ) : (
                                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-400 select-none">••••••••••••</div>
                                )}
                                <button
                                    onClick={() => setReveal(prev => ({ ...prev, [asset.id]: !prev[asset.id] }))}
                                    className="text-xs text-indigo-600 mt-2 hover:underline"
                                >
                                    {reveal[asset.id] ? 'إخفاء' : 'عرض'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {assets.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <p className="text-5xl mb-3">💼</p>
                            <p>لا توجد أصول مضافة بعد</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Assets;
