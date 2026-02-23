import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    User, Mail, Lock, ShieldCheck, Camera,
    Calendar, Activity, Layers, Image as ImageIcon,
    Video, Save, UserPen, LogOut, CheckCircle,
    AlertCircle, Loader2, Sparkles, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
    const { user, setUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        username: user?.username || ''
    });
    const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' });
    const [loading, setLoading] = useState(false);
    const [passLoading, setPassLoading] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/api/users/stats');
                setStats(res.data.data);
            } catch (err) {
                console.error('Stats fetch error:', err);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
        setSuccess('');
    };

    const handlePassChange = (e) => {
        setPassForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
        setSuccess('');
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/api/users/profile', form);
            setUser(res.data.data);
            setEditMode(false);
            setSuccess('Profile updated successfully');
        } catch (err) {
            setError(err.response?.data?.error || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passForm.newPassword.length < 6) return setError('New password too short');
        setPassLoading(true);
        try {
            await api.put('/api/users/password', passForm);
            setPassForm({ currentPassword: '', newPassword: '' });
            setSuccess('Password updated successfully');
        } catch (err) {
            setError(err.response?.data?.error || 'Password update failed');
        } finally {
            setPassLoading(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        setPhotoLoading(true);
        try {
            const res = await api.put('/api/users/photo', formData);
            setUser({ ...user, profilePhoto: res.data.data.profilePhoto });
            setSuccess('Photo updated');
        } catch (err) {
            setError('Photo upload failed');
        } finally {
            setPhotoLoading(false);
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
            {/* Page Title */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 border-b border-borderColor pb-8"
            >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-textMain" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-textMain tracking-tight">User Profile</h1>
                    <p className="text-sm text-textSecondary font-medium">Manage your personal profile and security settings.</p>
                </div>
            </motion.div>

            <AnimatePresence>
                {(error || success) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest ${error ? 'bg-red-50 text-danger border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                            }`}
                    >
                        {error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        {error || success}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Brief & Stats */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Identity Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[32px] border border-borderColor shadow-sm overflow-hidden p-8 text-center relative"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Sparkles className="w-20 h-20" />
                        </div>

                        <div className="relative inline-block group mb-6">
                            <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-gray-50 to-gray-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                                {user?.profilePhoto ? (
                                    <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-black text-textSecondary">{user?.username?.[0]?.toUpperCase()}</span>
                                )}
                                {photoLoading && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-primary hover:bg-secondary text-textMain shadow-lg border-4 border-white flex items-center justify-center transition-all group-hover:scale-110"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                            <input
                                type="file" ref={fileInputRef} hidden accept="image/*"
                                onChange={handlePhotoUpload}
                            />
                        </div>

                        <div>
                            <h2 className="text-2xl font-black text-textMain leading-tight">{user?.fullName || user?.username}</h2>
                            <p className="text-sm text-textSecondary font-bold mt-1">@{user?.username}</p>
                            <div className="mt-4 inline-flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-wider bg-primary/10 text-textMain border border-primary/20">
                                <ShieldCheck className="w-3 h-3" /> {user?.role} Access
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-center gap-6">
                            <div className="flex flex-col items-center">
                                <Calendar className="w-4 h-4 text-gray-300 mb-1" />
                                <span className="text-[10px] text-textSecondary uppercase font-black tracking-widest leading-none">Joined</span>
                                <span className="text-xs font-bold text-textMain mt-1">
                                    {new Date(user?.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-[32px] border border-borderColor shadow-sm p-8"
                    >
                        <h3 className="text-sm font-black text-textSecondary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" /> Media Statistics
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                        <Layers className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-textMain uppercase tracking-wide">Total Items</span>
                                </div>
                                <span className="text-lg font-black text-textMain">{loadingStats ? '...' : stats?.totalMedia}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                        <ImageIcon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-textMain uppercase tracking-wide">Images</span>
                                </div>
                                <span className="text-lg font-black text-textMain">{loadingStats ? '...' : stats?.imageCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-red-50 text-danger flex items-center justify-center">
                                        <Video className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-textMain uppercase tracking-wide">Videos</span>
                                </div>
                                <span className="text-lg font-black text-textMain">{loadingStats ? '...' : stats?.videoCount}</span>
                            </div>
                            <div className="pt-4 mt-4 border-t border-gray-50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-textSecondary uppercase tracking-widest">Storage Used</span>
                                    <span className="text-[10px] font-black text-textMain uppercase tracking-widest">{formatSize(stats?.storageUsed)}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: loadingStats ? '0%' : '35%' }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Settings & Security */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-[32px] border border-borderColor shadow-sm p-10"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-textMain">Profile Information</h3>
                            <button
                                onClick={() => setEditMode(!editMode)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-textSecondary hover:text-primary transition-colors"
                            >
                                {editMode ? 'Dismiss' : <><UserPen className="w-3.5 h-3.5" /> Edit</>}
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] ml-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary group-focus-within:text-primary" />
                                        <input
                                            name="fullName" value={form.fullName} onChange={handleChange}
                                            disabled={!editMode}
                                            className="w-full bg-gray-50 border border-borderColor rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:bg-white focus:border-primary transition-all disabled:opacity-60"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] ml-1">Username</label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary group-focus-within:text-primary" />
                                        <input
                                            name="username" value={form.username} onChange={handleChange}
                                            disabled={!editMode}
                                            className="w-full bg-gray-50 border border-borderColor rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:bg-white focus:border-primary transition-all disabled:opacity-60"
                                            placeholder="johndoe"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary group-focus-within:text-primary" />
                                    <input
                                        name="email" value={form.email} onChange={handleChange}
                                        disabled={!editMode}
                                        className="w-full bg-gray-50 border border-borderColor rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:bg-white focus:border-primary transition-all disabled:opacity-60"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            {editMode && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="pt-4"
                                >
                                    <button
                                        type="submit" disabled={loading}
                                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-[11px] font-black text-textMain bg-primary hover:bg-secondary transition-all shadow-lg shadow-primary/10"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </motion.div>
                            )}
                        </form>
                    </motion.div>

                    {/* Security & Access */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-[32px] border border-borderColor shadow-sm p-10"
                    >
                        <h3 className="text-xl font-black text-textMain mb-8 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-danger" /> Security Settings
                        </h3>

                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] ml-1">Current Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary group-focus-within:text-primary" />
                                        <input
                                            name="currentPassword" type="password" value={passForm.currentPassword} onChange={handlePassChange}
                                            required
                                            className="w-full bg-gray-50 border border-borderColor rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:bg-white focus:border-primary transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] ml-1">New Password</label>
                                    <div className="relative group">
                                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary group-focus-within:text-primary" />
                                        <input
                                            name="newPassword" type="password" value={passForm.newPassword} onChange={handlePassChange}
                                            required
                                            className="w-full bg-gray-50 border border-borderColor rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:bg-white focus:border-primary transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit" disabled={passLoading}
                                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-[11px] font-black text-white bg-textMain hover:bg-black transition-all shadow-xl shadow-black/10"
                                >
                                    {passLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    {/* Account Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gray-50/50 rounded-[32px] border border-borderColor p-8 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-borderColor flex items-center justify-center text-danger">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-textMain uppercase tracking-wider">Logout Session</h4>
                                <p className="text-xs text-textSecondary font-medium">Log out from your current account.</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
