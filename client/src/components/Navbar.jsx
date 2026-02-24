import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Upload, Camera, User, LayoutDashboard, ShieldCheck, UserPlus, Sparkles, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

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

                    {/* Quick Actions (Mobile Right) */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link to="/?search=true" className="p-2 text-textSecondary active:text-primary transition-colors">
                                    <Search className="w-5 h-5" />
                                </Link>
                                <Link to="/upload" className="p-2 text-textSecondary active:text-primary transition-colors">
                                    <Upload className="w-5 h-5" />
                                </Link>
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

const NavLink = ({ to, icon, label, id }) => (
    <Link id={id} to={to} className="relative group px-4 py-2 flex items-center gap-2 transition-colors">
        <span className="text-textSecondary group-hover:text-primary transition-colors">{icon}</span>
        <span className="text-[11px] font-black uppercase tracking-widest text-textSecondary group-hover:text-textMain transition-colors">{label}</span>
        <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
    </Link>
);

export default Navbar;
