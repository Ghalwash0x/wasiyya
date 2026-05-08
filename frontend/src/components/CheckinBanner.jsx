import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CheckinBanner = () => {
    const { user } = useAuth();
    const [status,   setStatus]   = useState(null);
    const [checking, setChecking] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await api.get('/checkin/status');
            setStatus(res.data.data);
        } catch (_) {}
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') return;
        fetchStatus();
        const interval = setInterval(fetchStatus, 30_000);
        return () => clearInterval(interval);
    }, [fetchStatus, user]);

    // Admin doesn't have a dead man's switch
    if (!user || user.role === 'admin') return null;
    if (!status) return null;

    const unit = status.time_unit === 'minutes' ? 'دقيقة' : 'يوم';
    const showBanner = status.is_overdue || status.days_remaining <= (status.time_unit === 'minutes' ? 3 : 7);
    if (!showBanner) return null;

    const handleCheckin = async () => {
        setChecking(true);
        try {
            await api.post('/checkin');
            await fetchStatus();
        } catch (_) {}
        setChecking(false);
    };

    return (
        <div className={`px-4 py-2.5 text-center text-sm font-medium flex items-center justify-center gap-3 flex-wrap
            ${status.is_overdue
                ? 'bg-red-100 text-red-800 border-b border-red-200'
                : 'bg-amber-50 text-amber-800 border-b border-amber-200'}`}>
            <span>
                {status.is_overdue
                    ? `⚠️ لم تجدد وجودك منذ ${status.elapsed} ${unit} — الوصية قد تُفعَّل قريباً!`
                    : `🔔 تذكير: متبقي ${status.days_remaining} ${unit} على تجديد وجودك`}
            </span>
            <button
                onClick={handleCheckin}
                disabled={checking}
                className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors
                    ${status.is_overdue
                        ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                        : 'bg-white text-amber-800 border-amber-400 hover:bg-amber-50'}`}
            >
                {checking ? '...' : 'أنا بخير ✓'}
            </button>
        </div>
    );
};

export default CheckinBanner;
