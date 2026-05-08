import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
    { to: '/dashboard',      label: 'الرئيسية',     icon: '🏠' },
    { to: '/will',           label: 'وصيّتي',        icon: '📜' },
    { to: '/assets',         label: 'الأصول',        icon: '💼' },
    { to: '/documents',      label: 'الوثائق',       icon: '📁' },
    { to: '/beneficiaries',  label: 'الوصيّون',      icon: '👥' },
    { to: '/verification',   label: 'تجديد الوجود',  icon: '✅' },
];

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <aside className="w-60 min-h-screen bg-indigo-900 text-white flex flex-col">
            <div className="p-5 border-b border-indigo-700">
                <h1 className="text-2xl font-bold">وصيّة</h1>
                <p className="text-indigo-300 text-xs mt-1">Digital Will System</p>
            </div>

            <nav className="flex-1 p-3 space-y-1">
                {links.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                                isActive
                                    ? 'bg-white text-indigo-900 font-semibold'
                                    : 'text-indigo-200 hover:bg-indigo-800'
                            }`
                        }
                    >
                        <span>{link.icon}</span>
                        <span>{link.label}</span>
                    </NavLink>
                ))}

                {user?.role === 'admin' && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                                isActive
                                    ? 'bg-white text-indigo-900 font-semibold'
                                    : 'text-indigo-200 hover:bg-indigo-800'
                            }`
                        }
                    >
                        <span>⚙️</span>
                        <span>لوحة الإدارة</span>
                    </NavLink>
                )}
            </nav>

            <div className="p-4 border-t border-indigo-700">
                <div className="text-xs text-indigo-300 mb-2">
                    <p className="font-medium text-white truncate">{user?.full_name}</p>
                    <p className="truncate">{user?.email}</p>
                    <span className="inline-block mt-1 bg-indigo-700 px-2 py-0.5 rounded text-xs">{user?.role}</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full text-sm text-indigo-300 hover:text-white transition-colors text-right"
                >
                    تسجيل الخروج →
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
