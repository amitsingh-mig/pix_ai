import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Upload,
    Library,
    User,
    Search
} from 'lucide-react';

const BottomNav = () => {
    const navItems = [
        { to: '/', icon: <LayoutDashboard className="w-6 h-6" />, label: 'Home' },
        { to: '/?search=true', icon: <Search className="w-6 h-6" />, label: 'Search' },
        { to: '/upload', icon: <Upload className="w-6 h-6" />, label: 'Upload' },
        { to: '/?tab=albums', icon: <Library className="w-6 h-6" />, label: 'Albums' },
        { to: '/profile', icon: <User className="w-6 h-6" />, label: 'Profile' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-borderColor/50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-[100] px-6 py-2">
            <div className="flex justify-between items-center max-w-md mx-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `
                            flex flex-col items-center gap-1 transition-all duration-300 relative px-2
                            ${isActive ? 'text-primary' : 'text-textSecondary'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/10' : 'group-hover:bg-bg'}`}>
                                    {item.icon}
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'} transition-all`}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
