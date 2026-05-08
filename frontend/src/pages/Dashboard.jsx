import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import CheckinBanner from '../components/CheckinBanner';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusColors = {
    active:    'bg-green-100 text-green-700',
    triggered: 'bg-red-100 text-red-700',
    expired:   'bg-gray-100 text-gray-500',
};
const statusLabels = {
    active:    'نشطة',
    triggered: 'مُفعَّلة',
    expired:   'منتهية',
};

const StatCard = ({ label, value, icon }) => (
    <div className="card flex items-center gap-4">
        <div className="text-4xl">{icon}</div>
        <div>
            <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [will,    setWill]    = useState(null);
    const [checkin, setCheckin] = useState(null);
    const [counts,  setCounts]  = useState({ assets: 0, documents: 0, beneficiaries: 0 });
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [willRes, checkinRes] = await Promise.all([
                api.get('/wills'),
                api.get('/checkin/status')
            ]);
            const w = willRes.data.data[0] || null;
            setWill(w);
            setCheckin(checkinRes.data.data);

            if (w?.id) {
                const [a, d, b] = await Promise.all([
                    api.get(`/assets/${w.id}`),
                    api.get(`/documents/${w.id}`),
                    api.get(`/beneficiaries/${w.id}`)
                ]);
                setCounts({
                    assets:        a.data.data.length,
                    documents:     d.data.data.length,
                    beneficiaries: b.data.data.length
                });
            }
        } catch (_) {}
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        // auto-refresh every 30s
        const interval = setInterval(fetchData, 30_000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleCheckin = async () => {
        setChecking(true);
        try {
            await api.post('/checkin');
            const r = await api.get('/checkin/status');
            setCheckin(r.data.data);
        } catch (_) {}
        setChecking(false);
    };

    if (loading) return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p>جاري التحميل...</p>
                </div>
            </div>
        </div>
    );

    const unit = checkin?.time_unit === 'minutes' ? 'دقيقة' : 'يوم';
    const isMinutesMode = checkin?.time_unit === 'minutes';
    const progress = checkin
        ? Math.min(100, (checkin.elapsed / (checkin.checkin_interval_days || 30)) * 100)
        : 0;
    const progressColor = progress >= 100 ? 'bg-red-500' : progress >= 70 ? 'bg-amber-500' : 'bg-indigo-600';

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <CheckinBanner />
                <Navbar title="الرئيسية" />
                <main className="flex-1 p-6 max-w-5xl w-full mx-auto">

                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">مرحباً، {user?.full_name}</h2>
                            <p className="text-sm text-gray-500 mt-0.5">منصة وصيّة الرقمية</p>
                        </div>
                        {isMinutesMode && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                                وضع التيست (دقائق)
                            </span>
                        )}
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard icon="📜" label="حالة الوصية"   value={will ? (statusLabels[will.status] || will.status) : 'لا توجد'} />
                        <StatCard icon="💼" label="الأصول"        value={counts.assets} />
                        <StatCard icon="📁" label="الوثائق"       value={counts.documents} />
                        <StatCard icon="👥" label="الورثة"        value={counts.beneficiaries} />
                    </div>

                    {/* Checkin status card */}
                    {checkin && (
                        <div className="card mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-800">Dead Man's Switch — حالة التجديد</h3>
                                {checkin.will_status && (
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[checkin.will_status] || ''}`}>
                                        {statusLabels[checkin.will_status] || checkin.will_status}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-gray-800">{checkin.elapsed}</p>
                                    <p className="text-xs text-gray-500 mt-1">منذ آخر تجديد ({unit})</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <p className={`text-2xl font-bold ${checkin.is_overdue ? 'text-red-600' : 'text-indigo-600'}`}>
                                        {checkin.days_remaining}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">متبقي ({unit})</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-gray-800">{checkin.checkin_interval_days}</p>
                                    <p className="text-xs text-gray-500 mt-1">الفترة الكاملة ({unit})</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>0</span>
                                    <span>فترة السماح: {checkin.grace_period_days} {unit}</span>
                                    <span>{checkin.checkin_interval_days}</span>
                                </div>
                                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-500 ${progressColor}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    آخر تجديد: {checkin.last_checkin
                                        ? new Date(checkin.last_checkin).toLocaleString('ar')
                                        : '—'}
                                </p>
                                <button
                                    onClick={handleCheckin}
                                    disabled={checking}
                                    className="btn-primary disabled:opacity-60"
                                >
                                    {checking ? 'جاري التجديد...' : 'أنا بخير ✓'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Will triggered warning */}
                    {will?.status === 'triggered' && (
                        <div className="card bg-red-50 border border-red-200 mb-6">
                            <div className="flex items-start gap-3">
                                <span className="text-3xl">🔔</span>
                                <div>
                                    <h4 className="font-bold text-red-800">تم تفعيل وصيتك!</h4>
                                    <p className="text-sm text-red-700 mt-1">
                                        تم إرسال إشعارات إلى الورثة المسجلين مع روابط الوصول.
                                        فُعِّلت في: {will.triggered_at ? new Date(will.triggered_at).toLocaleString('ar') : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No will CTA */}
                    {!will && (
                        <div className="card bg-indigo-50 border-indigo-100 text-center py-12">
                            <p className="text-5xl mb-3">📜</p>
                            <p className="text-gray-700 font-medium mb-4">لم تقم بإنشاء وصيتك بعد</p>
                            <a href="/will" className="btn-primary">إنشاء وصيتي الآن</a>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
