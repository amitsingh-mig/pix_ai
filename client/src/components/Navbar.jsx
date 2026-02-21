import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Upload, Camera, User, LayoutDashboard, ShieldCheck, UserPlus, Sparkles } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <nav className="sticky top-0 z-50 bg-card border-b border-borderColor shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary shadow-sm transition-transform group-hover:scale-105">
                            <Camera className="w-5 h-5 text-textMain" />
                        </div>
                        <div>
                            <span className="font-bold text-textMain text-base tracking-tight">PIX<span className="text-accent">AI</span></span>
                            <p className="text-[9px] text-textSecondary font-medium tracking-widest uppercase -mt-0.5">Powered by MIG</p>
                        </div>
                    </Link>

                    {/* Nav */}
                    <div className="flex items-center gap-1">
                        {user ? (
                            <>
                                <Link to="/"
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-textSecondary hover:text-accent hover:bg-primary/10 transition-all">
                                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                                </Link>

                                <Link to="/upload"
                                    className="upload-button flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-textSecondary hover:text-accent hover:bg-primary/10 transition-all">
                                    <Upload className="w-4 h-4" /> Upload
                                </Link>

                                {user.role === 'admin' && (
                                    <>
                                        <Link to="/admin"
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-textSecondary hover:text-accent hover:bg-primary/10 transition-all">
                                            <ShieldCheck className="w-4 h-4" /> Admin
                                        </Link>
                                        <Link to="/admin/add-user"
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-textSecondary hover:text-accent hover:bg-primary/10 transition-all">
                                            <UserPlus className="w-4 h-4" /> Add User
                                        </Link>
                                    </>
                                )}

                                <div className="profile-menu flex items-center gap-2 ml-3 pl-3 border-l border-borderColor">
                                    <span className="flex items-center gap-1.5 text-sm text-textSecondary">
                                        <span className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center">
                                            <User className="w-3.5 h-3.5 text-textMain" />
                                        </span>
                                        <span className="text-textMain font-medium">{user.username}</span>
                                        {user.role === 'admin' && (
                                            <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded-full font-semibold">admin</span>
                                        )}
                                    </span>
                                    <div className="flex items-center gap-1.5 ml-2 border-l border-borderColor/50 pl-2">
                                        <button
                                            onClick={() => window.dispatchEvent(new CustomEvent('restartTour'))}
                                            className="p-2 rounded-lg text-textSecondary hover:text-primary hover:bg-primary/10 transition-all group"
                                            title="Start Tour"
                                        >
                                            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                        </button>
                                        <button onClick={handleLogout}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-textSecondary hover:text-danger hover:bg-red-50 transition-all">
                                            <LogOut className="w-4 h-4" /> Logout
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Not logged in — only show Sign In, no Register link */
                            <Link to="/login"
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-textMain bg-primary hover:bg-secondary transition-all shadow-sm">
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
