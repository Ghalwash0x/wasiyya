import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024)         return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/* ─────────── Stats Card ─────────── */
const StatCard = ({ icon, label, value, color = 'teal' }) => {
    const colors = {
        teal:   'bg-teal-50   text-teal-600',
        green:  'bg-green-50  text-green-600',
        red:    'bg-red-50    text-red-600',
        indigo: 'bg-indigo-50 text-indigo-600',
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

/* ─────────── Verify Result Modal ─────────── */
const VerifyModal = ({ result, onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="text-center mb-4">
                <span className="text-5xl">{result.intact ? '✅' : '❌'}</span>
                <h3 className={`text-lg font-bold mt-2 ${result.intact ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message}
                </h3>
            </div>

            <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">Hash متطابق</span>
                    <span className={`font-semibold ${result.hash_match ? 'text-green-600' : 'text-red-600'}`}>
                        {result.hash_match ? '✓ نعم' : '✗ لا'}
                    </span>
                </div>
                {result.signature_valid !== null && result.signature_valid !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-500">التوقيع الرقمي</span>
                        <span className={`font-semibold ${result.signature_valid ? 'text-green-600' : 'text-red-600'}`}>
                            {result.signature_valid ? '✓ صحيح' : '✗ غير صحيح'}
                        </span>
                    </div>
                )}
                {result.stored_hash && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 mb-1">Hash المخزّن</p>
                        <p className="font-mono text-xs text-gray-700 break-all">{result.stored_hash}</p>
                    </div>
                )}
                {result.current_hash && result.stored_hash !== result.current_hash && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-red-500 mb-1">Hash الحالي (مختلف!)</p>
                        <p className="font-mono text-xs text-red-700 break-all">{result.current_hash}</p>
                    </div>
                )}
            </div>

            <button onClick={onClose} className="w-full mt-5 btn-primary">إغلاق</button>
        </div>
    </div>
);

/* ─────────── Documents Tab ─────────── */
const DocumentsTab = ({ documents }) => {
    const [verifying,    setVerifying]    = useState(null);
    const [verifyResult, setVerifyResult] = useState(null);
    const [error,        setError]        = useState('');

    const handleVerify = async (docId) => {
        setVerifying(docId);
        setError('');
        try {
            const r = await api.post(`/manager/documents/${docId}/verify`);
            setVerifyResult(r.data);
        } catch (e) {
            setError(e.response?.data?.message || 'خطأ في التحقق');
        }
        setVerifying(null);
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-700 font-bold">×</button>
                </div>
            )}

            <div className="card overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">كل الوثائق في النظام ({documents.length})</h3>
                    <span className="text-xs text-gray-400 bg-teal-50 text-teal-600 px-2 py-1 rounded">
                        عرض فقط — لا يمكن تحميل أو فك تشفير الوثائق
                    </span>
                </div>

                {documents.length === 0 ? (
                    <p className="text-center py-10 text-gray-400">لا توجد وثائق بعد</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 border-b text-right">
                                <th className="pb-3 font-medium">الملف</th>
                                <th className="pb-3 font-medium">المالك</th>
                                <th className="pb-3 font-medium">الوصية</th>
                                <th className="pb-3 font-medium">الحجم</th>
                                <th className="pb-3 font-medium">التشفير</th>
                                <th className="pb-3 font-medium">تاريخ الرفع</th>
                                <th className="pb-3 font-medium">تحقق</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {documents.map(doc => (
                                <tr key={doc.id} className="hover:bg-gray-50">
                                    <td className="py-3">
                                        <p className="font-medium text-gray-800 max-w-[180px] truncate">{doc.original_name}</p>
                                        <p className="text-xs text-gray-400">{doc.mime_type}</p>
                                    </td>
                                    <td className="py-3">
                                        <p className="text-gray-700">{doc.owner_name}</p>
                                        <p className="text-xs text-gray-400">{doc.owner_email}</p>
                                    </td>
                                    <td className="py-3">
                                        <p className="text-gray-600 text-xs max-w-[120px] truncate">{doc.will_title}</p>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                            doc.will_status === 'active'    ? 'bg-green-100 text-green-700'
                                            : doc.will_status === 'triggered' ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {doc.will_status === 'active' ? 'نشطة' : doc.will_status === 'triggered' ? 'مُفعَّلة' : 'منتهية'}
                                        </span>
                                    </td>
                                    <td className="py-3 text-gray-500 text-xs">{formatSize(doc.file_size)}</td>
                                    <td className="py-3">
                                        <div className="flex flex-col gap-1">
                                            {doc.sha256_hash
                                                ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded w-fit">🔒 مشفّر</span>
                                                : <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded w-fit">غير مشفّر</span>
                                            }
                                            {doc.signature
                                                ? <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded w-fit">✍️ موقّع</span>
                                                : null
                                            }
                                        </div>
                                    </td>
                                    <td className="py-3 text-gray-400 text-xs">
                                        {new Date(doc.uploaded_at).toLocaleDateString('ar')}
                                    </td>
                                    <td className="py-3">
                                        <button
                                            onClick={() => handleVerify(doc.id)}
                                            disabled={verifying === doc.id || !doc.sha256_hash}
                                            title={!doc.sha256_hash ? 'لا يوجد hash للتحقق' : 'تحقق من سلامة الملف'}
                                            className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 transition-colors"
                                        >
                                            {verifying === doc.id ? '⏳' : '🔍 تحقق'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {verifyResult && <VerifyModal result={verifyResult} onClose={() => setVerifyResult(null)} />}
        </div>
    );
};

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
const ManagerPanel = () => {
    const [tab,       setTab]       = useState('documents');
    const [stats,     setStats]     = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState('');

    const fetchAll = useCallback(async () => {
        setError('');
        try {
            const [s, d] = await Promise.all([
                api.get('/manager/stats'),
                api.get('/manager/documents'),
            ]);
            setStats(s.data.data);
            setDocuments(d.data.data);
        } catch (e) {
            setError(e.response?.data?.message || 'فشل تحميل البيانات — تأكد من تشغيل السيرفر');
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const TABS = [
        { key: 'documents', label: 'الوثائق' },
    ];

    if (loading) return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p>جاري تحميل لوحة المراجعة...</p>
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
                        <h1 className="text-xl font-bold text-gray-800">لوحة مراجعة الوثائق</h1>
                        <p className="text-xs text-gray-400 mt-0.5">Document Review & Integrity Manager</p>
                    </div>
                    <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">
                        مراجع وثائق
                    </span>
                </header>

                <main className="flex-1 p-6 overflow-y-auto">

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between">
                            <span>{error}</span>
                            <button onClick={() => setError('')} className="text-red-400 hover:text-red-700 font-bold">×</button>
                        </div>
                    )}

                    {/* Stats row */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                        <StatCard icon="📁" label="إجمالي الوثائق"    value={stats?.total_documents}   color="teal"   />
                        <StatCard icon="🔒" label="وثائق مشفّرة"      value={stats?.encrypted_documents} color="green"  />
                        <StatCard icon="✍️" label="وثائق موقّعة"      value={stats?.signed_documents}   color="indigo" />
                        <StatCard icon="📜" label="إجمالي الوصايا"    value={stats?.total_wills}        color="amber"  />
                        <StatCard icon="🔔" label="وصايا مُفعَّلة"    value={stats?.triggered_wills}    color="red"    />
                        <StatCard icon="👥" label="مستخدمون نشطون"   value={stats?.active_users}       color="teal"   />
                    </div>

                    {/* Security notice */}
                    <div className="mb-5 bg-teal-50 border border-teal-200 rounded-xl px-5 py-3 text-sm text-teal-800 flex items-start gap-3">
                        <span className="text-lg shrink-0">🔐</span>
                        <div>
                            <p className="font-semibold">صلاحيات المراجع — للقراءة والتحقق فقط</p>
                            <p className="text-teal-600 text-xs mt-0.5">
                                يمكنك رؤية بيانات الوثائق والتحقق من سلامتها. لا يمكنك تحميل أو فك تشفير أي وثيقة.
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1 w-fit">
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    tab === t.key
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === 'documents' && <DocumentsTab documents={documents} />}
                </main>
            </div>
        </div>
    );
};

export default ManagerPanel;
