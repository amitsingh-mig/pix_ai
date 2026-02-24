import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle, Camera, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);

        try {
            const res = await api.post(`/auth/reset-password/${token}`, { password });
            setMessage(res.data.message || 'Password reset successfully!');
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. Link may be invalid or expired.');
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
                    <h2 className="text-2xl font-bold text-textMain mb-1">Reset Password</h2>
                    <p className="text-sm text-textSecondary">Enter your new secure password</p>
                </div>

                {error && (
                    <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-danger text-sm text-center flex items-center justify-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-5 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm text-center flex items-center justify-center gap-2 font-medium">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        {message}
                    </div>
                )}

                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary pointer-events-none" />
                                <input type="password" required
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="form-input pl-10" placeholder="••••••••" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary pointer-events-none" />
                                <input type="password" required
                                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="form-input pl-10" placeholder="••••••••" />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button type="submit" disabled={loading} className="btn btn-primary">
                                <CheckCircle className="w-4 h-4" />
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="pt-2">
                        <Link to="/login" className="btn btn-primary flex items-center justify-center gap-2 group">
                            Go to Sign In
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <p className="text-xs text-textSecondary font-medium">
                        Remember your password? <Link to="/login" className="text-primary hover:underline">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
