import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Bell, HeartPulse, Loader2 } from 'lucide-react';

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

    const isOverdue = status.is_overdue;

    return (
        <div className={`px-5 py-2.5 flex items-center justify-between gap-3 text-sm font-medium border-b ${
            isOverdue
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
            <div className="flex items-center gap-2">
                {isOverdue
                    ? <AlertTriangle size={15} className="text-red-600 shrink-0" />
                    : <Bell size={15} className="text-amber-600 shrink-0" />}
                <span>
                    {isOverdue
                        ? `لم تجدد وجودك منذ ${status.elapsed} ${unit} — الوصية قد تُفعَّل قريباً!`
                        : `تذكير: متبقي ${status.days_remaining} ${unit} على تجديد وجودك`}
                </span>
            </div>
            <button
                onClick={handleCheckin}
                disabled={checking}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    isOverdue
                        ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                        : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                }`}
            >
                {checking
                    ? <><Loader2 size={11} className="animate-spin" /> جاري...</>
                    : <><HeartPulse size={11} /> أنا بخير</>}
            </button>
        </div>
    );
};

export default CheckinBanner;
