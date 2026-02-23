import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
    Users, Image as ImageIcon, Video, Layers, Trash2,
    ShieldCheck, UserPlus, Search, ArrowRight, Activity,
    Calendar, Mail, MoreVertical, ExternalLink, Eye, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminUserModal from '../components/AdminUserModal';

const StatCard = ({ icon: Icon, label, value, colorClass, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ y: -5 }}
        className="bg-white rounded-[24px] p-6 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-borderColor hover:border-primary/30 transition-all group"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl ${colorClass} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-textSecondary uppercase tracking-widest">
                <Activity className="w-3 h-3 text-green-500" /> Live
            </div>
        </div>
        <div>
            <p className="text-[11px] uppercase font-bold text-textSecondary tracking-[0.1em] mb-1">{label}</p>
            <h3 className="text-3xl font-extrabold text-textMain tracking-tight">
                {value ?? '—'}
            </h3>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] font-medium text-textSecondary">
            <span>Overall Statistics</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </div>
    </motion.div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [modalMode, setModalMode] = useState(null); // 'edit' or 'detail'

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, usersRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/users')
                ]);
                setStats(statsRes.data.data);
                setUsers(usersRes.data.data);
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoadingStats(false);
                setLoadingUsers(false);
            }
        };
        fetchData();
    }, []);

    const handleDeleteUser = async (id, username) => {
        if (!window.confirm(`Are you absolutely sure you want to delete user "${username}"? This action will permanently remove all their media files and account data.`)) return;
        setDeletingId(id);
        try {
            await api.delete(`/admin/users/${id}`);
            setUsers(prev => prev.filter(u => u._id !== id));
            // Trigger stats refresh
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete user');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                        <ShieldCheck className="w-7 h-7 text-textMain" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-textMain tracking-tight">Admin Dashboard</h1>
                        <p className="text-sm text-textSecondary font-medium">Manage platform users and view statistics.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/admin/add-user"
                        className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold text-textMain bg-primary hover:bg-secondary transition-all shadow-md shadow-primary/10 hover:-translate-y-0.5"
                    >
                        <UserPlus className="w-4 h-4" /> Add New User
                    </Link>
                </div>
            </motion.div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {loadingStats ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-[24px] p-6 border border-borderColor animate-pulse space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-100" />
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                                <div className="h-8 bg-gray-100 rounded w-3/4" />
                            </div>
                        </div>
                    ))
                ) : (
                    <>
                        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} colorClass="bg-blue-50 text-blue-500" delay={0.1} />
                        <StatCard icon={Layers} label="Total Media" value={stats?.totalMedia} colorClass="bg-purple-50 text-purple-500" delay={0.2} />
                        <StatCard icon={ImageIcon} label="Total Images" value={stats?.totalImages} colorClass="bg-amber-50 text-primary" delay={0.3} />
                        <StatCard icon={Video} label="Total Videos" value={stats?.totalVideos} colorClass="bg-red-50 text-danger" delay={0.4} />
                    </>
                )}
            </div>

            {/* User Management Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-[32px] border border-borderColor shadow-[0_4px_25px_rgba(0,0,0,0.02)] overflow-hidden"
            >
                <div className="px-8 py-6 border-b border-borderColor flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-textMain">User Management</h2>
                        <p className="text-xs text-textSecondary font-semibold mt-0.5 uppercase tracking-widest">{users.length} Active Accounts</p>
                    </div>
                    <div className="relative group max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 border border-borderColor rounded-2xl py-3 pl-11 pr-4 text-sm focus:bg-white focus:border-primary outline-none transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                    {loadingUsers ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                            <p className="text-sm font-bold text-textSecondary uppercase tracking-widest">Loading Users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4 text-gray-300">
                                <Search className="w-10 h-10" />
                            </div>
                            <h3 className="text-lg font-bold text-textMain">No users found</h3>
                            <p className="text-sm text-textSecondary mt-1">Try adjusting your search terms or filters.</p>
                        </div>
                    ) : (
                        <motion.table
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="w-full text-sm"
                        >
                            <thead>
                                <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-[0.15em] text-textSecondary">
                                    <th className="text-left px-8 py-5">User</th>
                                    <th className="text-left px-8 py-5">Role</th>
                                    <th className="text-left px-8 py-5">Joined Date</th>
                                    <th className="px-8 py-5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-medium">
                                <AnimatePresence mode='popLayout'>
                                    {filteredUsers.map((u, idx) => (
                                        <motion.tr
                                            key={u._id}
                                            variants={itemVariants}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="hover:bg-gray-50/50 transition-colors group cursor-default"
                                        >
                                            <td className="px-8 py-4.5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-textMain font-bold text-sm">
                                                        {u.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-textMain truncate">{u.username}</p>
                                                        <p className="text-[11px] text-textSecondary truncate flex items-center gap-1.5 mt-0.5">
                                                            <Mail className="w-3 h-3" /> {u.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4.5">
                                                <span className={`inline-flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-wider ${u.role === 'admin'
                                                    ? 'bg-red-50 text-danger border border-red-100'
                                                    : 'bg-primary/10 text-textMain border border-primary/20'
                                                    }`}>
                                                    <ShieldCheck className="w-3 h-3" /> {u.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4.5">
                                                <div className="flex items-center gap-1.5 text-textSecondary">
                                                    <Calendar className="w-3.5 h-3.5 opacity-40" />
                                                    <span className="text-xs">
                                                        {new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4.5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { setSelectedUserId(u._id); setModalMode('detail'); }}
                                                        className="p-2 text-textSecondary hover:text-primary transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4.5 h-4.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedUserId(u._id); setModalMode('edit'); }}
                                                        className="p-2 text-textSecondary hover:text-secondary transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 className="w-4.5 h-4.5" />
                                                    </button>

                                                    {u.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u._id, u.username)}
                                                            disabled={deletingId === u._id}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-danger hover:bg-red-600 transition-all disabled:opacity-40 shadow-sm shadow-danger/20"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            {deletingId === u._id ? 'Deleting...' : 'Delete User'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </motion.table>
                    )}
                </div>

                <div className="px-8 py-5 bg-gray-50/30 border-t border-borderColor flex items-center justify-between">
                    <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Admin Dashboard System v1.4</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest hover:underline cursor-pointer">
                        View Audit Log <ExternalLink className="w-3 h-3" />
                    </div>
                </div>
            </motion.div>

            {/* Admin User Modal (Edit/Detail) */}
            {selectedUserId && (
                <AdminUserModal
                    userId={selectedUserId}
                    mode={modalMode}
                    onClose={() => { setSelectedUserId(null); setModalMode(null); }}
                    onUpdate={(updatedUser) => {
                        setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
                    }}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
