import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Shield, Calendar, HardDrive, Edit2, Check, Loader2, Key, Lock, AlertCircle } from 'lucide-react';
import api from '../services/api';

const AdminUserModal = ({ userId, mode, onClose, onUpdate }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState({
        username: '',
        email: '',
        role: '',
        fullName: ''
    });
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (userId) {
            fetchUser();
        }
    }, [userId]);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users/${userId}`);
            setUser(res.data.data);
            setEditData({
                username: res.data.data.username,
                email: res.data.data.email,
                role: res.data.data.role,
                fullName: res.data.data.fullName || ''
            });
        } catch (err) {
            setError('Failed to load user details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setPasswordSuccess(false);
        try {
            const res = await api.put(`/admin/users/${userId}`, editData);
            if (onUpdate) onUpdate(res.data.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setChangingPassword(true);
        setError('');
        setPasswordSuccess(false);
        try {
            await api.put(`/admin/users/${userId}/password`, { password: newPassword });
            setPasswordSuccess(true);
            setNewPassword('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-borderColor"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-borderColor flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                {mode === 'edit' ? <Edit2 className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-textMain">{mode === 'edit' ? 'Edit User' : 'User Details'}</h2>
                                <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest leading-none mt-1">
                                    {loading ? 'Fetching...' : `ID: ${userId.slice(-8)}`}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
                            <X className="w-5 h-5 text-textSecondary" />
                        </button>
                    </div>

                    <div className="p-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-sm font-bold text-textSecondary uppercase tracking-widest">Initialising User Data...</p>
                            </div>
                        ) : error ? (
                            <div className="py-8 text-center">
                                <p className="text-danger font-bold">{error}</p>
                                <button onClick={fetchUser} className="mt-4 text-xs font-bold text-primary uppercase tracking-widest hover:underline">Try Again</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Error Alert */}
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-danger text-xs font-semibold">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {/* Username field */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2 px-1">Username</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary/50" />
                                            <input
                                                type="text"
                                                disabled={mode === 'detail' || saving}
                                                value={editData.username}
                                                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border border-borderColor focus:bg-white focus:border-primary outline-none transition-all text-sm font-medium disabled:opacity-60"
                                            />
                                        </div>
                                    </div>

                                    {/* Email field */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2 px-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary/50" />
                                            <input
                                                type="email"
                                                disabled={mode === 'detail' || saving}
                                                value={editData.email}
                                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border border-borderColor focus:bg-white focus:border-primary outline-none transition-all text-sm font-medium disabled:opacity-60"
                                            />
                                        </div>
                                    </div>

                                    {/* Full Name field */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2 px-1">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Not provided"
                                            disabled={mode === 'detail' || saving}
                                            value={editData.fullName}
                                            onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                                            className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-borderColor focus:bg-white focus:border-primary outline-none transition-all text-sm font-medium disabled:opacity-60"
                                        />
                                    </div>

                                    {/* Role Selection */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2 px-1">Privilege Level</label>
                                        <div className="relative">
                                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary/50" />
                                            <select
                                                disabled={mode === 'detail' || saving}
                                                value={editData.role}
                                                onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border border-borderColor focus:bg-white focus:border-primary outline-none transition-all text-sm font-medium appearance-none cursor-pointer disabled:opacity-60"
                                            >
                                                <option value="user">Regular User</option>
                                                <option value="admin">Platform Administrator</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Password Reset Section (Edit mode only) */}
                                {mode === 'edit' && (
                                    <div className="pt-6 border-t border-gray-100 mt-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Key className="w-4 h-4 text-orange-400" />
                                            <h3 className="text-xs font-black uppercase tracking-widest text-textMain">Security & Access</h3>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2 px-1">Reset User Password</label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary/30" />
                                                        <input
                                                            type="password"
                                                            placeholder="Enter new password..."
                                                            disabled={changingPassword}
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border border-borderColor focus:bg-white focus:border-orange-200 outline-none transition-all text-sm font-medium"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handlePasswordChange}
                                                        disabled={changingPassword || !newPassword}
                                                        className="px-6 rounded-2xl bg-orange-50 text-orange-600 font-bold text-xs uppercase tracking-widest border border-orange-100 hover:bg-orange-100 transition-all disabled:opacity-50"
                                                    >
                                                        {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update'}
                                                    </button>
                                                </div>
                                            </div>

                                            {passwordSuccess && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-green-600 text-[10px] font-bold uppercase tracking-wider"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    Password updated successfully
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Read-only stats for Detail mode */}
                                {mode === 'detail' && (
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2 mb-1">
                                                <Calendar className="w-3 h-3" /> Account Age
                                            </p>
                                            <p className="text-sm font-bold text-textMain">{formatDate(user.createdAt)}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2 mb-1">
                                                <HardDrive className="w-3 h-3" /> Media Count
                                            </p>
                                            <p className="text-sm font-bold text-textMain">{user.mediaCount} Items</p>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="pt-6">
                                    {mode === 'edit' ? (
                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-textMain font-bold text-sm rounded-2xl shadow-lg shadow-primary/20 hover:bg-secondary transition-all disabled:opacity-50"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                Save Changes
                                            </button>
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="px-8 py-4 bg-white border border-borderColor text-textSecondary font-bold text-sm rounded-2xl hover:bg-gray-50 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="w-full py-4 bg-gray-50 text-textSecondary font-bold text-sm rounded-2xl hover:bg-gray-100 transition-all"
                                        >
                                            Dismiss Panel
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AdminUserModal;
