import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Verification = () => {
    const [status, setStatus]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [msg, setMsg]         = useState('');

    useEffect(() => {
        api.get('/checkin/status')
            .then(r => setStatus(r.data.data))
            .finally(() => setLoading(false));
    }, []);

    const handleCheckin = async () => {
        setChecking(true);
        setMsg('');
        try {
            await api.post('/checkin');
            const r = await api.get('/checkin/status');
            setStatus(r.data.data);
            setMsg('✅ تم تجديد وجودك بنجاح!');
        } catch (_) {
            setMsg('❌ حدث خطأ');
        }
        setChecking(false);
    };

    if (loading) return <div className="flex min-h-screen"><Sidebar /><div className="p-10 text-gray-500">جاري التحميل...</div></div>;

    const pct = status ? Math.min(100, (status.days_since_checkin / (status.checkin_interval_days || 30)) * 100) : 0;
    const color = pct < 60 ? 'bg-green-500' : pct < 85 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar title="تجديد الوجود (Dead Man's Switch)" />
                <main className="flex-1 p-6 max-w-2xl">
                    {msg && (
                        <div className={`mb-4 px-4 py-3 rounded text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {msg}
                        </div>
                    )}

                    <div className="card mb-6">
                        <h3 className="font-bold text-gray-800 mb-6 text-lg">حالة التجديد</h3>

                        {status ? (
                            <>
                                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-3xl font-bold text-gray-800">{status.days_since_checkin}</p>
                                        <p className="text-xs text-gray-500 mt-1">يوم منذ آخر تجديد</p>
                                    </div>
                                    <div className={`rounded-lg p-4 ${status.is_overdue ? 'bg-red-50' : 'bg-indigo-50'}`}>
                                        <p className={`text-3xl font-bold ${status.is_overdue ? 'text-red-600' : 'text-indigo-600'}`}>
                                            {status.days_remaining}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">يوم متبقي</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-3xl font-bold text-gray-800">{status.checkin_interval_days}</p>
                                        <p className="text-xs text-gray-500 mt-1">يوم للدورة الكاملة</p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>آخر تجديد</span>
                                        <span>موعد التفعيل</span>
                                    </div>
                                    <div className="bg-gray-200 rounded-full h-3">
                                        <div className={`h-3 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 text-center">
                                        آخر تجديد: {new Date(status.last_checkin).toLocaleDateString('ar')}
                                    </p>
                                </div>

                                {status.is_overdue && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm">
                                        ⚠️ تجاوزت فترة التجديد! الوصية قد تفعّل خلال فترة السماح ({status.grace_period_days} يوم).
                                    </div>
                                )}

                                <button onClick={handleCheckin} disabled={checking} className="w-full btn-primary py-3 text-base disabled:opacity-60">
                                    {checking ? 'جاري التجديد...' : '✓ أنا بخير — تجديد الوجود'}
                                </button>
                            </>
                        ) : (
                            <p className="text-gray-500 text-center py-8">لا توجد وصية نشطة بعد</p>
                        )}
                    </div>

                    <div className="card bg-blue-50 border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-2">كيف يعمل النظام؟</h4>
                        <ul className="text-sm text-blue-800 space-y-2">
                            <li>• يجب تجديد وجودك كل <strong>{status?.checkin_interval_days || 30} يوم</strong></li>
                            <li>• عند انقضاء الفترة، تصلك رسالة تحذير</li>
                            <li>• لديك <strong>{status?.grace_period_days || 7} أيام</strong> إضافية للاستجابة</li>
                            <li>• إذا لم تستجب، تُفعّل الوصية ويُرسل للوصيّين رابط الوصول</li>
                        </ul>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Verification;
