import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ───────── helpers ───────── */
const statusBadge = (s) => ({
    active:    'bg-green-100 text-green-700',
    triggered: 'bg-red-100 text-red-700',
    expired:   'bg-gray-100 text-gray-500',
})[s] || 'bg-gray-100 text-gray-500';

const statusAr = { active: 'نشطة', triggered: 'مُفعَّلة', expired: 'منتهية' };

/* ───────── sub-components ───────── */
const StatCard = ({ icon, label, value, color = 'indigo' }) => {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600',
        green:  'bg-green-50  text-green-600',
        red:    'bg-red-50    text-red-600',
        amber:  'bg-amber-50  text-amber-600',
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

/* ══════════════════════════════════════
   TAB: لوحة التحكم
══════════════════════════════════════ */
const HomeTab = ({ stats, logs, triggeredWills }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="👤" label="إجمالي المستخدمين" value={stats?.total_users}    color="indigo" />
            <StatCard icon="📜" label="الوصايا النشطة"    value={stats?.active_wills}   color="green"  />
            <StatCard icon="🔔" label="وصايا مُفعَّلة"    value={stats?.triggered_wills} color="red"    />
            <StatCard icon="📁" label="الوثائق المرفوعة"   value={stats?.total_documents} color="amber"  />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Triggered wills */}
            <div className="card">
                <h3 className="font-bold text-gray-800 mb-3">الوصايا المُفعَّلة مؤخراً</h3>
                {triggeredWills.length === 0 ? (
                    <p className="text-gray-400 text-sm py-4 text-center">لا توجد وصايا مُفعَّلة</p>
                ) : (
                    <div className="space-y-3">
                        {triggeredWills.slice(0, 5).map(w => (
                            <div key={w.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                                <span className="text-xl">🔔</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-800 truncate">{w.title}</p>
                                    <p className="text-xs text-gray-500">{w.full_name} — {new Date(w.triggered_at).toLocaleString('ar')}</p>
                                </div>
                                {w.beneficiaries?.map(b => b.access_url && (
                                    <a key={b.id} href={b.access_url} target="_blank" rel="noopener noreferrer"
                                       className="text-xs bg-indigo-600 text-white px-2 py-1 rounded shrink-0">
                                        افتح
                                    </a>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent logs */}
            <div className="card">
                <h3 className="font-bold text-gray-800 mb-3">آخر العمليات</h3>
                <div className="space-y-2">
                    {logs.slice(0, 8).map(log => (
                        <div key={log.id} className="flex items-center gap-2 text-sm">
                            <span className={`font-mono text-xs px-1.5 py-0.5 rounded shrink-0 ${
                                log.action === 'WILL_TRIGGERED' ? 'bg-red-100 text-red-700'
                                : log.action === 'CHECKIN'      ? 'bg-green-100 text-green-700'
                                : log.action === 'USER_LOGIN'   ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>{log.action}</span>
                            <span className="text-gray-600 truncate">{log.full_name || '—'}</span>
                            <span className="text-gray-400 text-xs shrink-0 mr-auto">
                                {new Date(log.created_at).toLocaleTimeString('ar')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

/* ══════════════════════════════════════
   TAB: المستخدمون
══════════════════════════════════════ */
const UsersTab = ({ users, setUsers }) => {
    const toggleUser = async (id) => {
        const r = await api.put(`/admin/users/${id}/toggle`);
        setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: r.data.data.is_active } : u));
    };
    const changeRole = async (id, role) => {
        const r = await api.put(`/admin/users/${id}/role`, { role });
        setUsers(prev => prev.map(u => u.id === id ? { ...u, role: r.data.data.role } : u));
    };

    return (
        <div className="card overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">إدارة المستخدمين ({users.length})</h3>
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-gray-500 border-b text-right">
                        <th className="pb-3 font-medium">الاسم</th>
                        <th className="pb-3 font-medium">البريد الإلكتروني</th>
                        <th className="pb-3 font-medium">الدور</th>
                        <th className="pb-3 font-medium">الحالة</th>
                        <th className="pb-3 font-medium">آخر تجديد</th>
                        <th className="pb-3 font-medium">تاريخ التسجيل</th>
                        <th className="pb-3 font-medium">إجراء</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50">
                            <td className="py-3 font-medium text-gray-800">{u.full_name}</td>
                            <td className="py-3 text-gray-500 text-xs">{u.email}</td>
                            <td className="py-3">
                                <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                                    className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white">
                                    <option value="user">مستخدم</option>
                                    <option value="admin">أدمن</option>
                                </select>
                            </td>
                            <td className="py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {u.is_active ? 'نشط' : 'معطّل'}
                                </span>
                            </td>
                            <td className="py-3 text-gray-400 text-xs">
                                {u.last_checkin ? new Date(u.last_checkin).toLocaleDateString('ar') : '—'}
                            </td>
                            <td className="py-3 text-gray-400 text-xs">
                                {new Date(u.created_at).toLocaleDateString('ar')}
                            </td>
                            <td className="py-3">
                                <button onClick={() => toggleUser(u.id)}
                                    className={`text-xs px-2 py-1 rounded font-medium ${
                                        u.is_active
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                                    }`}>
                                    {u.is_active ? 'تعطيل' : 'تفعيل'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

/* ══════════════════════════════════════
   TAB: الوصايا
══════════════════════════════════════ */
const WillsTab = ({ wills }) => (
    <div className="card overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">كل الوصايا في النظام ({wills.length})</h3>
        </div>
        <table className="w-full text-sm">
            <thead>
                <tr className="text-gray-500 border-b text-right">
                    <th className="pb-3 font-medium">عنوان الوصية</th>
                    <th className="pb-3 font-medium">صاحب الوصية</th>
                    <th className="pb-3 font-medium">الحالة</th>
                    <th className="pb-3 font-medium">الأصول</th>
                    <th className="pb-3 font-medium">الوثائق</th>
                    <th className="pb-3 font-medium">الورثة</th>
                    <th className="pb-3 font-medium">تاريخ الإنشاء</th>
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
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(w.status)}`}>
                                {statusAr[w.status] || w.status}
                            </span>
                        </td>
                        <td className="py-3 text-center text-gray-600">{w.assets_count}</td>
                        <td className="py-3 text-center text-gray-600">{w.docs_count}</td>
                        <td className="py-3 text-center text-gray-600">{w.ben_count}</td>
                        <td className="py-3 text-gray-400 text-xs">{new Date(w.created_at).toLocaleDateString('ar')}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        {wills.length === 0 && <p className="text-center py-10 text-gray-400">لا توجد وصايا بعد</p>}
    </div>
);

/* ══════════════════════════════════════
   TAB: السجلات
══════════════════════════════════════ */
const LogsTab = ({ logs }) => (
    <div className="card overflow-x-auto">
        <h3 className="font-bold text-gray-800 mb-4">سجل العمليات ({logs.length})</h3>
        <table className="w-full text-sm">
            <thead>
                <tr className="text-gray-500 border-b text-right">
                    <th className="pb-3 font-medium">المستخدم</th>
                    <th className="pb-3 font-medium">الإجراء</th>
                    <th className="pb-3 font-medium">IP</th>
                    <th className="pb-3 font-medium">التوقيت</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                        <td className="py-2 text-gray-700">{log.full_name || 'النظام'}</td>
                        <td className="py-2">
                            <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                                log.action === 'WILL_TRIGGERED'  ? 'bg-red-100 text-red-700'
                                : log.action === 'CHECKIN'       ? 'bg-green-100 text-green-700'
                                : log.action === 'USER_LOGIN'    ? 'bg-blue-100 text-blue-700'
                                : log.action === 'USER_REGISTERED' ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>{log.action}</span>
                        </td>
                        <td className="py-2 text-gray-400 text-xs">{log.ip_address || '—'}</td>
                        <td className="py-2 text-gray-400 text-xs">{new Date(log.created_at).toLocaleString('ar')}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        {logs.length === 0 && <p className="text-center py-10 text-gray-400">لا توجد سجلات</p>}
    </div>
);

/* ══════════════════════════════════════
   TAB: أدوات التيست
══════════════════════════════════════ */
const TestTab = ({ users, timeUnit, emailMode, triggeredWills, onRefresh }) => {
    const [msg,        setMsg]        = useState('');
    const [loading,    setLoading]    = useState('');
    const [agoValues,  setAgoValues]  = useState({});
    const unit = timeUnit === 'minutes' ? 'دقيقة' : 'يوم';

    const forceCheck = async () => {
        setLoading('check'); setMsg('');
        try {
            const r = await api.post('/admin/force-check');
            setMsg(`✅ ${r.data.message}`);
            await onRefresh();
        } catch (e) { setMsg(`❌ ${e.response?.data?.message || 'خطأ'}`); }
        setLoading('');
    };

    const resetCheckin = async (id) => {
        const ago = agoValues[id] || 5;
        setLoading(id); setMsg('');
        try {
            const r = await api.post(`/admin/reset-checkin/${id}?ago=${ago}`);
            setMsg(`✅ ${r.data.message}`);
            await onRefresh();
        } catch (e) { setMsg(`❌ ${e.response?.data?.message || 'خطأ'}`); }
        setLoading('');
    };

    const resetWill = async (id) => {
        setLoading('reset-' + id); setMsg('');
        try {
            await api.post(`/admin/reset-will/${id}`);
            setMsg('✅ تم إعادة تعيين الوصية إلى نشطة');
            await onRefresh();
        } catch (e) { setMsg(`❌ ${e.response?.data?.message || 'خطأ'}`); }
        setLoading('');
    };

    return (
        <div className="space-y-5">
            {/* Email + Time mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`card border-2 ${emailMode === 'gmail' ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
                    <p className="font-bold text-gray-800">{emailMode === 'gmail' ? '✅ Gmail حقيقي' : '🧪 Ethereal (تيست)'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                        {emailMode === 'gmail' ? 'الإيميل يُرسَل فعلياً.' : 'اضغط "📧 عرض الإيميل" بعد التفعيل.'}
                    </p>
                </div>
                <div className={`card border-2 ${timeUnit === 'minutes' ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
                    <p className="font-bold text-gray-800">{timeUnit === 'minutes' ? '🧪 وضع الدقائق' : '🏭 وضع الأيام'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                        {timeUnit === 'minutes' ? 'الكرون يعمل كل دقيقة.' : 'الكرون يعمل كل يوم الساعة 9.'}
                    </p>
                </div>
            </div>

            {msg && (
                <div className={`p-3 rounded-lg text-sm font-medium ${msg.startsWith('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {msg}
                </div>
            )}

            {/* Force check */}
            <div className="card">
                <h3 className="font-bold text-gray-800 mb-1">تشغيل Dead Man's Switch الآن</h3>
                <p className="text-sm text-gray-500 mb-3">يفحص كل المستخدمين ويُفعِّل الوصايا المنتهية فوراً.</p>
                <button onClick={forceCheck} disabled={loading === 'check'}
                    className="btn-primary disabled:opacity-60">
                    {loading === 'check' ? '⏳ جاري الفحص...' : '▶️ تشغيل الفحص الآن'}
                </button>
            </div>

            {/* Reset checkin */}
            <div className="card">
                <h3 className="font-bold text-gray-800 mb-1">محاكاة مرور الوقت</h3>
                <p className="text-sm text-gray-500 mb-3">اضبط آخر تجديد لمستخدم ليكون منذ X {unit}، ثم شغّل الفحص.</p>
                <div className="space-y-2">
                    {users.filter(u => u.role !== 'admin').map(u => (
                        <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{u.full_name}</p>
                                <p className="text-xs text-gray-400">{u.email} · آخر تجديد: {u.last_checkin ? new Date(u.last_checkin).toLocaleString('ar') : '—'}</p>
                            </div>
                            <input type="number" min="1" max="999"
                                value={agoValues[u.id] || 3}
                                onChange={e => setAgoValues(p => ({ ...p, [u.id]: e.target.value }))}
                                className="w-14 text-sm border border-gray-300 rounded px-2 py-1 text-center"
                            />
                            <span className="text-xs text-gray-500 shrink-0">{unit} مضت</span>
                            <button onClick={() => resetCheckin(u.id)} disabled={loading === u.id}
                                className="text-sm bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1.5 rounded-md font-medium disabled:opacity-60">
                                {loading === u.id ? '...' : 'ضبط'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Triggered wills + access links */}
            {triggeredWills.length > 0 && (
                <div className="card border border-red-200 bg-red-50">
                    <h3 className="font-bold text-red-800 mb-3">🔔 الوصايا المُفعَّلة ({triggeredWills.length})</h3>
                    <div className="space-y-4">
                        {triggeredWills.map(w => (
                            <div key={w.id} className="bg-white rounded-lg p-4 border border-red-100">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-gray-800">{w.title}</p>
                                        <p className="text-xs text-gray-500">{w.full_name} — فُعِّلت: {new Date(w.triggered_at).toLocaleString('ar')}</p>
                                    </div>
                                    <button onClick={() => resetWill(w.id)} disabled={loading === 'reset-' + w.id}
                                        className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded">
                                        {loading === 'reset-' + w.id ? '...' : 'إعادة تعيين'}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {w.beneficiaries?.length === 0 && <p className="text-xs text-gray-400">لا يوجد ورثة</p>}
                                    {w.beneficiaries?.map(b => (
                                        <div key={b.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded flex-wrap">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{b.name}</p>
                                                <p className="text-xs text-gray-500">{b.email}</p>
                                                {b.notified_at && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        أُبلغ: {new Date(b.notified_at).toLocaleString('ar')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2 flex-wrap items-center">
                                                {/* Email delivery status */}
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                                    b.email_status === 'sent'    ? 'bg-green-100 text-green-700'
                                                    : b.email_status === 'failed' ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {b.email_status === 'sent' ? '✅ أُرسل'
                                                    : b.email_status === 'failed' ? '❌ فشل'
                                                    : '⏳ معلّق'}
                                                </span>
                                                {b.token_valid && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">رابط صالح</span>}
                                                {b.accessed_at && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">تم الفتح</span>}
                                                {b.access_url && (
                                                    <a href={b.access_url} target="_blank" rel="noopener noreferrer"
                                                        className="text-xs bg-indigo-600 text-white px-3 py-1 rounded font-medium hover:bg-indigo-700">
                                                        افتح الوصية
                                                    </a>
                                                )}
                                                {b.email_preview && (
                                                    <a href={b.email_preview} target="_blank" rel="noopener noreferrer"
                                                        className="text-xs bg-amber-500 text-white px-3 py-1 rounded font-medium hover:bg-amber-600">
                                                        📧 عرض الإيميل
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
const AdminPanel = () => {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { logout } = useAuth();
    const qTab = new URLSearchParams(location.search).get('tab') || 'home';

    const [tab,            setTab]           = useState(qTab);
    const [users,          setUsers]         = useState([]);
    const [logs,           setLogs]          = useState([]);
    const [stats,          setStats]         = useState(null);
    const [wills,          setWills]         = useState([]);
    const [timeUnit,       setTimeUnit]      = useState('days');
    const [emailMode,      setEmailMode]     = useState('ethereal');
    const [triggeredWills, setTriggeredWills] = useState([]);
    const [loading,        setLoading]       = useState(true);
    const [bootstrapping,  setBootstrapping] = useState(false);

    useEffect(() => { setTab(qTab); }, [qTab]);

    const fetchAll = useCallback(async () => {
        try {
            const [u, l, s, w, t, em, tw] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/logs'),
                api.get('/admin/stats'),
                api.get('/admin/all-wills'),
                api.get('/admin/time-unit'),
                api.get('/admin/email-mode'),
                api.get('/admin/triggered-wills'),
            ]);
            setUsers(u.data.data);
            setLogs(l.data.data);
            setStats(s.data.data);
            setWills(w.data.data);
            setTimeUnit(t.data.data.time_unit);
            setEmailMode(em.data.data.mode);
            setTriggeredWills(tw.data.data);
        } catch (_) {}
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const TABS = [
        { key: 'home',  label: 'لوحة التحكم'  },
        { key: 'users', label: 'المستخدمون'    },
        { key: 'wills', label: 'الوصايا'       },
        { key: 'logs',  label: 'السجلات'       },
        { key: 'test',  label: '🧪 التيست'     },
    ];

    if (loading) return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p>جاري تحميل لوحة الإدارة...</p>
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
                        <h1 className="text-xl font-bold text-gray-800">لوحة إدارة النظام</h1>
                        <p className="text-xs text-gray-400 mt-0.5">Wasiyya Admin Panel</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">النظام يعمل</span>
                        {/* Bootstrap: only shown when first developer account needs to be created */}
                        <button
                            onClick={async () => {
                                if (!window.confirm('ترقية حسابك إلى Developer؟\nستحتاج لإعادة تسجيل الدخول بعدها.')) return;
                                setBootstrapping(true);
                                try {
                                    await api.post('/admin/bootstrap-developer');
                                    await logout();
                                    window.location.href = '/login';
                                } catch (e) {
                                    alert(e.response?.data?.message || 'خطأ');
                                    setBootstrapping(false);
                                }
                            }}
                            disabled={bootstrapping}
                            title="ترقية إلى Developer (يعمل فقط إذا لم يكن هناك حساب developer)"
                            className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 font-medium disabled:opacity-60"
                        >
                            {bootstrapping ? '...' : '⚙️ Dev Mode'}
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-y-auto">
                    {/* Tabs */}
                    <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1 w-fit">
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    tab === t.key
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === 'home'  && <HomeTab stats={stats} logs={logs} triggeredWills={triggeredWills} />}
                    {tab === 'users' && <UsersTab users={users} setUsers={setUsers} />}
                    {tab === 'wills' && <WillsTab wills={wills} />}
                    {tab === 'logs'  && <LogsTab logs={logs} />}
                    {tab === 'test'  && (
                        <TestTab users={users} timeUnit={timeUnit} emailMode={emailMode}
                            triggeredWills={triggeredWills} onRefresh={fetchAll} />
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminPanel;
