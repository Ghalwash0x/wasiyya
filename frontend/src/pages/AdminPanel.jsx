import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const AdminPanel = () => {
    const [tab,            setTab]           = useState('users');
    const [users,          setUsers]         = useState([]);
    const [logs,           setLogs]          = useState([]);
    const [stats,          setStats]         = useState(null);
    const [timeUnit,       setTimeUnit]      = useState('days');
    const [emailMode,      setEmailMode]     = useState('ethereal');
    const [triggeredWills, setTriggeredWills] = useState([]);
    const [loading,        setLoading]       = useState(true);
    const [testMsg,        setTestMsg]       = useState('');
    const [testLoading,    setTestLoading]   = useState('');
    const [agoValues,      setAgoValues]     = useState({});

    const isMinutes = timeUnit === 'minutes';
    const unit = isMinutes ? 'دقيقة' : 'يوم';

    useEffect(() => {
        Promise.all([
            api.get('/admin/users'),
            api.get('/admin/logs'),
            api.get('/admin/stats'),
            api.get('/admin/time-unit'),
            api.get('/admin/email-mode'),
            api.get('/admin/triggered-wills')
        ]).then(([u, l, s, t, em, tw]) => {
            setUsers(u.data.data);
            setLogs(l.data.data);
            setStats(s.data.data);
            setTimeUnit(t.data.data.time_unit);
            setEmailMode(em.data.data.mode);
            setTriggeredWills(tw.data.data);
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

    const reloadTestData = async () => {
        const [u, s, tw] = await Promise.all([
            api.get('/admin/users'),
            api.get('/admin/stats'),
            api.get('/admin/triggered-wills')
        ]);
        setUsers(u.data.data);
        setStats(s.data.data);
        setTriggeredWills(tw.data.data);
    };

    const forceCheck = async () => {
        setTestLoading('check');
        setTestMsg('');
        try {
            const r = await api.post('/admin/force-check');
            setTestMsg(`✅ ${r.data.message}`);
            await reloadTestData();
        } catch (err) {
            setTestMsg(`❌ ${err.response?.data?.message || 'خطأ'}`);
        }
        setTestLoading('');
    };

    const resetCheckin = async (userId) => {
        const ago = agoValues[userId] || 5;
        setTestLoading(userId);
        setTestMsg('');
        try {
            const r = await api.post(`/admin/reset-checkin/${userId}?ago=${ago}`);
            setTestMsg(`✅ ${r.data.message}`);
            await reloadTestData();
        } catch (err) {
            setTestMsg(`❌ ${err.response?.data?.message || 'خطأ'}`);
        }
        setTestLoading('');
    };

    const resetWill = async (willId) => {
        setTestLoading('reset-' + willId);
        try {
            await api.post(`/admin/reset-will/${willId}`);
            setTestMsg('✅ تم إعادة تعيين الوصية إلى نشطة');
            await reloadTestData();
        } catch (err) {
            setTestMsg(`❌ ${err.response?.data?.message || 'خطأ'}`);
        }
        setTestLoading('');
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

    const tabs = [
        ['users', 'المستخدمون'],
        ['logs',  'سجلات النظام'],
        ['test',  `🧪 التيست${isMinutes ? ' (دقائق)' : ''}`],
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar title="لوحة الإدارة" />
                <main className="flex-1 p-6">

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: 'إجمالي المستخدمين', value: stats.total_users,     icon: '👤' },
                                { label: 'الوصايا النشطة',    value: stats.active_wills,    icon: '📜' },
                                { label: 'الوصايا المُفعَّلة', value: stats.triggered_wills, icon: '🔔' },
                                { label: 'إجمالي الوثائق',    value: stats.total_documents,  icon: '📁' },
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
                        {tabs.map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    tab === key
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Users Tab */}
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
                                            <td className="py-3 text-gray-600 text-xs">{u.email}</td>
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
                                                {u.last_checkin ? new Date(u.last_checkin).toLocaleString('ar') : '—'}
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

                    {/* Logs Tab */}
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
                                                <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                                                    log.action === 'WILL_TRIGGERED' ? 'bg-red-100 text-red-700'
                                                    : log.action === 'CHECKIN'      ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>{log.action}</span>
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

                    {/* Test Tab */}
                    {tab === 'test' && (
                        <div className="space-y-6">
                            {/* Email mode badge */}
                            <div className={`card border-2 ${emailMode === 'gmail' ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{emailMode === 'gmail' ? '✅' : '🧪'}</span>
                                    <div>
                                        <p className="font-bold text-gray-800">
                                            وضع الإيميل: {emailMode === 'gmail' ? 'Gmail حقيقي' : 'Ethereal (تيست)'}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-0.5">
                                            {emailMode === 'gmail'
                                                ? 'الإيميل هيوصل فعلاً للوارث على إيميله الحقيقي.'
                                                : 'الإيميل مش بيتبعت حقيقي — بعد التفعيل اضغط "📧 عرض الإيميل" في الوصايا المُفعَّلة أدناه.'}
                                        </p>
                                        {emailMode === 'ethereal' && (
                                            <p className="text-xs text-amber-700 mt-1">
                                                لتفعيل Gmail الحقيقي: حدّث EMAIL_USER و EMAIL_PASS في backend/.env
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Mode badge */}
                            <div className={`card border-2 ${isMinutes ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{isMinutes ? '🧪' : '🏭'}</span>
                                    <div>
                                        <p className="font-bold text-gray-800">
                                            وضع {isMinutes ? 'التيست (دقائق)' : 'الإنتاج (أيام)'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {isMinutes
                                                ? 'كل "يوم" في الإعدادات = دقيقة واحدة فعلياً. الكرون يعمل كل دقيقة.'
                                                : 'الكرون يعمل كل يوم الساعة 9 صبح. لتفعيل التيست: TIME_UNIT=minutes في .env'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Test message */}
                            {testMsg && (
                                <div className={`p-3 rounded-lg text-sm font-medium ${testMsg.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                    {testMsg}
                                </div>
                            )}

                            {/* Force Check */}
                            <div className="card">
                                <h3 className="font-bold text-gray-800 mb-2">تشغيل الفحص الآن</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    يشغّل منطق Dead Man's Switch مباشرة الآن — يفحص كل المستخدمين ويُفعِّل الوصايا المنتهية تلقائياً.
                                </p>
                                <button
                                    onClick={forceCheck}
                                    disabled={testLoading === 'check'}
                                    className="btn-primary disabled:opacity-60"
                                >
                                    {testLoading === 'check' ? '⏳ جاري الفحص...' : '▶️ تشغيل الفحص الآن'}
                                </button>
                            </div>

                            {/* Reset Checkin per user */}
                            <div className="card">
                                <h3 className="font-bold text-gray-800 mb-2">محاكاة مرور الوقت</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    اضبط آخر تجديد لأي مستخدم ليصبح منذ X {unit} — ثم اضغط "تشغيل الفحص" لترى ماذا يحصل.
                                </p>
                                <div className="space-y-3">
                                    {users.filter(u => u.role === 'user').map(u => (
                                        <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm text-gray-800">{u.full_name}</p>
                                                <p className="text-xs text-gray-500">{u.email}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    آخر تجديد: {u.last_checkin ? new Date(u.last_checkin).toLocaleString('ar') : '—'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="999"
                                                    value={agoValues[u.id] || 5}
                                                    onChange={e => setAgoValues(prev => ({ ...prev, [u.id]: e.target.value }))}
                                                    className="w-16 text-sm border border-gray-300 rounded px-2 py-1 text-center"
                                                />
                                                <span className="text-xs text-gray-500">{unit} مضت</span>
                                                <button
                                                    onClick={() => resetCheckin(u.id)}
                                                    disabled={testLoading === u.id}
                                                    className="text-sm bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-60"
                                                >
                                                    {testLoading === u.id ? '...' : 'ضبط'}
                                                </button>
                                            </div>
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
                                                        <p className="text-xs text-gray-500">صاحب الوصية: {w.full_name} ({w.owner_email})</p>
                                                        <p className="text-xs text-gray-400">فُعِّلت: {new Date(w.triggered_at).toLocaleString('ar')}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => resetWill(w.id)}
                                                        disabled={testLoading === 'reset-' + w.id}
                                                        className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded transition-colors"
                                                    >
                                                        {testLoading === 'reset-' + w.id ? '...' : 'إعادة تعيين'}
                                                    </button>
                                                </div>
                                                {w.beneficiaries.length === 0 ? (
                                                    <p className="text-xs text-gray-400 italic">لا يوجد ورثة مضافون</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-gray-600 mb-1">روابط الوصول للورثة:</p>
                                                        {w.beneficiaries.map(b => (
                                                            <div key={b.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-800">{b.name}</p>
                                                                    <p className="text-xs text-gray-500">{b.email}</p>
                                                                </div>
                                                                {b.access_url ? (
                                                                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                                                        {b.token_valid ? (
                                                                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">صالح</span>
                                                                        ) : (
                                                                            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">منتهي</span>
                                                                        )}
                                                                        <a
                                                                            href={b.access_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded font-medium transition-colors"
                                                                        >
                                                                            افتح الوصية
                                                                        </a>
                                                                        {b.email_preview && (
                                                                            <a
                                                                                href={b.email_preview}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-xs bg-amber-500 text-white hover:bg-amber-600 px-3 py-1.5 rounded font-medium transition-colors"
                                                                            >
                                                                                📧 عرض الإيميل
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">لم يُبلَّغ بعد</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* How to test guide */}
                            <div className="card bg-blue-50 border border-blue-200">
                                <h3 className="font-bold text-blue-800 mb-3">خطوات التيست الكاملة</h3>
                                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                                    <li>أضف وصي (وارث) بإيميل حقيقي في صفحة <strong>الورثة</strong></li>
                                    <li>اضبط الفترة الزمنية للمستخدم: مثلاً <strong>3 دقائق مضت</strong> (لوصية بـ interval=2 وgrace=1)</li>
                                    <li>اضغط <strong>"تشغيل الفحص الآن"</strong></li>
                                    <li>شوف سجل العمليات — المفروض يظهر <code className="bg-red-100 px-1 rounded">WILL_TRIGGERED</code></li>
                                    <li>الوارث المفروض يستقبل إيميل فيه رابط الوصول</li>
                                    <li>لإعادة التيست: اضغط <strong>Reset Will</strong> في الداتابيز أو استخدم phpMyAdmin</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminPanel;
