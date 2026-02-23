import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Search, Layers, ChevronLeft, ChevronRight, Folder, ArrowLeft, Plus } from 'lucide-react';
import MediaCard from '../components/MediaCard';
import AlbumCard from '../components/AlbumCard';
import ImageDetailsModal from '../components/ImageDetailsModal';
import OnboardingTour from "../components/OnboardingTour";
import FakeCursor from "../components/FakeCursor";
import AIAssistant from "../components/AIAssistant";
import { useAlbums } from '../context/AlbumContext';

const TABS = [
    { label: 'All', value: '' },
    { label: 'Images', value: 'image' },
    { label: 'Videos', value: 'video' },
    { label: 'Albums', value: 'albums' },
];

const Dashboard = () => {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [currentAlbum, setCurrentAlbum] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const { user } = useAuth();
    const { albums, refreshAlbums, addAlbum, updateAlbumState, removeAlbumState, loading: albumsLoading } = useAlbums();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 600);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchMedia = useCallback(async (q = debouncedSearch, type = typeFilter, p = page, albumId = currentAlbum?._id) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q) params.set('search', q);
            if (type && type !== 'albums') params.set('type', type);
            if (albumId) params.set('albumId', albumId);
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
    }, [debouncedSearch, typeFilter, page, currentAlbum]);

    useEffect(() => {
        fetchMedia(debouncedSearch, typeFilter, page, currentAlbum?._id);
    }, [page, typeFilter, currentAlbum, debouncedSearch, fetchMedia]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        if (typeFilter !== 'albums' || currentAlbum) {
            fetchMedia(search, typeFilter, 1);
        }
    };

    const handleTabChange = (val) => {
        setTypeFilter(val);
        setCurrentAlbum(null);
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

    const handleRenameAlbum = async (album) => {
        const newName = window.prompt('Enter new album name:', album.name);
        if (!newName || newName === album.name) return;
        try {
            const res = await api.put(`/albums/${album._id}`, { name: newName });
            updateAlbumState(res.data.data);
        } catch (err) {
            alert('Failed to rename album');
        }
    };

    const handleDeleteAlbum = async (album) => {
        if (!window.confirm(`Delete album "${album.name}"? Media items will NOT be deleted.`)) return;
        try {
            await api.delete(`/albums/${album._id}`);
            removeAlbumState(album._id);
        } catch (err) {
            alert('Failed to delete album');
        }
    };

    const handleCreateAlbum = async () => {
        const name = window.prompt('Enter album name:');
        if (!name) return;
        try {
            const res = await api.post('/albums', { name });
            addAlbum(res.data.data);
        } catch (err) {
            alert('Failed to create album');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header / Command Center */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 border-b border-borderColor/30 pb-10"
            >
                <div className="flex items-center gap-5">
                    {currentAlbum && (
                        <button
                            onClick={() => setCurrentAlbum(null)}
                            className="w-12 h-12 flex items-center justify-center bg-white border border-borderColor/50 rounded-2xl text-textSecondary hover:text-primary hover:border-primary/30 transition-all shadow-sm group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-black text-textMain tracking-tighter">
                            {currentAlbum ? currentAlbum.name : (typeFilter === 'albums' ? 'Albums' : 'Media Library')}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-primary animate-pulse' : 'bg-green-500'}`} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-textSecondary">
                                {loading ? 'Loading Dashboard...' : `${totalCount} Items Indexed`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sub-header actions / Interface */}
                <div className="flex items-center gap-3">
                    {typeFilter === 'albums' && !currentAlbum && (
                        <button
                            onClick={handleCreateAlbum}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-textMain bg-primary hover:bg-secondary transition-all shadow-lg shadow-primary/10"
                        >
                            <Plus className="w-4 h-4" /> New Album
                        </button>
                    )}

                    {/* Search / Perception Filter */}
                    {(typeFilter !== 'albums' || currentAlbum) && (
                        <form onSubmit={handleSearch} className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-grow sm:w-80 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    className="w-full bg-white border border-borderColor/50 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                    placeholder="Search library..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-textMain bg-white border border-borderColor/50 hover:bg-primary hover:border-primary transition-all shadow-sm"
                            >
                                Search
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>

            {/* Type filter tabs */}
            {!currentAlbum && (
                <div className="flex gap-1 mb-6 p-1 bg-bg rounded-xl border border-borderColor w-fit">
                    {TABS.map(tab => (
                        <button key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className={`filter-tab ${typeFilter === tab.value ? 'filter-tab--active' : ''}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Grid */}
            {loading || (typeFilter === 'albums' && albumsLoading) ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                    <p className="text-sm text-textSecondary">Loading…</p>
                </div>
            ) : (media.length === 0 && typeFilter !== 'albums') || (albums.length === 0 && typeFilter === 'albums' && !currentAlbum) ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                    <Layers className="w-12 h-12 text-borderColor" />
                    <p className="text-textMain font-medium">No contents found</p>
                    <p className="text-sm text-textSecondary text-balance max-w-xs">
                        {typeFilter === 'albums' ? 'Start by creating your first collection.' : 'Try adjusting your search or filters.'}
                    </p>
                </div>
            ) : (
                <div className="media-gallery grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {typeFilter === 'albums' && !currentAlbum ? (
                        albums.map((album) => (
                            <AlbumCard
                                key={album._id}
                                album={album}
                                onOpen={setCurrentAlbum}
                                onRename={handleRenameAlbum}
                                onDelete={handleDeleteAlbum}
                            />
                        ))
                    ) : (
                        media.map((item) => (
                            <MediaCard
                                key={item._id}
                                item={item}
                                user={user}
                                onDelete={handleDelete}
                                onClick={(media) => setSelectedImage(media)}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Pagination (Hide for Album list) */}
            {totalPages > 1 && (typeFilter !== 'albums' || currentAlbum) && (
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

            {/* Image Details Modal */}
            {selectedImage && (
                <ImageDetailsModal
                    image={selectedImage}
                    onClose={() => setSelectedImage(null)}
                    albums={albums}
                    onDelete={(id) => {
                        setMedia(media.filter(m => m._id !== id));
                        setTotalCount(c => c - 1);
                        setSelectedImage(null);
                    }}
                    onUpdate={(updated) => {
                        setMedia(media.map(m => m._id === updated._id ? updated : m));
                        setSelectedImage(updated);
                    }}
                />
            )}

            {/* Onboarding System */}
            <OnboardingTour />
            <FakeCursor />
            <AIAssistant />
        </div>
    );
};

export default Dashboard;
