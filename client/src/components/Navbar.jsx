import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Upload, Camera, User, Search, Crown, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const ROLE_BADGE = {
    admin: { label: 'Admin', class: 'bg-red-100 text-red-600 border-red-200', icon: Crown },
    user:  { label: 'User',  class: 'bg-primary/15 text-amber-700 border-primary/30', icon: User },
};

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = React.useState(searchParams.get('q') || '');

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Debounce search update to URL
    React.useEffect(() => {
        const timer = setTimeout(() => {
            const currentQ = searchParams.get('q') || '';
            if (searchQuery !== currentQ) {
                if (searchQuery) {
                    setSearchParams({ q: searchQuery });
                } else {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('q');
                    setSearchParams(newParams);
                }
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, setSearchParams, searchParams]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        if (window.location.pathname !== '/') {
            navigate(`/?q=${e.target.value}`);
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const role = user?.role;
    const badge = role ? ROLE_BADGE[role] : null;
    const BadgeIcon = badge?.icon;

    return (
        <nav className={`md:hidden sticky top-0 z-[100] border-b transition-all duration-300 ${isScrolled
            ? 'bg-white/90 backdrop-blur-xl border-borderColor/20 shadow-lg py-2'
            : 'bg-white border-transparent py-4'
            }`}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between items-center h-14">
                    {/* Brand Section */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary shadow-lg shadow-primary/20 transition-transform active:scale-95">
                            <Camera className="w-4 h-4 text-textMain" />
                        </div>
                        <span className="font-black text-textMain text-lg tracking-tighter">
                            PIX<span className="text-primary italic">AI</span>
                        </span>
                    </Link>

                    {/* Role badge (center) */}
                    {badge && (
                        <div className={`hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${badge.class}`}>
                            {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                            {badge.label}
                        </div>
                    )}

                    {/* Quick Actions (Mobile Right) */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <Link to="/?search=true" className="p-2 text-textSecondary active:text-primary transition-colors">
                                    <Search className="w-5 h-5" />
                                </Link>
                                {/* Only show upload for non-guest */}
                                {user.role !== 'guest' && (
                                    <Link to="/upload" className="p-2 text-textSecondary active:text-primary transition-colors">
                                        <Upload className="w-5 h-5" />
                                    </Link>
                                )}
                                <Link to="/profile" className="p-2 ml-1">
                                    <div className="w-8 h-8 rounded-full border-2 border-primary/20 overflow-hidden active:border-primary transition-all">
                                        {user.profilePhoto ? (
                                            <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                                <User className="w-4 h-4 text-textMain" />
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </>
                        ) : (
                            <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-primary">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
