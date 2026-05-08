import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const CheckinBanner = () => {
    const [status, setStatus]   = useState(null);
    const [checking, setChecking] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await api.get('/checkin/status');
            setStatus(res.data.data);
        } catch (_) {}
    }, []);

    useEffect(() => {
        fetchStatus();
        // auto-refresh: every 30s in minutes-mode, every 5 min otherwise
        const interval = setInterval(fetchStatus, 30_000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleCheckin = async () => {
        setChecking(true);
        try {
            await api.post('/checkin');
            await fetchStatus();
        } catch (_) {}
        setChecking(false);
    };

    if (!status) return null;

    const unit = status.time_unit === 'minutes' ? 'دقيقة' : 'يوم';
    const showBanner = status.is_overdue || status.days_remaining <= (status.time_unit === 'minutes' ? 3 : 7);
    if (!showBanner) return null;

    const isOverdue = status.is_overdue;

    return (
        <div className={`px-4 py-2.5 text-center text-sm font-medium flex items-center justify-center gap-3 flex-wrap
            ${isOverdue ? 'bg-red-100 text-red-800 border-b border-red-200' : 'bg-amber-50 text-amber-800 border-b border-amber-200'}`}>
            <span>
                {isOverdue
                    ? `⚠️ لم تجدد وجودك منذ ${status.elapsed} ${unit} — الوصية قد تُفعَّل قريباً!`
                    : `🔔 تذكير: متبقي ${status.days_remaining} ${unit} على تجديد وجودك`}
            </span>
            <button
                onClick={handleCheckin}
                disabled={checking}
                className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors
                    ${isOverdue
                        ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                        : 'bg-white text-amber-800 border-amber-400 hover:bg-amber-50'}`}
            >
                {checking ? '...' : 'أنا بخير ✓'}
            </button>
        </div>
    );
};

export default CheckinBanner;
