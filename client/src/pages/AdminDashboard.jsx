import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Users, Image as ImageIcon, Video, Layers, Trash2, ShieldCheck, UserPlus } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color = 'text-textMain' }) => (
    <div className="stat-card">
        <div className="stat-card__icon">
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
            <p className="stat-card__label">{label}</p>
            <p className="stat-card__value">{value ?? '—'}</p>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        api.get('/admin/stats')
            .then(r => setStats(r.data.data))
            .catch(console.error)
            .finally(() => setLoadingStats(false));

        api.get('/admin/users')
            .then(r => setUsers(r.data.data))
            .catch(console.error)
            .finally(() => setLoadingUsers(false));
    }, []);

    const handleDeleteUser = async (id, username) => {
        if (!window.confirm(`Delete user "${username}" and all their media?`)) return;
        setDeletingId(id);
        try {
            await api.delete(`/admin/users/${id}`);
            setUsers(prev => prev.filter(u => u._id !== id));
            setStats(prev => prev ? { ...prev, totalUsers: prev.totalUsers - 1 } : prev);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete user');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-textMain" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-textMain">Admin Dashboard</h1>
                        <p className="text-sm text-textSecondary">Platform overview and user management</p>
                    </div>
                </div>
                <Link to="/admin/add-user"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-textMain bg-primary hover:bg-secondary transition-all shadow-sm">
                    <UserPlus className="w-4 h-4" /> Add User
                </Link>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                {loadingStats ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="stat-card animate-pulse">
                            <div className="stat-card__icon bg-borderColor" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-borderColor rounded w-2/3" />
                                <div className="h-6 bg-borderColor rounded w-1/2" />
                            </div>
                        </div>
                    ))
                ) : (
                    <>
                        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="text-accent" />
                        <StatCard icon={Layers} label="Total Media" value={stats?.totalMedia} color="text-secondary" />
                        <StatCard icon={ImageIcon} label="Images" value={stats?.totalImages} color="text-primary" />
                        <StatCard icon={Video} label="Videos" value={stats?.totalVideos} color="text-textMain" />
                    </>
                )}
            </div>

            {/* Users table */}
            <div className="bg-card rounded-2xl border border-borderColor shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-borderColor flex items-center justify-between">
                    <h2 className="text-base font-semibold text-textMain">All Users</h2>
                    <span className="text-sm text-textSecondary">{users.length} total</span>
                </div>

                {loadingUsers ? (
                    <div className="flex items-center justify-center h-40 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-center text-textSecondary py-12 text-sm">No users found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-bg text-xs uppercase tracking-wider text-textSecondary">
                                    <th className="text-left px-6 py-3 font-semibold">Username</th>
                                    <th className="text-left px-6 py-3 font-semibold">Email</th>
                                    <th className="text-left px-6 py-3 font-semibold">Role</th>
                                    <th className="text-left px-6 py-3 font-semibold">Joined</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-borderColor">
                                {users.map(u => (
                                    <tr key={u._id} className="hover:bg-bg/60 transition-colors">
                                        <td className="px-6 py-3.5 font-medium text-textMain">{u.username}</td>
                                        <td className="px-6 py-3.5 text-textSecondary">{u.email}</td>
                                        <td className="px-6 py-3.5">
                                            <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-semibold ${u.role === 'admin'
                                                ? 'bg-accent/10 text-accent border border-accent/20'
                                                : 'bg-primary/15 text-textMain border border-primary/20'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-textSecondary">
                                            {new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            {u.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleDeleteUser(u._id, u.username)}
                                                    disabled={deletingId === u._id}
                                                    className="btn-danger disabled:opacity-40"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    {deletingId === u._id ? 'Deleting…' : 'Delete'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
