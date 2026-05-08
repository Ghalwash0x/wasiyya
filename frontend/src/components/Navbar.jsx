import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ title }) => {
    const { user } = useAuth();

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <div className="text-sm text-gray-500">
                مرحباً، <span className="font-medium text-gray-800">{user?.full_name}</span>
            </div>
        </header>
    );
};

export default Navbar;
