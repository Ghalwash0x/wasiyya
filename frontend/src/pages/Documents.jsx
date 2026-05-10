import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const Documents = () => {
    const [will, setWill]           = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileRef                   = useRef();

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
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.original_name;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDelete = async (id) => {
        if (!confirm('حذف هذا الملف؟')) return;
        await api.delete(`/documents/${id}`);
        setDocuments(prev => prev.filter(d => d.id !== id));
    };

    if (loading) return <div className="flex min-h-screen"><Sidebar /><div className="p-10 text-gray-500">جاري التحميل...</div></div>;

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
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-600 text-sm">{documents.length} وثيقة</p>
                        <div>
                            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload}
                                accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx" />
                            <button
                                onClick={() => fileRef.current.click()}
                                disabled={uploading}
                                className="btn-primary disabled:opacity-60"
                            >
                                {uploading ? 'جاري الرفع...' : '+ رفع وثيقة'}
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-4">الأنواع المقبولة: PDF, JPG, PNG, TXT, DOC, DOCX — الحد الأقصى: 10MB</p>

                    <div className="space-y-3">
                        {documents.map(doc => (
                            <div key={doc.id} className="card flex items-center gap-4">
                                <span className="text-2xl">📄</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate">{doc.original_name}</p>
                                    <p className="text-xs text-gray-500">{formatSize(doc.file_size)} · {doc.mime_type}</p>
                                    <p className="text-xs text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString('ar')}</p>
                                </div>
                                <div className="flex gap-2">
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
        </div>
    );
};

export default Documents;
