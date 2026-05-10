import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import CheckinBanner from '../components/CheckinBanner';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EmailTest = () => {
    const { user } = useAuth();
    const [loading, setLoading]   = useState(false);
    const [message, setMessage]   = useState('');
    const [isError, setIsError]   = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const sendTest = async () => {
        setLoading(true);
        setMessage('');
        setIsError(false);
        setPreviewUrl(null);
        try {
            const r = await api.post('/auth/test-email');
            setMessage(r.data.message || 'تم الإرسال');
            setIsError(false);
            if (r.data.data?.previewUrl) setPreviewUrl(r.data.data.previewUrl);
        } catch (e) {
            setMessage(e.response?.data?.message || 'حدث خطأ أثناء الإرسال');
            setIsError(true);
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar title="اختبار البريد" />
                <CheckinBanner />
                <main className="flex-1 p-6 max-w-lg mx-auto w-full">
                    <div className="card space-y-5">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">اختبار إعدادات البريد</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                تُرسل رسالة تجريبية إلى بريد حسابك فقط للتحقق من SMTP (Gmail أو غيره).
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm">
                            <span className="text-gray-500">البريد المستهدف:</span>{' '}
                            <span className="font-mono text-gray-800 dir-ltr inline-block">{user?.email}</span>
                        </div>

                        <button
                            type="button"
                            onClick={sendTest}
                            disabled={loading}
                            className="btn-primary w-full disabled:opacity-60"
                        >
                            {loading ? 'جاري الإرسال…' : '📧 إرسال بريد تجريبي'}
                        </button>

                        {message && (
                            <div
                                className={`p-3 rounded-lg text-sm ${
                                    isError
                                        ? 'bg-red-50 text-red-800 border border-red-200'
                                        : 'bg-green-50 text-green-800 border border-green-200'
                                }`}
                            >
                                {message}
                            </div>
                        )}

                        {previewUrl && (
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-center text-sm text-indigo-600 underline"
                            >
                                معاينة الإيميل (وضع Ethereal التجريبي)
                            </a>
                        )}

                        <p className="text-xs text-gray-400 leading-relaxed">
                            لا يمكن إرسال رسالة الاختبار إلى بريد آخر من هذه الصفحة؛ ذلك يقلل الإساءة.
                            راجع مجلد الرسائل غير المرغوب فيها إذا لم تظهر الرسالة.
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EmailTest;
