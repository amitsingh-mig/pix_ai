import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, ImageIcon, Video, Trash2, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import MediaLightbox from '../components/MediaLightbox';

const TABS = [
    { label: 'All', value: '' },
    { label: 'Images', value: 'image' },
    { label: 'Videos', value: 'video' },
];

const Dashboard = () => {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selected, setSelected] = useState(null); // lightbox
    const { user } = useAuth();

    const fetchMedia = useCallback(async (q = search, type = typeFilter, p = page) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q) params.set('search', q);
            if (type) params.set('type', type);
            params.set('page', p);
            params.set('limit', 12);
            const res = await api.get(`/media?${params}`);
            setMedia(res.data.data);
            setTotalPages(res.data.pages || 1);
            setTotalCount(res.data.total || 0);
        } catch (err) {
            console.error('Failed to fetch media', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMedia(search, typeFilter, page); }, [page, typeFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchMedia(search, typeFilter, 1);
    };

    const handleTabChange = (val) => {
        setTypeFilter(val);
        setPage(1);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Delete this item?')) return;
        try {
            await api.delete(`/media/${id}`);
            setMedia(media.filter(item => item._id !== id));
            setTotalCount(c => c - 1);
        } catch (err) {
            alert('Failed to delete media');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-textMain">Media Library</h1>
                    <p className="text-sm text-textSecondary mt-0.5">{totalCount} item{totalCount !== 1 ? 's' : ''}</p>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow sm:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary pointer-events-none" />
                        <input type="text" className="form-input pl-10"
                            placeholder="Search title or tag…"
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button type="submit"
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-textMain bg-primary hover:bg-secondary transition-all shadow-sm">
                        Search
                    </button>
                </form>
            </div>

            {/* Type filter tabs */}
            <div className="flex gap-1 mb-6 p-1 bg-bg rounded-xl border border-borderColor w-fit">
                {TABS.map(tab => (
                    <button key={tab.value}
                        onClick={() => handleTabChange(tab.value)}
                        className={`filter-tab ${typeFilter === tab.value ? 'filter-tab-active' : ''}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                    <p className="text-sm text-textSecondary">Loading media…</p>
                </div>
            ) : media.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                    <Layers className="w-12 h-12 text-borderColor" />
                    <p className="text-textMain font-medium">No media found</p>
                    <p className="text-sm text-textSecondary">Try adjusting your search or filter</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {media.map((item) => (
                        <div key={item._id} className="media-card group relative"
                            onClick={() => setSelected(item)}>
                            {/* Thumbnail */}
                            <div className="h-48 overflow-hidden bg-bg relative">
                                {item.type === 'image' ? (
                                    <img src={item.url} alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <video src={item.url} className="w-full h-full object-cover" />
                                )}
                                {/* Type badge */}
                                <div className="absolute bottom-2 left-2 bg-white/90 text-textMain text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm font-medium">
                                    {item.type === 'image'
                                        ? <><ImageIcon className="w-3 h-3 text-accent" /> Image</>
                                        : <><Video className="w-3 h-3 text-accent" /> Video</>}
                                </div>
                                {/* Delete */}
                                {user && (user.role === 'admin' || user.id === item.uploadedBy?._id) && (
                                    <button onClick={(e) => handleDelete(e, item._id)}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 btn-danger transition-all duration-200 shadow-sm"
                                        title="Delete">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            {/* Body */}
                            <div className="p-4">
                                <h3 className="text-sm font-semibold text-textMain truncate mb-0.5">{item.title}</h3>
                                <p className="text-xs text-textSecondary mb-3">by {item.uploadedBy?.username}</p>
                                <div className="flex flex-wrap gap-1">
                                    {item.tags?.slice(0, 4).map((tag, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-textMain font-medium">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-borderColor bg-card text-textSecondary hover:border-primary hover:text-textMain disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="text-sm text-textSecondary">Page <strong className="text-textMain">{page}</strong> of <strong className="text-textMain">{totalPages}</strong></span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-borderColor bg-card text-textSecondary hover:border-primary hover:text-textMain disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Lightbox */}
            {selected && <MediaLightbox item={selected} onClose={() => setSelected(null)} />}
        </div>
    );
};

export default Dashboard;
