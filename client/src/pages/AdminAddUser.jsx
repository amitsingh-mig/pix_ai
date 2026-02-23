import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
    User, Mail, Lock, ShieldCheck, UserPlus,
    CheckCircle, ArrowLeft, Loader2, Sparkles,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        if (form.password.length < 6) {
            setError('Account security requires at least 6 characters.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess(null);
        try {
            const res = await api.post('/admin/create-user', form);
            setSuccess(res.data.data);
            setForm({ username: '', email: '', password: '', role: 'user' });
        } catch (err) {
            setError(err.response?.data?.error || 'Authorization or connection error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto px-4 py-12"
        >
            {/* Header & Back Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner">
                        <UserPlus className="w-7 h-7 text-textMain" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-textMain tracking-tight">Recruit User</h1>
                        <p className="text-sm text-textSecondary font-medium">Provisioning access to the secure infrastructure.</p>
                    </div>
                </div>
                <Link to="/admin"
                    className="group flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-textSecondary hover:text-textMain border border-borderColor hover:border-primary transition-all bg-white"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Dashboard
                </Link>
            </div>

            {/* Success Banner */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mb-8 p-6 rounded-[24px] bg-green-50 border border-green-100 flex items-start gap-4 shadow-sm"
                    >
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-green-900 uppercase tracking-widest leading-none mb-1">Success</h3>
                            <p className="text-sm font-medium text-green-800">
                                <strong>{success.username}</strong> has been successfully registered.
                            </p>
                            <p className="text-[11px] text-green-700/80 mt-1">
                                An invitation has been sent to {success.email}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Form Infrastructure */}
            <motion.div
                className="bg-white rounded-[32px] border border-borderColor shadow-[0_10px_40px_rgba(0,0,0,0.03)] p-10 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-8 text-primary/10 pointer-events-none">
                    <Sparkles className="w-24 h-24" />
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-danger text-xs font-bold uppercase tracking-widest flex items-center gap-3"
                        >
                            <Info className="w-4 h-4" /> {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] ml-1">
                                Identity Handle
                            </label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary group-focus-within:text-primary transition-colors" />
                                <input
                                    name="username" type="text" required autoComplete="off"
                                    value={form.username} onChange={handleChange}
                                    className="w-full bg-gray-50 border border-borderColor rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:bg-white focus:border-primary outline-none transition-all font-medium"
                                    placeholder="johndoe_ex"
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] ml-1">
                                Authority Level
                            </label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary group-focus-within:text-primary transition-colors" />
                                <select
                                    name="role" value={form.role} onChange={handleChange}
                                    className="w-full bg-gray-50 border border-borderColor rounded-2xl py-3.5 pl-12 pr-10 text-sm focus:bg-white focus:border-primary outline-none transition-all font-bold appearance-none cursor-pointer"
                                >
                                    <option value="user">Standard Agent</option>
                                    <option value="admin">Platform Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] ml-1">
                            Communication Channel
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary group-focus-within:text-primary transition-colors" />
                            <input
                                name="email" type="email" required autoComplete="off"
                                value={form.email} onChange={handleChange}
                                className="w-full bg-gray-50 border border-borderColor rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:bg-white focus:border-primary outline-none transition-all font-medium"
                                placeholder="jane.smith@corporation.com"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] ml-1">
                            Access Cipher
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary group-focus-within:text-primary transition-colors" />
                            <input
                                name="password" type="password" required autoComplete="new-password"
                                value={form.password} onChange={handleChange}
                                className="w-full bg-gray-50 border border-borderColor rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:bg-white focus:border-primary outline-none transition-all font-medium"
                                placeholder="••••••••••••"
                            />
                        </div>
                        <p className="text-[10px] text-textSecondary/60 font-medium ml-1 flex items-center gap-1.5">
                            <Info className="w-3 h-3 text-primary" /> Minimum 6 characters for enhanced encryption.
                        </p>
                    </div>

                    {/* Submission */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-sm font-black text-textMain bg-primary hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary/10 overflow-hidden"
                        >
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Loader2 className="w-5 h-5 animate-spin" /> Provisioning...
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="ready"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" /> Confirm Registration
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default AdminAddUser;
