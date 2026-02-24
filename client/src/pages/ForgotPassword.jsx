import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Camera, Send } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setMessage(res.data.message || 'Reset link sent to your email.');
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to send reset email.');
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
                    <h2 className="text-2xl font-bold text-textMain mb-1">Forgot Password?</h2>
                    <p className="text-sm text-textSecondary">Enter your email to receive a reset link</p>
                </div>

                {error && (
                    <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-danger text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-5 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm text-center font-medium">
                        {message}
                    </div>
                )}

                {!message ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary pointer-events-none" />
                                <input id="email" type="email" required
                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="form-input pl-10" placeholder="you@example.com" />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button type="submit" disabled={loading} className="btn btn-primary">
                                <Send className="w-4 h-4" />
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="pt-2">
                        <Link to="/login" className="btn btn-primary bg-bg text-textMain border border-borderColor hover:bg-gray-50">
                            <ArrowLeft className="w-4 h-4" />
                            Return to Login
                        </Link>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-textSecondary hover:text-primary transition-colors font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
