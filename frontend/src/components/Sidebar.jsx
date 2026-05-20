import React, { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import {
    LayoutDashboard, ScrollText, Briefcase, FolderOpen,
    Users, ShieldCheck, Settings, BarChart3, UserCog,
    ClipboardList, FlaskConical, Search, LogOut, Wrench, X
} from 'lucide-react';

const userLinks = [
    { to: '/dashboard',     label: 'الرئيسية',      Icon: LayoutDashboard },
    { to: '/will',          label: 'وصيّتي',         Icon: ScrollText },
    { to: '/assets',        label: 'الأصول',         Icon: Briefcase },
    { to: '/documents',     label: 'الوثائق',        Icon: FolderOpen },
    { to: '/beneficiaries', label: 'الورثة',         Icon: Users },
    { to: '/verification',  label: 'تجديد الوجود',   Icon: ShieldCheck },
];

const adminLinks = [
    { to: '/admin',            label: 'لوحة التحكم',    Icon: BarChart3,     end: true  },
    { to: '/admin?tab=users',  label: 'المستخدمون',     Icon: UserCog,       end: false },
    { to: '/admin?tab=wills',  label: 'الوصايا',        Icon: ScrollText,    end: false },
    { to: '/admin?tab=logs',   label: 'السجلات',        Icon: ClipboardList, end: false },
    { to: '/admin?tab=test',   label: 'أدوات التيست',   Icon: FlaskConical,  end: false },
];

const developerLinks = [
    { to: '/developer', label: 'لوحة المطور', Icon: Wrench, end: true },
];

const managerLinks = [
    { to: '/manager', label: 'مراجعة الوثائق', Icon: Search, end: true },
];

const accountLinks = [
    { to: '/settings/2fa', label: 'المصادقة الثنائية', Icon: Settings },
];

const roleConfig = {
    developer: { label: 'مطور النظام', color: 'bg-violet-500' },
    admin:     { label: 'مدير النظام', color: 'bg-amber-500' },
    manager:   { label: 'مراجع وثائق', color: 'bg-teal-500' },
    user:      { label: 'مستخدم',      color: 'bg-slate-500' },
};

const NavItem = ({ to, label, Icon, end, onNavigate }) => (
    <NavLink
        to={to}
        end={end}
        onClick={onNavigate}
        className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`
        }
    >
        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 shrink-0">
            <Icon size={16} />
        </span>
        <span>{label}</span>
    </NavLink>
);

const SectionLabel = ({ children }) => (
    <p className="text-slate-500 text-[10px] px-3 pt-4 pb-1.5 uppercase tracking-widest font-semibold">{children}</p>
);

const SidebarContent = ({ onNavigate }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const role = user?.role || 'user';
    const isAdmin     = role === 'admin';
    const isDeveloper = role === 'developer';
    const isManager   = role === 'manager';
    const cfg = roleConfig[role] || roleConfig.user;

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const links = isDeveloper ? developerLinks
                : isManager   ? managerLinks
                : isAdmin     ? adminLinks
                : userLinks;

    const sectionLabel = isDeveloper ? 'الإدارة'
                       : isManager   ? 'المراجعة'
                       : isAdmin     ? 'الإدارة'
                       : 'القائمة';

    return (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className="px-5 py-5 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                        <ScrollText size={18} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-wide leading-none">وصيّة</h1>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                            {isAdmin || isDeveloper ? 'لوحة الإدارة'
                            : isManager             ? 'مراجعة الوثائق'
                            : 'Digital Will System'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
                <SectionLabel>{sectionLabel}</SectionLabel>
                {links.map(l => <NavItem key={l.to} {...l} onNavigate={onNavigate} />)}
                <SectionLabel>الحساب</SectionLabel>
                {accountLinks.map(l => <NavItem key={l.to} {...l} onNavigate={onNavigate} />)}
            </nav>

            {/* User info + logout */}
            <div className="p-4 border-t border-slate-800 shrink-0">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-600/30 flex items-center justify-center shrink-0 text-indigo-300 font-bold text-sm">
                        {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate leading-none">{user?.full_name}</p>
                        <p className="text-slate-400 text-[11px] truncate mt-0.5">{user?.email}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold text-white ${cfg.color}`}>
                        {cfg.label}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors text-xs"
                    >
                        <LogOut size={13} />
                        <span>خروج</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const Sidebar = () => {
    const { isOpen, close } = useSidebar();
    const location = useLocation();

    // أغلق الـ drawer لما تتنقل على موبايل
    useEffect(() => {
        close();
    }, [location.pathname, location.search]);

    return (
        <>
            {/* ── Desktop: sidebar ثابتة ── */}
            <aside className="hidden lg:flex w-64 min-h-screen bg-slate-900 text-white flex-col shrink-0 border-l border-slate-800">
                <SidebarContent />
            </aside>

            {/* ── Mobile: overlay + drawer ── */}
            {/* Overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={close}
            />

            {/* Drawer — يجي من اليمين (RTL) */}
            <aside
                className={`fixed top-0 right-0 z-50 h-full w-72 bg-slate-900 text-white flex flex-col shadow-2xl
                    transition-transform duration-300 ease-in-out lg:hidden
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* زرار الإغلاق */}
                <button
                    onClick={close}
                    className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
                >
                    <X size={16} />
                </button>

                <SidebarContent onNavigate={close} />
            </aside>
        </>
    );
};

export default Sidebar;
