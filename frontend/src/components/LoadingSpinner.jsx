import React from 'react';

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">جاري التحميل...</p>
        </div>
    </div>
);

export default LoadingSpinner;
