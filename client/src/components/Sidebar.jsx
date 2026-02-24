import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Upload,
    Camera,
    User,
    ShieldCheck,
    UserPlus,
    LogOut,
    Library,
    Search
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
        { to: '/?search=true', icon: <Search className="w-5 h-5" />, label: 'Search' },
        { to: '/upload', icon: <Upload className="w-5 h-5" />, label: 'Upload' },
        { to: '/?tab=albums', icon: <Library className="w-5 h-5" />, label: 'Albums' },
        { to: '/profile', icon: <User className="w-5 h-5" />, label: 'Profile' },
    ];

    const adminItems = [
        { to: '/admin', icon: <ShieldCheck className="w-5 h-5" />, label: 'Admin Panel' },
        { to: '/admin/add-user', icon: <UserPlus className="w-5 h-5" />, label: 'Add User' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-borderColor/50 shadow-sm z-[100]">
            {/* Logo Section */}
            <div className="p-8">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-primary shadow-lg shadow-primary/20 rotate-0 group-hover:rotate-12 transition-all duration-500">
                        <Camera className="w-5 h-5 text-textMain" />
                    </div>
                    <div>
                        <span className="font-black text-textMain text-xl tracking-tighter flex items-center">
                            PIX<span className="text-primary italic">AI</span>
                        </span>
                        <p className="text-[8px] text-textSecondary font-bold tracking-widest uppercase -mt-0.5">Powered by MIG</p>
                    </div>
                </Link>
            </div>

            {/* Navigation Section */}
            <nav className="flex-grow px-4 space-y-2 mt-4">
                {navItems.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isActive(item.to)
                            ? 'bg-primary text-textMain shadow-lg shadow-primary/20'
                            : 'text-textSecondary hover:bg-bg hover:text-textMain'
                            }`}
                    >
                        <span className={`${isActive(item.to) ? 'scale-110' : ''} transition-transform`}>
                            {item.icon}
                        </span>
                        {item.label}
                    </Link>
                ))}

                {user?.role === 'admin' && (
                    <div className="pt-8 space-y-2">
                        <p className="px-4 text-[9px] font-bold text-textSecondary uppercase tracking-[0.2em] mb-4 opacity-50">Admin Only</p>
                        {adminItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isActive(item.to)
                                    ? 'bg-danger text-white shadow-lg shadow-danger/20'
                                    : 'text-textSecondary hover:bg-bg hover:text-textMain'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-borderColor/30">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-textSecondary hover:bg-red-50 hover:text-danger transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
