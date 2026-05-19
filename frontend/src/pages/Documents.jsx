import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api     from '../services/api';

const formatSize = (bytes) => {
    if (bytes < 1024)           return `${bytes} B`;
    if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

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

const Documents = () => {
    const [will,      setWill]      = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [uploading, setUploading] = useState(false);
    const [verifying, setVerifying] = useState(null);
    const [verifyResult, setVerifyResult] = useState(null);
    const fileRef = useRef();

    useEffect(() => {
        api.get('/wills').then(r => {
            const w = r.data.data[0];
            setWill(w);
            if (w) return api.get(`/documents/${w.id}`).then(dr => setDocuments(dr.data.data));
        }).finally(() => setLoading(false));
    }, []);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fd = new FormData();
        fd.append('file', file);
        fd.append('will_id', will.id);

        setUploading(true);
        try {
            const r = await api.post('/documents/upload', fd);
            setDocuments(prev => [r.data.data, ...prev]);
        } catch (err) {
            alert(err.response?.data?.message || 'فشل رفع الملف');
        }
        setUploading(false);
        fileRef.current.value = '';
    };

    const handleDownload = async (doc) => {
        const res = await api.get(`/documents/download/${doc.id}`, { responseType: 'blob' });
        const url = URL.createObjectURL(new Blob([res.data]));
        const a   = document.createElement('a');
        a.href     = url;
        a.download = doc.original_name;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDelete = async (id) => {
        if (!confirm('حذف هذا الملف؟')) return;
        await api.delete(`/documents/${id}`);
        setDocuments(prev => prev.filter(d => d.id !== id));
    };

    const handleVerify = async (doc) => {
        setVerifying(doc.id);
        try {
            const r = await api.post(`/documents/verify/${doc.id}`);
            setVerifyResult(r.data);
        } catch (err) {
            setVerifyResult({ intact: false, message: err.response?.data?.message || 'خطأ في التحقق' });
        }
        setVerifying(null);
    };

    if (loading) return (
        <div className="flex min-h-screen"><Sidebar />
            <div className="p-10 text-gray-500">جاري التحميل...</div>
        </div>
    );

    if (!will) return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar title="الوثائق" />
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    يجب إنشاء وصية أولاً — <a href="/will" className="text-indigo-600 mr-1">إنشاء وصية</a>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar title="الوثائق" />
                <main className="flex-1 p-6">

                    <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-600 text-sm">{documents.length} وثيقة — مشفّرة بـ AES-256-GCM</p>
                        <div>
                            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload}
                                accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx" />
                            <button onClick={() => fileRef.current.click()} disabled={uploading}
                                className="btn-primary disabled:opacity-60">
                                {uploading ? 'جاري الرفع...' : '+ رفع وثيقة'}
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-4">
                        الأنواع المقبولة: PDF, JPG, PNG, TXT, DOC, DOCX — الحد الأقصى: 10MB
                    </p>

                    <div className="space-y-3">
                        {documents.map(doc => (
                            <div key={doc.id} className="card flex items-center gap-4">
                                <span className="text-2xl">📄</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate">{doc.original_name}</p>
                                    <p className="text-xs text-gray-500">{formatSize(doc.file_size)} · {doc.mime_type}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString('ar')}</p>
                                        {doc.sha256_hash && (
                                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                                🔒 مشفّر + موقّع
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-wrap justify-end">
                                    <button onClick={() => handleVerify(doc)}
                                        disabled={verifying === doc.id}
                                        className="text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium disabled:opacity-60 transition-colors">
                                        {verifying === doc.id ? '⏳' : '🔍 تحقق'}
                                    </button>
                                    <button onClick={() => handleDownload(doc)} className="btn-secondary text-sm">تحميل</button>
                                    <button onClick={() => handleDelete(doc.id)} className="btn-danger text-sm">حذف</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {documents.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <p className="text-5xl mb-3">📁</p>
                            <p>لا توجد وثائق مرفوعة بعد</p>
                        </div>
                    )}
                </main>
            </div>

            {verifyResult && (
                <VerifyModal result={verifyResult} onClose={() => setVerifyResult(null)} />
            )}
        </div>
    );
};

export default Documents;
