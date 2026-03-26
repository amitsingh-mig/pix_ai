import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Camera } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Brand */}
                <div className="brand-logo">
                    <div className="brand-icon">
                        <Camera className="w-6 h-6 text-textMain" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-textMain leading-tight">PIX<span className="text-accent">AI</span></h1>
                        <p className="text-xs text-textSecondary font-medium tracking-widest uppercase">Powered by MIG</p>
                    </div>
                </div>

                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-textMain mb-1">Welcome back</h2>
                    <p className="text-sm text-textSecondary">Sign in to your media library</p>
                </div>

                {error && (
                    <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-danger text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary pointer-events-none" />
                            <input id="email" type="email" autoComplete="email" required
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                className="form-input pl-10" placeholder="you@example.com" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary pointer-events-none" />
                            <input id="password" type="password" autoComplete="current-password" required
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                className="form-input pl-10" placeholder="••••••••" />
                        </div>
                        <div className="flex justify-end mt-1.5">
                            <Link to="/forgot-password" size="sm" className="text-[11px] font-bold text-textSecondary hover:text-primary transition-colors uppercase tracking-widest">
                                Forgot password?
                            </Link>
                        </div>
                    </div>
                    <div className="pt-2">
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            <LogIn className="w-4 h-4" />
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>

                <p className="mt-6 text-center text-sm text-textSecondary">
                    Contact an administrator to create an account.
                </p>

                <div className="mt-4 pt-4 border-t border-borderColor text-center">
                    <Link
                        to="/gallery"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-textSecondary hover:text-primary transition-colors uppercase tracking-widest"
                    >
                        Browse as Guest →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
