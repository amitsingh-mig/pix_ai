import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
    Search,
    Eye,
    Crown,
    Users,
    BarChart3
} from 'lucide-react';

// Role color and badge config
const ROLE_CONFIG = {
    admin: {
        label: 'Admin',
        icon: Crown,
        colors: 'bg-red-500 text-white',
        glow: 'shadow-red-500/20',
        badgeClass: 'bg-red-50 text-red-600 border-red-200',
        activeClass: 'bg-danger text-white shadow-lg shadow-danger/20',
        sectionLabel: 'Admin Controls',
    },
    user: {
        label: 'User',
        icon: User,
        colors: 'bg-[#FFD41D] text-black',
        glow: 'shadow-[#FFD41D]/20',
        badgeClass: 'bg-[#FFD41D]/10 text-amber-700 border-[#FFD41D]/30',
        activeClass: 'bg-primary text-textMain shadow-lg shadow-primary/20',
        sectionLabel: 'My Workspace',
    },
    guest: {
        label: 'Guest',
        icon: Eye,
        colors: 'bg-gray-400 text-white',
        glow: 'shadow-gray-400/20',
        badgeClass: 'bg-gray-50 text-gray-600 border-gray-200',
        activeClass: 'bg-gray-200 text-gray-800',
        sectionLabel: 'Browse',
    },
};

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const role = user?.role || 'guest';
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.guest;
    const RoleIcon = config.icon;

    // ── Navigation items per role ──────────────────────────────────────────────
    const navByRole = {
        admin: [
            { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
            { to: '/?search=true', icon: <Search className="w-5 h-5" />, label: 'Search' },
            { to: '/upload', icon: <Upload className="w-5 h-5" />, label: 'Upload' },
            { to: '/?tab=albums', icon: <Library className="w-5 h-5" />, label: 'Albums' },
            { to: '/profile', icon: <User className="w-5 h-5" />, label: 'Profile' },
        ],
        user: [
            { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'My Media' },
            { to: '/?search=true', icon: <Search className="w-5 h-5" />, label: 'Search' },
            { to: '/upload', icon: <Upload className="w-5 h-5" />, label: 'Upload' },
            { to: '/?tab=albums', icon: <Library className="w-5 h-5" />, label: 'Albums' },
            { to: '/profile', icon: <User className="w-5 h-5" />, label: 'Profile' },
        ],
        guest: [
            { to: '/gallery', icon: <Eye className="w-5 h-5" />, label: 'Gallery' },
        ],
    };

    const adminItems = [
        { to: '/admin', icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics' },
        { to: '/admin', icon: <Users className="w-5 h-5" />, label: 'Manage Users' },
        { to: '/admin/add-user', icon: <UserPlus className="w-5 h-5" />, label: 'Add User' },
    ];

    const navItems = navByRole[role] || navByRole.guest;

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path.split('?')[0]) && path !== '/';
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-borderColor/50 shadow-sm z-[100]">
            {/* ─── Logo + Role badge ─────────────────────────────────────────── */}
            <div className="p-8 pb-4">
                <Link to="/" className="flex items-center gap-3 group mb-5">
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

                {/* Role badge */}
                <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border ${config.badgeClass} transition-all`}>
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${config.colors} shadow-md ${config.glow}`}>
                        <RoleIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Signed in as</p>
                        <p className="text-[11px] font-black truncate">{user?.username || 'Guest'}</p>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${config.badgeClass}`}>
                        {config.label}
                    </span>
                </div>
            </div>

            {/* ─── Main Navigation ──────────────────────────────────────────── */}
            <nav className="flex-grow px-4 space-y-1 overflow-y-auto mt-2">

                {/* Role label */}
                <p className="px-4 text-[9px] font-bold text-textSecondary uppercase tracking-[0.2em] mb-3 opacity-50">
                    {config.sectionLabel}
                </p>

                {navItems.map((item) => {
                    const active = isActive(item.to);
                    return (
                        <Link
                            key={item.to + item.label}
                            to={item.to}
                            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                active
                                    ? config.activeClass
                                    : 'text-textSecondary hover:bg-bg hover:text-textMain'
                            }`}
                        >
                            <span className={`${active ? 'scale-110' : ''} transition-transform`}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    );
                })}

                {/* ─── Admin-only section ────────────────────────────────── */}
                {role === 'admin' && (
                    <div className="pt-6 space-y-1">
                        <p className="px-4 text-[9px] font-bold text-textSecondary uppercase tracking-[0.2em] mb-3 opacity-50 flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3 text-red-400" /> Admin Only
                        </p>
                        {adminItems.map((item) => {
                            const active = location.pathname === item.to;
                            return (
                                <Link
                                    key={item.to + item.label}
                                    to={item.to}
                                    className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                        active
                                            ? 'bg-danger text-white shadow-lg shadow-danger/20'
                                            : 'text-textSecondary hover:bg-red-50 hover:text-danger'
                                    }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* ─── Guest CTA ─────────────────────────────────────────── */}
                {role === 'guest' && (
                    <div className="pt-6">
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                            <p className="text-[10px] font-black text-textMain mb-1">Full Access</p>
                            <p className="text-[9px] text-textSecondary mb-3 leading-relaxed">Sign in to upload, tag & manage photos with AI.</p>
                            <Link
                                to="/login"
                                className="block w-full text-center py-2 rounded-xl bg-primary text-textMain text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* ─── Bottom: Logout / Login ───────────────────────────────────── */}
            <div className="p-4 border-t border-borderColor/30">
                {user ? (
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-textSecondary hover:bg-red-50 hover:text-danger transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                ) : (
                    <Link
                        to="/login"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-primary text-textMain hover:bg-secondary transition-all shadow-lg shadow-primary/20"
                    >
                        Sign In
                    </Link>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
