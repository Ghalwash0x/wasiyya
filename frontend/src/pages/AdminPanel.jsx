import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const AdminPanel = () => {
    const [tab, setTab]       = useState('users');
    const [users, setUsers]   = useState([]);
    const [logs, setLogs]     = useState([]);
    const [stats, setStats]   = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/admin/users'),
            api.get('/admin/logs'),
            api.get('/admin/stats')
        ]).then(([u, l, s]) => {
            setUsers(u.data.data);
            setLogs(l.data.data);
            setStats(s.data.data);
        }).finally(() => setLoading(false));
    }, []);

    const toggleUser = async (id) => {
        const r = await api.put(`/admin/users/${id}/toggle`);
        setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: r.data.data.is_active } : u));
    };

    const changeRole = async (id, role) => {
        const r = await api.put(`/admin/users/${id}/role`, { role });
        setUsers(prev => prev.map(u => u.id === id ? { ...u, role: r.data.data.role } : u));
    };

    if (loading) return <div className="flex min-h-screen"><Sidebar /><div className="p-10 text-gray-500">جاري التحميل...</div></div>;

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar title="لوحة الإدارة" />
                <main className="flex-1 p-6">

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: 'إجمالي المستخدمين', value: stats.total_users,    icon: '👤' },
                                { label: 'الوصايا النشطة',    value: stats.active_wills,   icon: '📜' },
                                { label: 'الوصايا المفعّلة',  value: stats.triggered_wills,icon: '🔔' },
                                { label: 'إجمالي الوثائق',    value: stats.total_documents, icon: '📁' },
                            ].map(s => (
                                <div key={s.label} className="card text-center">
                                    <p className="text-2xl">{s.icon}</p>
                                    <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
                                    <p className="text-xs text-gray-500">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 border-b border-gray-200">
                        {[['users', 'المستخدمون'], ['logs', 'سجلات النظام']].map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    tab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {tab === 'users' && (
                        <div className="card overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-500 border-b">
                                        <th className="text-right pb-3 font-medium">الاسم</th>
                                        <th className="text-right pb-3 font-medium">البريد</th>
                                        <th className="text-right pb-3 font-medium">الدور</th>
                                        <th className="text-right pb-3 font-medium">الحالة</th>
                                        <th className="text-right pb-3 font-medium">آخر تجديد</th>
                                        <th className="text-right pb-3 font-medium">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td className="py-3 font-medium text-gray-800">{u.full_name}</td>
                                            <td className="py-3 text-gray-600">{u.email}</td>
                                            <td className="py-3">
                                                <select
                                                    value={u.role}
                                                    onChange={e => changeRole(u.id, e.target.value)}
                                                    className="text-xs border border-gray-200 rounded px-1 py-0.5"
                                                >
                                                    <option value="user">user</option>
                                                    <option value="manager">manager</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                            </td>
                                            <td className="py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {u.is_active ? 'نشط' : 'معطّل'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-gray-500 text-xs">
                                                {u.last_checkin ? new Date(u.last_checkin).toLocaleDateString('ar') : '—'}
                                            </td>
                                            <td className="py-3">
                                                <button
                                                    onClick={() => toggleUser(u.id)}
                                                    className={`text-xs px-2 py-1 rounded ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                                >
                                                    {u.is_active ? 'تعطيل' : 'تفعيل'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {tab === 'logs' && (
                        <div className="card overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-500 border-b">
                                        <th className="text-right pb-3 font-medium">المستخدم</th>
                                        <th className="text-right pb-3 font-medium">الإجراء</th>
                                        <th className="text-right pb-3 font-medium">IP</th>
                                        <th className="text-right pb-3 font-medium">الوقت</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.map(log => (
                                        <tr key={log.id}>
                                            <td className="py-2 text-gray-700">{log.full_name || '—'}</td>
                                            <td className="py-2">
                                                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{log.action}</span>
                                            </td>
                                            <td className="py-2 text-gray-500 text-xs">{log.ip_address || '—'}</td>
                                            <td className="py-2 text-gray-400 text-xs">
                                                {new Date(log.created_at).toLocaleString('ar')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {logs.length === 0 && <p className="text-center py-8 text-gray-400">لا توجد سجلات</p>}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminPanel;
