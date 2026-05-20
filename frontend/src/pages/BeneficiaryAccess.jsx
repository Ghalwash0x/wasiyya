import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const typeLabels = { account: 'حساب', bank: 'بنك', password: 'كلمة سر', info: 'معلومات', note: 'ملاحظة' };
const typeIcons  = { account: '🔑', bank: '🏦', password: '🔐', info: 'ℹ️', note: '📝' };

const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const BeneficiaryAccess = () => {
    const { token } = useParams();
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState('');
    const [reveal, setReveal] = useState({});

    useEffect(() => {
        api.get(`/beneficiaries/access/${token}`)
            .then(r => setData(r.data.data))
            .catch(err => setError(err.response?.data?.message || 'الرابط غير صالح أو منتهي الصلاحية'))
            .finally(() => setLoading(false));
    }, [token]);

    const handleDownload = async (doc) => {
        try {
            // Use token-based endpoint — no JWT required for beneficiary access
            const res = await fetch(`/api/beneficiaries/access/${token}/document/${doc.id}`);
            if (!res.ok) throw new Error('fetch failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.original_name;
            a.click();
            URL.revokeObjectURL(url);
        } catch (_) {
            alert('فشل تحميل الملف');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500">جاري تحميل الوصية...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="card text-center max-w-md">
                <p className="text-5xl mb-4">❌</p>
                <h2 className="text-xl font-bold text-gray-800 mb-2">رابط غير صالح</h2>
                <p className="text-gray-500">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-indigo-900">وصيّة</h1>
                    <p className="text-gray-500 mt-1">وصية رقمية موجهة إليك</p>
                </div>

                {/* Beneficiary info */}
                <div className="card mb-6 bg-indigo-50 border-indigo-100">
                    <p className="text-indigo-800">
                        مرحباً <strong>{data.beneficiary.name}</strong>، هذه الوصية موجهة إليك شخصياً.
                    </p>
                </div>

                {/* Will info */}
                <div className="card mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{data.will.title}</h2>
                    {data.will.description && <p className="text-gray-600 text-sm">{data.will.description}</p>}
                </div>

                {/* Assets */}
                {data.assets.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">الأصول ({data.assets.length})</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            {data.assets.map(asset => (
                                <div key={asset.id} className="card">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xl">{typeIcons[asset.asset_type]}</span>
                                        <div>
                                            <p className="font-semibold text-gray-800">{asset.title}</p>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{typeLabels[asset.asset_type]}</span>
                                        </div>
                                    </div>
                                    {reveal[asset.id] ? (
                                        <pre className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap break-words">{asset.content}</pre>
                                    ) : (
                                        <div className="bg-gray-50 p-3 rounded text-sm text-gray-400 select-none">••••••••••••</div>
                                    )}
                                    <button
                                        onClick={() => setReveal(prev => ({ ...prev, [asset.id]: !prev[asset.id] }))}
                                        className="text-xs text-indigo-600 mt-2 hover:underline"
                                    >
                                        {reveal[asset.id] ? 'إخفاء' : 'عرض المحتوى'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Documents */}
                {data.documents.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">الوثائق ({data.documents.length})</h3>
                        <div className="space-y-3">
                            {data.documents.map(doc => (
                                <div key={doc.id} className="card flex items-center gap-4">
                                    <span className="text-2xl">📄</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{doc.original_name}</p>
                                        <p className="text-xs text-gray-500">{formatSize(doc.file_size)}</p>
                                    </div>
                                    <button onClick={() => handleDownload(doc)} className="btn-primary text-sm">
                                        تحميل
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-8">
                    وصيّة — منصة الوصايا الرقمية · هذا الرابط سري ولا تشاركه مع أحد
                </p>
            </div>
        </div>
    );
};

export default BeneficiaryAccess;
