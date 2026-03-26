import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Eye, Images, Lock, Search, X, ChevronLeft, ChevronRight, Sparkles, LogIn, Layers } from 'lucide-react';

const GuestGallery = () => {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(t);
    }, [search]);

    const fetchMedia = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 24 });
            let endpoint = '/media';
            if (debouncedSearch) {
                endpoint = '/media/search';
                params.set('q', debouncedSearch);
                params.set('limit', 50);
            }
            const res = await api.get(`${endpoint}?${params}`);
            const s3Only = (res.data.data || []).filter(
                item => item.url && item.url.includes('amazonaws.com')
            );
            setMedia(s3Only);
            setTotalPages(res.data.pages || 1);
            setTotalCount(res.data.total || 0);
        } catch (err) {
            console.error('Failed to fetch public media', err);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => { fetchMedia(); }, [fetchMedia]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0d0f14] via-[#111318] to-[#0d0f14]">
            {/* ─── Top Bar ─── */}
            <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#FFD41D] shadow-lg shadow-[#FFD41D]/20 group-hover:rotate-12 transition-all duration-500">
                            <Camera className="w-4 h-4 text-black" />
                        </div>
                        <span className="font-black text-white text-lg tracking-tighter hidden sm:block">
                            PIX<span className="text-[#FFD41D] italic">AI</span>
                        </span>
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-[9px] font-bold uppercase tracking-widest">
                            Guest View
                        </span>
                    </Link>

                    {/* Search */}
                    <div className="flex-1 max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search gallery..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#FFD41D]/50 focus:bg-white/10 transition-all"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* CTA */}
                    <Link
                        to="/login"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFD41D] text-black text-xs font-black uppercase tracking-widest hover:bg-yellow-300 transition-all shadow-lg shadow-[#FFD41D]/20 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
                    >
                        <LogIn className="w-3.5 h-3.5" /> Sign In
                    </Link>
                </div>
            </header>

            {/* ─── Hero Banner ─── */}
            <div className="relative overflow-hidden py-16 px-6">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {media.slice(0, 6).map((item, i) => (
                        <div
                            key={item._id}
                            className="absolute rounded-2xl overflow-hidden opacity-10 blur-sm"
                            style={{
                                left: `${(i % 3) * 33 + 2}%`,
                                top: `${Math.floor(i / 3) * 55}%`,
                                width: '28%',
                                aspectRatio: '4/3',
                                transform: `rotate(${(i - 2) * 3}deg)`,
                            }}
                        >
                            <img src={item.url} alt="" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
                <div className="relative z-10 text-center max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFD41D]/10 border border-[#FFD41D]/20 mb-6"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-[#FFD41D]" />
                        <span className="text-[#FFD41D] text-[10px] font-black uppercase tracking-widest">Public Gallery · {totalCount} Photos</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4"
                    >
                        Explore the<br /><span className="text-[#FFD41D]">Visual World</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/50 text-sm leading-relaxed mb-8"
                    >
                        Browse the public gallery. Sign in to upload, organize, and unlock AI-powered photo management.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-center gap-3 flex-wrap"
                    >
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FFD41D] text-black text-sm font-black uppercase tracking-widest hover:bg-yellow-300 transition-all shadow-xl shadow-[#FFD41D]/30 hover:-translate-y-1 active:scale-[0.98]"
                        >
                            <LogIn className="w-4 h-4" /> Get Started Free
                        </Link>
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-bold">
                            <Lock className="w-3.5 h-3.5" />
                            Read-only access
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ─── Gallery Grid ─── */}
            <div className="max-w-7xl mx-auto px-6 pb-16">
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : media.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Layers className="w-14 h-14 text-white/10" />
                        <p className="text-white/40 font-semibold">No public photos yet</p>
                        <Link to="/login" className="text-[#FFD41D] text-sm font-bold underline underline-offset-4">
                            Sign in to upload the first one
                        </Link>
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                    >
                        <AnimatePresence>
                            {media.map((item, i) => (
                                <motion.div
                                    key={item._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                                    className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-white/5"
                                    onClick={() => setSelectedImage(item)}
                                >
                                    <img
                                        src={item.thumbnailUrl || item.url}
                                        alt={item.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                                        <p className="text-white text-xs font-bold truncate">{item.title}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Eye className="w-3.5 h-3.5 text-white/60" />
                                            <span className="text-white/60 text-[10px]">View only</span>
                                        </div>
                                    </div>
                                    {/* Lock icon overlay on hover center */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                            <Eye className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-12">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/10 bg-white/5 text-white/50 hover:border-[#FFD41D]/30 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        <span className="text-sm text-white/40">
                            Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/10 bg-white/5 text-white/50 hover:border-[#FFD41D]/30 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Call to action banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 bg-gradient-to-r from-[#FFD41D]/10 via-[#FFD41D]/5 to-transparent border border-[#FFD41D]/20 rounded-[24px] p-8 flex flex-col sm:flex-row items-center gap-6 justify-between"
                >
                    <div>
                        <h3 className="text-white font-black text-xl mb-1">Want to upload your own photos?</h3>
                        <p className="text-white/50 text-sm">Create a free account and unlock AI-powered tagging, albums, and more.</p>
                    </div>
                    <Link
                        to="/login"
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#FFD41D] text-black text-sm font-black uppercase tracking-widest hover:bg-yellow-300 transition-all shadow-xl shadow-[#FFD41D]/30 hover:-translate-y-0.5 active:scale-[0.98] whitespace-nowrap"
                    >
                        <LogIn className="w-4 h-4" /> Sign In / Sign Up
                    </Link>
                </motion.div>
            </div>

            {/* ─── Lightbox Modal ─── */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-4xl max-h-[90vh] w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-4 -right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <img
                                src={selectedImage.lowResUrl || selectedImage.thumbnailUrl || selectedImage.url}
                                alt={selectedImage.title}
                                className="w-full max-h-[80vh] object-contain rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
                            />
                            <div className="mt-4 flex items-center justify-between">
                                <div>
                                    <p className="text-white font-bold">{selectedImage.title}</p>
                                    <p className="text-white/40 text-xs mt-0.5">{selectedImage.metadata?.mimetype?.split('/')[1]?.toUpperCase() || selectedImage.type}</p>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-bold">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Sign in to download or manage</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GuestGallery;
