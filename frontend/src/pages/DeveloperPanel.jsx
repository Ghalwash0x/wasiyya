import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const roleBadge = {
    developer: 'bg-purple-100 text-purple-700',
    admin:     'bg-amber-100  text-amber-700',
    manager:   'bg-teal-100   text-teal-700',
    user:      'bg-gray-100   text-gray-600',
};
const roleAr = { developer: 'مطور', admin: 'أدمن', manager: 'مراجع', user: 'مستخدم' };

/* ───────── Stats Cards ───────── */
const StatCard = ({ icon, label, value, color = 'indigo' }) => {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600',
        green:  'bg-green-50  text-green-600',
        red:    'bg-red-50    text-red-600',
        amber:  'bg-amber-50  text-amber-600',
        purple: 'bg-purple-50 text-purple-600',
    };
    return (
        <div className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
                <p className="text-sm text-gray-500">{label}</p>
            </div>
        </div>
    );
};

/* ───────── Users Tab ───────── */
const UsersTab = ({ users, onRefresh }) => {
    const [msg, setMsg] = useState('');
    const [newPwd, setNewPwd] = useState({});
    const [loading, setLoading] = useState('');

    const handleDelete = async (id, name) => {
        if (!window.confirm(`حذف "${name}" نهائياً؟ لا يمكن التراجع.`)) return;
        setLoading(id);
        try {
            await api.delete(`/developer/users/${id}`);
            setMsg(`✅ تم حذف ${name}`);
            await onRefresh();
        } catch (e) { setMsg(`❌ ${e.response?.data?.message || 'خطأ'}`); }
        setLoading('');
    };

    const handleRole = async (id, role) => {
        setLoading('role-' + id);
        try {
            await api.put(`/developer/users/${id}/role`, { role });
            setMsg('✅ تم تغيير الدور');
            await onRefresh();
        } catch (e) { setMsg(`❌ ${e.response?.data?.message || 'خطأ'}`); }
        setLoading('');
    };

    const handleToggle = async (id) => {
        setLoading('toggle-' + id);
        try {
            await api.put(`/developer/users/${id}/toggle`);
            setMsg('✅ تم تغيير الحالة');
            await onRefresh();
        } catch (e) { setMsg(`❌ ${e.response?.data?.message || 'خطأ'}`); }
        setLoading('');
    };

    const handleResetPwd = async (id) => {
        const pwd = newPwd[id];
        if (!pwd || pwd.length < 6) return setMsg('❌ كلمة السر يجب أن تكون 6 أحرف على الأقل');
        setLoading('pwd-' + id);
        try {
            await api.put(`/developer/users/${id}/reset-password`, { password: pwd });
            setMsg('✅ تم إعادة تعيين كلمة السر');
            setNewPwd(p => ({ ...p, [id]: '' }));
        } catch (e) { setMsg(`❌ ${e.response?.data?.message || 'خطأ'}`); }
        setLoading('');
    };

    const handleClear2FA = async (id) => {
        setLoading('2fa-' + id);
        try {
            await api.delete(`/developer/users/${id}/2fa`);
            setMsg('✅ تم مسح المصادقة الثنائية');
            await onRefresh();
        } catch (e) { setMsg(`❌ ${e.response?.data?.message || 'خطأ'}`); }
        setLoading('');
    };

    return (
        <div className="space-y-4">
            {msg && (
                <div className={`p-3 rounded-lg text-sm font-medium ${msg.startsWith('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {msg}
                </div>
            )}
            <div className="card overflow-x-auto">
                <h3 className="font-bold text-gray-800 mb-4">كل المستخدمين ({users.length})</h3>
                <div className="space-y-3">
                    {users.map(u => (
                        <div key={u.id} className={`p-4 rounded-xl border ${u.role === 'developer' ? 'border-purple-200 bg-purple-50' : 'border-gray-100 bg-white'}`}>
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-gray-800">{u.full_name}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[u.role]}`}>
                                            {roleAr[u.role]}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {u.is_active ? 'نشط' : 'معطّل'}
                                        </span>
                                        {u.two_fa_enabled ? <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">🔐 2FA</span> : null}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{u.email}</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {/* Role selector */}
                                    <select
                                        value={u.role}
                                        onChange={e => handleRole(u.id, e.target.value)}
                                        disabled={!!loading}
                                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                                    >
                                        <option value="user">مستخدم</option>
                                        <option value="manager">مراجع</option>
                                        <option value="admin">أدمن</option>
                                    </select>

                                    {/* Toggle */}
                                    <button
                                        onClick={() => handleToggle(u.id)}
                                        disabled={!!loading}
                                        className={`text-xs px-2 py-1 rounded font-medium ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                        {u.is_active ? 'تعطيل' : 'تفعيل'}
                                    </button>

                                    {/* Clear 2FA */}
                                    {u.two_fa_enabled ? (
                                        <button
                                            onClick={() => handleClear2FA(u.id)}
                                            disabled={loading === '2fa-' + u.id}
                                            className="text-xs px-2 py-1 rounded font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                                            مسح 2FA
                                        </button>
                                    ) : null}

                                    {/* Delete */}
                                    {u.role !== 'developer' ? (
                                        <button
                                            onClick={() => handleDelete(u.id, u.full_name)}
                                            disabled={loading === u.id}
                                            className="text-xs px-2 py-1 rounded font-medium bg-red-100 text-red-700 hover:bg-red-200">
                                            {loading === u.id ? '...' : 'حذف'}
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            {/* Reset password */}
                            <div className="flex items-center gap-2 mt-3">
                                <input
                                    type="password"
                                    placeholder="كلمة سر جديدة"
                                    value={newPwd[u.id] || ''}
                                    onChange={e => setNewPwd(p => ({ ...p, [u.id]: e.target.value }))}
                                    className="text-xs border border-gray-200 rounded px-2 py-1 flex-1 max-w-xs"
                                />
                                <button
                                    onClick={() => handleResetPwd(u.id)}
                                    disabled={loading === 'pwd-' + u.id}
                                    className="text-xs px-2 py-1 rounded font-medium bg-amber-50 text-amber-700 hover:bg-amber-100">
                                    {loading === 'pwd-' + u.id ? '...' : 'إعادة تعيين'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ───────── Wills Tab ───────── */
const WillsTab = ({ onRefresh }) => {
    const [wills, setWills] = useState([]);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState('');

    useEffect(() => {
        api.get('/admin/all-wills').then(r => setWills(r.data.data)).catch(() => {});
    }, []);

    const handleRestore = async (id) => {
        setLoading(id);
        try {
            await api.post(`/developer/wills/${id}/restore`);
            setMsg('✅ تم استعادة الوصية إلى نشطة');
            const r = await api.get('/admin/all-wills');
            setWills(r.data.data);
        } catch (e) { setMsg(`❌ ${e.response?.data?.message || 'خطأ'}`); }
        setLoading('');
    };

    const statusColor = { active: 'bg-green-100 text-green-700', triggered: 'bg-red-100 text-red-700', expired: 'bg-gray-100 text-gray-500' };
    const statusAr = { active: 'نشطة', triggered: 'مُفعَّلة', expired: 'منتهية' };

    return (
        <div className="space-y-4">
            {msg && (
                <div className={`p-3 rounded-lg text-sm font-medium ${msg.startsWith('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {msg}
                </div>
            )}
            <div className="card overflow-x-auto">
                <h3 className="font-bold text-gray-800 mb-4">كل الوصايا ({wills.length})</h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-500 border-b text-right">
                            <th className="pb-3 font-medium">عنوان الوصية</th>
                            <th className="pb-3 font-medium">صاحب الوصية</th>
                            <th className="pb-3 font-medium">الحالة</th>
                            <th className="pb-3 font-medium">الأصول</th>
                            <th className="pb-3 font-medium">الورثة</th>
                            <th className="pb-3 font-medium">إجراء</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {wills.map(w => (
                            <tr key={w.id} className="hover:bg-gray-50">
                                <td className="py-3 font-medium text-gray-800">{w.title}</td>
                                <td className="py-3">
                                    <p className="text-gray-800">{w.full_name}</p>
                                    <p className="text-xs text-gray-400">{w.owner_email}</p>
                                </td>
                                <td className="py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[w.status]}`}>
                                        {statusAr[w.status] || w.status}
                                    </span>
                                </td>
                                <td className="py-3 text-center text-gray-600">{w.assets_count}</td>
                                <td className="py-3 text-center text-gray-600">{w.ben_count}</td>
                                <td className="py-3">
                                    {w.status === 'triggered' && (
                                        <button onClick={() => handleRestore(w.id)} disabled={loading === w.id}
                                            className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded font-medium">
                                            {loading === w.id ? '...' : 'استعادة'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {wills.length === 0 && <p className="text-center py-10 text-gray-400">لا توجد وصايا</p>}
            </div>
        </div>
    );
};

/* ───────── Logs Tab ───────── */
const LogsTab = ({ logs }) => (
    <div className="card overflow-x-auto">
        <h3 className="font-bold text-gray-800 mb-4">سجل العمليات الكامل ({logs.length})</h3>
        <table className="w-full text-sm">
            <thead>
                <tr className="text-gray-500 border-b text-right">
                    <th className="pb-3 font-medium">المستخدم</th>
                    <th className="pb-3 font-medium">الدور</th>
                    <th className="pb-3 font-medium">الإجراء</th>
                    <th className="pb-3 font-medium">التوقيت</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                        <td className="py-2 text-gray-700">{log.full_name || 'النظام'}</td>
                        <td className="py-2">
                            {log.role ? (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadge[log.role] || 'bg-gray-100 text-gray-500'}`}>
                                    {roleAr[log.role] || log.role}
                                </span>
                            ) : '—'}
                        </td>
                        <td className="py-2">
                            <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                                log.action?.startsWith('DEV_')    ? 'bg-purple-100 text-purple-700'
                                : log.action === 'WILL_TRIGGERED' ? 'bg-red-100 text-red-700'
                                : log.action === 'CHECKIN'        ? 'bg-green-100 text-green-700'
                                : log.action === 'USER_LOGIN'     ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>{log.action}</span>
                        </td>
                        <td className="py-2 text-gray-400 text-xs">{new Date(log.created_at).toLocaleString('ar')}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        {logs.length === 0 && <p className="text-center py-10 text-gray-400">لا توجد سجلات</p>}
    </div>
);

/* ───────── Main ───────── */
const DeveloperPanel = () => {
    const [tab,     setTab]    = useState('users');
    const [users,   setUsers]  = useState([]);
    const [stats,   setStats]  = useState(null);
    const [logs,    setLogs]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]  = useState('');

    const fetchAll = useCallback(async () => {
        setError('');
        try {
            const [u, s, l] = await Promise.all([
                api.get('/developer/users'),
                api.get('/developer/stats'),
                api.get('/developer/logs'),
            ]);
            setUsers(u.data.data);
            setStats(s.data.data);
            setLogs(l.data.data);
        } catch (e) {
            setError(e.response?.data?.message || 'تعذر الاتصال بالسيرفر — تأكد من تشغيل قاعدة البيانات');
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const TABS = [
        { key: 'users', label: 'المستخدمون' },
        { key: 'wills', label: 'الوصايا'    },
        { key: 'logs',  label: 'السجلات'    },
    ];

    if (loading) return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p>جاري تحميل لوحة المطور...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Developer Console</h1>
                        <p className="text-xs text-gray-400 mt-0.5">صلاحيات كاملة — تصرف بحذر</p>
                    </div>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold">
                        DEVELOPER
                    </span>
                </header>

                <main className="flex-1 p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            ❌ {error}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard icon="👤" label="إجمالي المستخدمين"   value={stats?.total_users}       color="indigo" />
                        <StatCard icon="📜" label="الوصايا الكلية"       value={stats?.total_wills}        color="green"  />
                        <StatCard icon="🔔" label="وصايا مُفعَّلة"       value={stats?.triggered_wills}    color="red"    />
                        <StatCard icon="⚙️" label="حسابات المطورين"      value={stats?.developer_accounts} color="purple" />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1 w-fit">
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    tab === t.key
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === 'users' && <UsersTab users={users} onRefresh={fetchAll} />}
                    {tab === 'wills' && <WillsTab onRefresh={fetchAll} />}
                    {tab === 'logs'  && <LogsTab logs={logs} />}
                </main>
            </div>
        </div>
    );
};

export default DeveloperPanel;
