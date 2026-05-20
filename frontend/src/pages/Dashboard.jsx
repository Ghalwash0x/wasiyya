import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import CheckinBanner from '../components/CheckinBanner';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    ScrollText, Briefcase, FolderOpen, Users,
    AlertTriangle, CheckCircle2, Clock, Timer,
    HeartPulse, TrendingUp, Bell, Plus, Loader2
} from 'lucide-react';

const statusColors = {
    active:    { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    triggered: { bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30' },
    expired:   { bg: 'bg-slate-500/15',   text: 'text-slate-400',   border: 'border-slate-500/30' },
};
const statusLabels = {
    active:    'نشطة',
    triggered: 'مُفعَّلة',
    expired:   'منتهية',
};

const StatCard = ({ label, value, Icon, color = 'indigo' }) => {
    const colors = {
        indigo:  { bg: 'bg-indigo-500/15',  icon: 'text-indigo-400',  border: 'border-indigo-500/20' },
        emerald: { bg: 'bg-emerald-500/15', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
        amber:   { bg: 'bg-amber-500/15',   icon: 'text-amber-400',   border: 'border-amber-500/20' },
        violet:  { bg: 'bg-violet-500/15',  icon: 'text-violet-400',  border: 'border-violet-500/20' },
    };
    const c = colors[color] || colors.indigo;

    return (
        <div className={`bg-white border ${c.border} rounded-2xl p-5 flex items-center gap-4`}>
            <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon size={22} className={c.icon} />
            </div>
            <div>
                <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
        </div>
    );
};

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
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 min-w-0 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={36} className="animate-spin text-indigo-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">جاري التحميل...</p>
                </div>
            </div>
        </div>
    );

    const unit = checkin?.time_unit === 'minutes' ? 'دقيقة' : 'يوم';
    const isMinutesMode = checkin?.time_unit === 'minutes';
    const progress = checkin
        ? Math.min(100, (checkin.elapsed / (checkin.checkin_interval_days || 30)) * 100)
        : 0;
    const progressColor = progress >= 100 ? 'bg-red-500' : progress >= 70 ? 'bg-amber-500' : 'bg-indigo-500';
    const willStatus = will?.status || 'active';
    const statusCfg = statusColors[willStatus] || statusColors.active;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col">
                <CheckinBanner />
                <Navbar title="الرئيسية" />
                <main className="flex-1 p-4 lg:p-6 max-w-5xl w-full mx-auto space-y-6">

                    {/* Welcome header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">مرحباً، {user?.full_name}</h2>
                            <p className="text-sm text-slate-400 mt-0.5">منصة وصيّة الرقمية</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {isMinutesMode && (
                                <span className="text-xs bg-violet-100 text-violet-700 border border-violet-200 px-3 py-1 rounded-full font-medium">
                                    وضع التيست
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            Icon={ScrollText}
                            label="حالة الوصية"
                            value={will ? (statusLabels[will.status] || will.status) : 'لا توجد'}
                            color="indigo"
                        />
                        <StatCard Icon={Briefcase}  label="الأصول"  value={counts.assets}        color="amber" />
                        <StatCard Icon={FolderOpen} label="الوثائق" value={counts.documents}     color="violet" />
                        <StatCard Icon={Users}      label="الورثة"  value={counts.beneficiaries} color="emerald" />
                    </div>

                    {/* Checkin status card */}
                    {checkin && (
                        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                        <HeartPulse size={16} className="text-indigo-500" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Dead Man's Switch — حالة التجديد</h3>
                                </div>
                                {checkin.will_status && (
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                                        {statusLabels[checkin.will_status] || checkin.will_status}
                                    </span>
                                )}
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-3 gap-4 mb-5">
                                    <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Clock size={13} className="text-slate-400" />
                                            <p className="text-xs text-slate-400">منذ آخر تجديد ({unit})</p>
                                        </div>
                                        <p className="text-2xl font-bold text-slate-800">{checkin.elapsed}</p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Timer size={13} className="text-slate-400" />
                                            <p className="text-xs text-slate-400">متبقي ({unit})</p>
                                        </div>
                                        <p className={`text-2xl font-bold ${checkin.is_overdue ? 'text-red-500' : 'text-indigo-600'}`}>
                                            {checkin.days_remaining}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <TrendingUp size={13} className="text-slate-400" />
                                            <p className="text-xs text-slate-400">الفترة الكاملة ({unit})</p>
                                        </div>
                                        <p className="text-2xl font-bold text-slate-800">{checkin.checkin_interval_days}</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mb-5">
                                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                        <span>0</span>
                                        <span>فترة السماح: {checkin.grace_period_days} {unit}</span>
                                        <span>{checkin.checkin_interval_days}</span>
                                    </div>
                                    <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-700 ${progressColor}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-end mt-1">
                                        <span className="text-xs text-slate-400">{Math.round(progress)}%</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <CheckCircle2 size={13} className="text-slate-400" />
                                        آخر تجديد: {checkin.last_checkin
                                            ? new Date(checkin.last_checkin).toLocaleString('ar')
                                            : '—'}
                                    </p>
                                    <button
                                        onClick={handleCheckin}
                                        disabled={checking}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-60 flex items-center gap-2 shadow-md shadow-indigo-600/20"
                                    >
                                        {checking
                                            ? <><Loader2 size={14} className="animate-spin" /> جاري التجديد...</>
                                            : <><HeartPulse size={14} /> أنا بخير</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Will triggered warning */}
                    {will?.status === 'triggered' && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                                <Bell size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-red-800 text-sm">تم تفعيل وصيتك!</h4>
                                <p className="text-sm text-red-600 mt-1">
                                    تم إرسال إشعارات إلى الورثة المسجلين مع روابط الوصول.
                                    فُعِّلت في: {will.triggered_at ? new Date(will.triggered_at).toLocaleString('ar') : '—'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* No will CTA */}
                    {!will && (
                        <div className="bg-white border border-dashed border-indigo-200 rounded-2xl text-center py-14 px-6">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ScrollText size={28} className="text-indigo-400" />
                            </div>
                            <p className="text-slate-700 font-semibold mb-1">لم تقم بإنشاء وصيتك بعد</p>
                            <p className="text-slate-400 text-sm mb-5">ابدأ الآن لضمان توزيع ممتلكاتك وفق رغباتك</p>
                            <a
                                href="/will"
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                            >
                                <Plus size={16} />
                                إنشاء وصيتي الآن
                            </a>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
