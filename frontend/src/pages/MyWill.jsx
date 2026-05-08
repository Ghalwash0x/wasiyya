import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const MyWill = () => {
    const [will,      setWill]      = useState(null);
    const [timeUnit,  setTimeUnit]  = useState('days');
    const [form,      setForm]      = useState({ title: '', description: '', checkin_interval_days: 30, grace_period_days: 7 });
    const [loading,   setLoading]   = useState(true);
    const [saving,    setSaving]    = useState(false);
    const [msg,       setMsg]       = useState('');

    const isMinutes  = timeUnit === 'minutes';
    const unit       = isMinutes ? 'دقيقة' : 'يوم';
    const defaultInterval = isMinutes ? 2 : 30;
    const defaultGrace    = isMinutes ? 1 : 7;
    const maxInterval     = isMinutes ? 60 : 365;
    const maxGrace        = isMinutes ? 30 : 90;

    useEffect(() => {
        Promise.all([
            api.get('/wills'),
            fetch('/api/health').then(r => r.json())
        ]).then(([willRes, health]) => {
            const unit = health.time_unit || 'days';
            setTimeUnit(unit);

            const w = willRes.data.data[0];
            if (w) {
                setWill(w);
                setForm({
                    title:                  w.title,
                    description:            w.description || '',
                    checkin_interval_days:  w.checkin_interval_days,
                    grace_period_days:      w.grace_period_days,
                });
            } else {
                // set defaults based on mode
                setForm(f => ({
                    ...f,
                    checkin_interval_days: unit === 'minutes' ? 2 : 30,
                    grace_period_days:     unit === 'minutes' ? 1 : 7,
                }));
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
        setForm({ title: '', description: '', checkin_interval_days: defaultInterval, grace_period_days: defaultGrace });
        setMsg('تم حذف الوصية');
    };

    if (loading) return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar title="وصيّتي" />
                <main className="flex-1 p-6 max-w-2xl">

                    {isMinutes && (
                        <div className="mb-4 px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700 flex items-center gap-2">
                            <span>🧪</span>
                            <span>وضع التيست — الوحدة الزمنية: <strong>دقائق</strong> (كل "يوم" في الإعدادات = دقيقة واحدة فعلياً)</span>
                        </div>
                    )}

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
                                    <label className="label">
                                        فترة تجديد الوجود ({unit})
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={maxInterval}
                                        className="input-field"
                                        value={form.checkin_interval_days}
                                        onChange={e => setForm({ ...form, checkin_interval_days: parseInt(e.target.value) || 1 })}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        {isMinutes
                                            ? `لو ما جددتش خلال ${form.checkin_interval_days} دقيقة → تحذير`
                                            : `لو ما جددتش خلال ${form.checkin_interval_days} يوم → تحذير`}
                                    </p>
                                </div>
                                <div>
                                    <label className="label">
                                        فترة السماح ({unit})
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={maxGrace}
                                        className="input-field"
                                        value={form.grace_period_days}
                                        onChange={e => setForm({ ...form, grace_period_days: parseInt(e.target.value) || 1 })}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        {isMinutes
                                            ? `بعد التحذير، ${form.grace_period_days} دقيقة إضافية ثم تُفعَّل الوصية`
                                            : `بعد التحذير، ${form.grace_period_days} يوم إضافي ثم تُفعَّل الوصية`}
                                    </p>
                                </div>
                            </div>

                            {/* Summary box */}
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-800">
                                <p className="font-medium mb-1">ملخص الإعدادات:</p>
                                <p>
                                    لو ما جددتش وجودك خلال <strong>{form.checkin_interval_days} {unit}</strong>، ستصلك رسالة تحذير.
                                    إذا لم تستجب خلال <strong>{form.grace_period_days} {unit}</strong> إضافية،
                                    ستُفعَّل الوصية تلقائياً بعد مجموع <strong>{form.checkin_interval_days + form.grace_period_days} {unit}</strong>.
                                </p>
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
                                <p>الحالة: <span className={`font-medium ${will.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                    {will.status === 'active' ? 'نشطة' : will.status === 'triggered' ? 'مُفعَّلة' : will.status}
                                </span></p>
                                <p>تاريخ الإنشاء: {new Date(will.created_at).toLocaleDateString('ar')}</p>
                                {will.triggered_at && (
                                    <p>تاريخ التفعيل: <span className="text-red-600">{new Date(will.triggered_at).toLocaleString('ar')}</span></p>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MyWill;
