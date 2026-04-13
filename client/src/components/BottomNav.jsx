import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Upload,
    Library,
    User,
    Search,
    Eye,
    Crown,
    LogIn
} from 'lucide-react';

const BottomNav = () => {
    const { user } = useAuth();
    const role = user?.role || 'guest';

    const navByRole = {
        admin: [
            { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Home', exact: true },
            { to: '/?search=true', icon: <Search className="w-5 h-5" />, label: 'Search' },
            { to: '/upload', icon: <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center -mt-8 shadow-xl border-4 border-white"><Upload className="w-5 h-5 text-textMain" /></div>, label: 'Upload' },
            { to: '/?tab=albums', icon: <Library className="w-5 h-5" />, label: 'Library' },
            { to: '/profile', icon: <User className="w-5 h-5" />, label: 'Me' },
        ],
        user: [
            { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Home', exact: true },
            { to: '/?search=true', icon: <Search className="w-5 h-5" />, label: 'Search' },
            { to: '/upload', icon: <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center -mt-8 shadow-xl border-4 border-white"><Upload className="w-5 h-5 text-textMain" /></div>, label: 'Upload' },
            { to: '/?tab=albums', icon: <Library className="w-5 h-5" />, label: 'Library' },
            { to: '/profile', icon: <User className="w-5 h-5" />, label: 'Me' },
        ],
        guest: [
            { to: '/gallery', icon: <Eye className="w-5 h-5" />, label: 'Gallery' },
            { to: '/login', icon: <LogIn className="w-5 h-5" />, label: 'Sign In' },
        ],
    };

    const navItems = navByRole[role] || navByRole.guest;

    return (
        <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-md bg-white/80 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-[100] px-4 py-3">
            <div className="flex justify-between items-center h-12">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to + item.label}
                        to={item.to}
                        end={item.exact}
                        className={({ isActive }) => `
                            flex flex-col items-center gap-1 transition-all duration-300 relative px-3
                            ${isActive ? 'text-primary scale-110' : 'text-textSecondary'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`transition-all duration-300 ${isActive ? 'animate-bounce' : ''}`}>
                                    {item.icon}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                                    {item.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
