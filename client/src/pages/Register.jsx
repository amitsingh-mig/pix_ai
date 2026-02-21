import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, UserPlus, Camera } from 'lucide-react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(username, email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
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
                    <h2 className="text-2xl font-bold text-textMain mb-1">Create account</h2>
                    <p className="text-sm text-textSecondary">Start managing your media with AI</p>
                </div>

                {error && (
                    <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-danger text-sm text-center">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">Username</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary pointer-events-none" />
                            <input id="username" type="text" autoComplete="username" required
                                value={username} onChange={(e) => setUsername(e.target.value)}
                                className="form-input pl-10" placeholder="johndoe" />
                        </div>
                    </div>
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
                            <input id="password" type="password" autoComplete="new-password" required
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                className="form-input pl-10" placeholder="••••••••" />
                        </div>
                    </div>
                    <div className="pt-2">
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            <UserPlus className="w-4 h-4" />
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </div>
                </form>

                <p className="mt-6 text-center text-sm text-textSecondary">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accent font-semibold hover:text-danger transition-colors">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
