import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Upload, Camera, User, LayoutDashboard, ShieldCheck, UserPlus, Sparkles } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <nav className={`sticky top-0 z-[100] border-b transition-all duration-500 ${isScrolled
            ? 'bg-white/80 backdrop-blur-2xl border-borderColor/40 shadow-xl shadow-black/5 py-1'
            : 'bg-white/40 backdrop-blur-md border-transparent py-3'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Brand Section */}
                    <Link to="/" className="flex items-center gap-3.5 group relative">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-primary shadow-lg shadow-primary/20 rotate-0 group-hover:rotate-12 transition-all duration-500">
                                <Camera className="w-5 h-5 text-textMain" />
                            </div>
                            <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <span className="font-black text-textMain text-xl tracking-tighter flex items-center">
                                PIX<span className="text-primary italic">AI</span>
                            </span>
                            <p className="text-[9px] text-textSecondary font-medium tracking-widest uppercase -mt-0.5">Powered by MIG</p>
                        </div>
                    </Link>

                    {/* Navigation Actions */}
                    <div className="flex items-center gap-2">
                        {user ? (
                            <>
                                <div className="hidden md:flex items-center gap-1 mr-4 pr-4 border-r border-borderColor/50">
                                    <NavLink id="nav-dashboard" to="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
                                    <NavLink id="nav-upload" to="/upload" icon={<Upload className="w-4 h-4" />} label="Upload" />

                                    {user.role === 'admin' && (
                                        <>
                                            <NavLink to="/admin" icon={<ShieldCheck className="w-4 h-4" />} label="Admin" />
                                            <NavLink to="/admin/add-user" icon={<UserPlus className="w-4 h-4" />} label="Add User" />
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    <Link id="profile-section" to="/profile" className="flex items-center gap-3 pl-2 group">
                                        <div className="flex flex-col items-end hidden sm:block">
                                            <span className="text-xs font-black text-textMain leading-none group-hover:text-primary transition-colors">{user.username}</span>
                                            <span className="text-[9px] font-bold text-textSecondary uppercase tracking-widest mt-1">{user.role}</span>
                                        </div>
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-200 border-2 border-white shadow-md overflow-hidden group-hover:border-primary transition-all">
                                                {user.profilePhoto ? (
                                                    <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                                        <User className="w-5 h-5 text-textMain" />
                                                    </div>
                                                )}
                                            </div>
                                            {user.role === 'admin' && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full border-2 border-white flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    <div className="flex items-center gap-2 ml-2">
                                        <button
                                            onClick={() => window.dispatchEvent(new CustomEvent('restartTour'))}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl text-textSecondary hover:text-primary hover:bg-primary/10 transition-all group"
                                            title="Start Tour"
                                        >
                                            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl text-textSecondary hover:text-danger hover:bg-red-50 transition-all group"
                                            title="Logout"
                                        >
                                            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <Link to="/login"
                                className="px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-textMain bg-primary hover:bg-secondary transition-all shadow-lg shadow-primary/20">
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
