import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import CheckinBanner from '../components/CheckinBanner';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, icon, color }) => (
    <div className={`card flex items-center gap-4`}>
        <div className={`text-4xl`}>{icon}</div>
        <div>
            <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [will, setWill] = useState(null);
    const [checkin, setCheckin] = useState(null);
    const [counts, setCounts] = useState({});

    useEffect(() => {
        api.get('/wills').then(r => setWill(r.data.data[0] || null)).catch(() => {});
        api.get('/checkin/status').then(r => setCheckin(r.data.data)).catch(() => {});

        if (will?.id) {
            Promise.all([
                api.get(`/assets/${will.id}`),
                api.get(`/documents/${will.id}`),
                api.get(`/beneficiaries/${will.id}`)
            ]).then(([a, d, b]) => {
                setCounts({
                    assets: a.data.data.length,
                    documents: d.data.data.length,
                    beneficiaries: b.data.data.length
                });
            }).catch(() => {});
        }
    }, [will?.id]);

    const handleCheckin = async () => {
        await api.post('/checkin');
        const r = await api.get('/checkin/status');
        setCheckin(r.data.data);
    };

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <CheckinBanner />
                <Navbar title="الرئيسية" />
                <main className="flex-1 p-6">
                    <p className="text-gray-600 mb-6">
                        مرحباً <strong>{user?.full_name}</strong> — منصة وصيّة الرقمية
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard icon="📜" label="الوصية" value={will ? will.title : 'لا توجد'} />
                        <StatCard icon="💼" label="الأصول" value={counts.assets ?? 0} />
                        <StatCard icon="📁" label="الوثائق" value={counts.documents ?? 0} />
                        <StatCard icon="👥" label="الوصيّون" value={counts.beneficiaries ?? 0} />
                    </div>

                    {checkin && (
                        <div className="card mb-6">
                            <h3 className="font-bold text-gray-800 mb-4">حالة تجديد الوجود</h3>
                            <div className="flex items-center gap-6 flex-wrap">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-indigo-600">{checkin.days_remaining}</p>
                                    <p className="text-xs text-gray-500">يوم متبقي</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-gray-600">{checkin.days_since_checkin}</p>
                                    <p className="text-xs text-gray-500">يوم منذ آخر تجديد</p>
                                </div>
                                <div className="flex-1" />
                                <button onClick={handleCheckin} className="btn-primary">
                                    أنا بخير ✓
                                </button>
                            </div>
                            <div className="mt-3 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (checkin.days_since_checkin / (checkin.checkin_interval_days || 30)) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {!will && (
                        <div className="card bg-indigo-50 border-indigo-200 text-center py-10">
                            <p className="text-4xl mb-3">📜</p>
                            <p className="text-gray-700 font-medium mb-4">لم تقم بإنشاء وصيتك بعد</p>
                            <a href="/will" className="btn-primary">
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
