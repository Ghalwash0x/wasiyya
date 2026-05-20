import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const userLinks = [
    { to: '/dashboard',     label: 'الرئيسية',      icon: '🏠' },
    { to: '/will',          label: 'وصيّتي',         icon: '📜' },
    { to: '/assets',        label: 'الأصول',         icon: '💼' },
    { to: '/documents',     label: 'الوثائق',        icon: '📁' },
    { to: '/beneficiaries', label: 'الورثة',         icon: '👥' },
    { to: '/verification',  label: 'تجديد الوجود',   icon: '✅' },
];

const adminLinks = [
    { to: '/admin',            label: 'لوحة التحكم',    icon: '📊', end: true  },
    { to: '/admin?tab=users',  label: 'المستخدمون',     icon: '👤', end: false },
    { to: '/admin?tab=wills',  label: 'الوصايا',        icon: '📜', end: false },
    { to: '/admin?tab=logs',   label: 'السجلات',        icon: '📋', end: false },
    { to: '/admin?tab=test',   label: 'أدوات التيست',   icon: '🧪', end: false },
];

const developerLinks = [
    { to: '/developer',        label: 'لوحة المطور',    icon: '⚙️', end: true  },
];

const managerLinks = [
    { to: '/manager', label: 'مراجعة الوثائق', icon: '🔍', end: true },
];

const accountLinks = [
    { to: '/settings/2fa',     label: 'المصادقة الثنائية', icon: '🔐' },
];

const NavItem = ({ to, label, icon, end }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                    ? 'bg-white text-indigo-900 font-semibold'
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
            }`
        }
    >
        <span className="text-base">{icon}</span>
        <span>{label}</span>
    </NavLink>
);

const SectionLabel = ({ children }) => (
    <p className="text-indigo-400 text-xs px-4 pt-3 pb-1 uppercase tracking-wider">{children}</p>
);

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isAdmin     = user?.role === 'admin';
    const isDeveloper = user?.role === 'developer';
    const isManager   = user?.role === 'manager';

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <aside className="w-60 min-h-screen bg-indigo-900 text-white flex flex-col shrink-0">
            {/* Brand */}
            <div className="p-5 border-b border-indigo-700">
                <h1 className="text-2xl font-bold tracking-wide">وصيّة</h1>
                <p className="text-indigo-300 text-xs mt-1">
                    {isDeveloper ? 'Developer Console'
                    : isAdmin    ? 'لوحة الإدارة'
                    : isManager  ? 'Document Review'
                    : 'Digital Will System'}
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {isDeveloper ? (
                    <>
                        <SectionLabel>المطور</SectionLabel>
                        {developerLinks.map(link => (
                            <NavItem key={link.to} to={link.to} label={link.label} icon={link.icon} end={link.end} />
                        ))}
                        <SectionLabel>الحساب</SectionLabel>
                        {accountLinks.map(link => (
                            <NavItem key={link.to} to={link.to} label={link.label} icon={link.icon} />
                        ))}
                    </>
                ) : isManager ? (
                    <>
                        <SectionLabel>المراجعة</SectionLabel>
                        {managerLinks.map(link => (
                            <NavItem key={link.to} to={link.to} label={link.label} icon={link.icon} end={link.end} />
                        ))}
                        <SectionLabel>الحساب</SectionLabel>
                        {accountLinks.map(link => (
                            <NavItem key={link.to} to={link.to} label={link.label} icon={link.icon} />
                        ))}
                    </>
                ) : isAdmin ? (
                    <>
                        <SectionLabel>الإدارة</SectionLabel>
                        {adminLinks.map(link => (
                            <NavItem key={link.to} to={link.to} label={link.label} icon={link.icon} end={link.end} />
                        ))}
                        <SectionLabel>الحساب</SectionLabel>
                        {accountLinks.map(link => (
                            <NavItem key={link.to} to={link.to} label={link.label} icon={link.icon} />
                        ))}
                    </>
                ) : (
                    <>
                        <SectionLabel>القائمة</SectionLabel>
                        {userLinks.map(link => (
                            <NavItem key={link.to} to={link.to} label={link.label} icon={link.icon} />
                        ))}
                        <SectionLabel>الحساب</SectionLabel>
                        {accountLinks.map(link => (
                            <NavItem key={link.to} to={link.to} label={link.label} icon={link.icon} />
                        ))}
                    </>
                )}
            </nav>

            {/* User info + logout */}
            <div className="p-4 border-t border-indigo-700">
                <div className="mb-3">
                    <p className="font-semibold text-white text-sm truncate">{user?.full_name}</p>
                    <p className="text-indigo-300 text-xs truncate mt-0.5">{user?.email}</p>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-medium
                        ${isDeveloper ? 'bg-purple-600 text-white'
                        : isAdmin     ? 'bg-amber-500  text-white'
                        : isManager   ? 'bg-teal-600   text-white'
                        : 'bg-indigo-700 text-indigo-200'}`}>
                        {isDeveloper ? 'مطور النظام' : isAdmin ? 'مدير النظام' : isManager ? 'مراجع وثائق' : 'مستخدم'}
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full text-xs text-indigo-300 hover:text-white transition-colors text-right flex items-center gap-2"
                >
                    <span>→</span>
                    <span>تسجيل الخروج</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
