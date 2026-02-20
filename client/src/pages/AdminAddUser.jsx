import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { User, Mail, Lock, ShieldCheck, UserPlus, CheckCircle } from 'lucide-react';

const AdminAddUser = () => {
    const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        setError('');
        setSuccess(null);
        try {
            const res = await api.post('/admin/create-user', form);
            setSuccess(res.data.data);
            setForm({ username: '', email: '', password: '', role: 'user' });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto px-4 py-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-textMain" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-textMain">Add New User</h1>
                    <p className="text-sm text-textSecondary">Admin-only — public registration is disabled</p>
                </div>
            </div>

            {/* Success banner */}
            {success && (
                <div className="mb-6 flex items-start gap-3 px-4 py-4 rounded-xl bg-green-50 border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-green-800">User created successfully</p>
                        <p className="text-xs text-green-700 mt-0.5">
                            <strong>{success.username}</strong> ({success.email}) &mdash; role: <strong>{success.role}</strong>
                        </p>
                    </div>
                </div>
            )}

            {/* Form card */}
            <div className="bg-card rounded-2xl border border-borderColor shadow-sm p-8">
                {error && (
                    <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-danger text-sm">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username */}
                    <div>
                        <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                            Username
                        </label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary pointer-events-none" />
                            <input name="username" type="text" required autoComplete="off"
                                value={form.username} onChange={handleChange}
                                className="form-input pl-10" placeholder="johndoe" />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary pointer-events-none" />
                            <input name="email" type="email" required autoComplete="off"
                                value={form.email} onChange={handleChange}
                                className="form-input pl-10" placeholder="jane@example.com" />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary pointer-events-none" />
                            <input name="password" type="password" required autoComplete="new-password"
                                value={form.password} onChange={handleChange}
                                className="form-input pl-10" placeholder="Min. 6 characters" />
                        </div>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                            Role
                        </label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary pointer-events-none" />
                            <select name="role" value={form.role} onChange={handleChange}
                                className="form-input pl-10 appearance-none cursor-pointer">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <p className="mt-1.5 text-xs text-textSecondary">
                            Admins can manage all users and media.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                        <Link to="/admin"
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-textSecondary border border-borderColor hover:border-primary hover:text-textMain bg-card transition-all">
                            ← Back to Dashboard
                        </Link>
                        <button type="submit" disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-textMain bg-primary hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
                            <UserPlus className="w-4 h-4" />
                            {loading ? 'Creating…' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminAddUser;
