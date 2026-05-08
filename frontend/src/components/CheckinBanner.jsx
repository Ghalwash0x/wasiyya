import React, { useState, useEffect } from 'react';
import api from '../services/api';

const CheckinBanner = () => {
    const [status, setStatus] = useState(null);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        api.get('/checkin/status')
            .then(res => setStatus(res.data.data))
            .catch(() => {});
    }, []);

    const handleCheckin = async () => {
        setChecking(true);
        try {
            await api.post('/checkin');
            const res = await api.get('/checkin/status');
            setStatus(res.data.data);
        } catch (_) {}
        setChecking(false);
    };

    if (!status || !status.is_overdue && status.days_remaining > 7) return null;

    const isWarning = status.days_remaining <= 7 && !status.is_overdue;
    const isOverdue = status.is_overdue;

    return (
        <div className={`p-3 text-center text-sm font-medium ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
            {isOverdue
                ? `⚠️ لم تجدد وجودك منذ ${status.days_since_checkin} يوماً — قد يتم تفعيل وصيتك قريباً!`
                : `🔔 تجديد الوجود: متبقي ${status.days_remaining} يوم`}
            <button
                onClick={handleCheckin}
                disabled={checking}
                className="mr-3 bg-white px-3 py-1 rounded-md text-xs font-semibold border border-current"
            >
                {checking ? '...' : 'أنا بخير ✓'}
            </button>
        </div>
    );
};

export default CheckinBanner;
