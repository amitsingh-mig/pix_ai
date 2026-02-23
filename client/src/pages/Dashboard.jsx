import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Search, Layers, ChevronLeft, ChevronRight, Folder, ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import MediaCard from '../components/MediaCard';
import AlbumCard from '../components/AlbumCard';
import ImageDetailsModal from '../components/ImageDetailsModal';
import FakeCursor from "../components/FakeCursor";
import AIAssistant from "../components/AIAssistant";
import NavigationPath from '../components/NavigationPath';
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
    const {
        albums,
        refreshAlbums,
        addAlbum,
        updateAlbumState,
        deleteAlbum,
        loading: albumsLoading,
        navigationPath,
        addToPath,
        clearPath,
        jumpToPath
    } = useAlbums();

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
            params.set('limit', 24);
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
        if (currentAlbum) {
            addToPath(currentAlbum);
        }
    }, [page, typeFilter, currentAlbum, debouncedSearch, fetchMedia, addToPath]);

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
            await deleteAlbum(album._id);
            if (currentAlbum?._id === album._id) {
                setCurrentAlbum(null);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete album');
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
                <div className="flex items-center gap-4">
                    {currentAlbum && (
                        <button
                            onClick={() => setCurrentAlbum(null)}
                            className="w-12 h-12 flex items-center justify-center bg-white border border-borderColor/50 rounded-2xl text-textSecondary hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-textMain tracking-tight">
                                {currentAlbum ? currentAlbum.name : (typeFilter === 'albums' ? 'Your Collections' : 'Media Library')}
                            </h1>
                            {currentAlbum && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Album Active</span>
                                </div>
                            )}
                            {currentAlbum && (
                                <div className="flex items-center gap-1 ml-2">
                                    <button
                                        onClick={() => handleRenameAlbum(currentAlbum)}
                                        className="p-2 hover:bg-bg rounded-xl text-textSecondary hover:text-secondary transition-all"
                                        title="Rename Album"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDeleteAlbum(currentAlbum);
                                            // Close album view after deletion is confirmed in handleDeleteAlbum
                                            // (Note: handleDeleteAlbum doesn't close it, so we should handle it here or there)
                                        }}
                                        className="p-2 hover:bg-bg rounded-xl text-textSecondary hover:text-accent transition-all"
                                        title="Delete Album"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-textSecondary mt-1.5 font-medium max-w-lg leading-relaxed">
                            {currentAlbum
                                ? (currentAlbum.description || 'A curated collection of your favorite moments.')
                                : (typeFilter === 'albums'
                                    ? 'Organize your media into beautiful, searchable collections.'
                                    : 'Access and manage all your uploaded photos and videos in one place.')
                            }
                        </p>
                    </div>
                </div>

                {/* Sub-header actions / Interface */}
                <div className="flex items-center gap-3">
                    {typeFilter === 'albums' && !currentAlbum && (
                        <button
                            onClick={handleCreateAlbum}
                            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-textMain bg-primary hover:bg-secondary transition-all shadow-xl shadow-primary/20 group"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                            <span>New Collection</span>
                        </button>
                    )}

                    {/* Search / Perception Filter */}
                    {(typeFilter !== 'albums' || currentAlbum) && (
                        <form onSubmit={handleSearch} className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-grow sm:w-80 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary group-focus-within:text-primary transition-colors" />
                                <input
                                    id="search-bar"
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

            {/* Navigation Path (Breadcrumbs) */}
            <NavigationPath
                path={navigationPath}
                onJump={(idx, album) => {
                    jumpToPath(idx);
                    setCurrentAlbum(album);
                    setTypeFilter('albums');
                }}
                onHome={() => {
                    clearPath();
                    setCurrentAlbum(null);
                }}
            />

            {/* Type filter tabs */}
            {!currentAlbum && (
                <div className="flex gap-1 mb-6 p-1 bg-bg rounded-xl border border-borderColor w-fit">
                    {TABS.map(tab => (
                        <button key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className={`filter-tab ${typeFilter === tab.value ? 'filter-tab-active' : ''}`}>
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
                <div id="media-gallery" className="media-gallery grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
            <FakeCursor />
            <AIAssistant />
        </div>
    );
};

export default Dashboard;
