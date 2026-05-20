import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { Menu } from 'lucide-react';

const Navbar = ({ title }) => {
    const { user } = useAuth();
    const { toggle } = useSidebar();

    return (
        <header className="bg-white border-b border-slate-100 px-4 lg:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {/* Hamburger — يظهر فقط على موبايل */}
                <button
                    onClick={toggle}
                    className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                    aria-label="فتح القائمة"
                >
                    <Menu size={18} />
                </button>
                <h2 className="text-base font-bold text-slate-800">{title}</h2>
            </div>
            <div className="text-sm text-slate-400">
                مرحباً، <span className="font-semibold text-slate-700">{user?.full_name}</span>
            </div>
        </header>
    );
};

export default Navbar;
