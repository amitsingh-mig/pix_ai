import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Layers, ChevronLeft, ChevronRight, Folder, ArrowLeft, Plus, Edit2, Trash2, Filter, X, Calendar, Camera, MapPin, RefreshCw, Crown, Users, Image as ImageIcon, Video, ShieldCheck, Upload, Sparkles, MessageSquare } from 'lucide-react';
import MediaCard from '../components/MediaCard';
import AlbumCard from '../components/AlbumCard';
import ImageDetailsModal from '../components/ImageDetailsModal';
import FakeCursor from "../components/FakeCursor";
import AIAssistant from "../components/AIAssistant";
import NavigationPath from '../components/NavigationPath';
import { useAlbums } from '../context/AlbumContext';
import { useSearchParams, Link } from 'react-router-dom';

const TABS = [
    { label: 'All', value: '' },
    { label: 'Images', value: 'image' },
    { label: 'Videos', value: 'video' },
    { label: 'Albums', value: 'albums' },
];

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

// ─── Role-Based Welcome Banner ────────────────────────────────────────────────
const RoleWelcomeBanner = ({ user }) => {
    const [adminStats, setAdminStats] = useState(null);
    const role = user?.role || 'user';

    useEffect(() => {
        if (role === 'admin') {
            api.get('/admin/stats')
                .then(res => setAdminStats(res.data.data))
                .catch(() => {});
        }
    }, [role]);

    if (role === 'admin') {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                {/* Admin Welcome Header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                            <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-black text-textMain tracking-tight">
                                    Welcome, {user?.username || 'Admin'}
                                </h2>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-black uppercase tracking-wider">
                                    <ShieldCheck className="w-3 h-3" /> Admin
                                </span>
                            </div>
                            <p className="text-sm text-textSecondary mt-0.5">Manage your platform, monitor activity, and control all media.</p>
                        </div>
                    </div>
                    <div className="sm:ml-auto flex items-center gap-3">
                        <Link
                            to="/admin"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-borderColor text-xs font-black uppercase tracking-widest text-textSecondary hover:border-primary/40 hover:text-primary transition-all shadow-sm"
                        >
                            <Users className="w-3.5 h-3.5" /> Manage Users
                        </Link>
                        <Link
                            to="/upload"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-textMain text-xs font-black uppercase tracking-widest hover:bg-secondary transition-all shadow-lg shadow-primary/20"
                        >
                            <Upload className="w-3.5 h-3.5" /> Upload
                        </Link>
                    </div>
                </div>

                {/* Admin Stats Grid */}
                {adminStats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Users', value: adminStats.totalUsers, icon: Users, gradient: 'from-blue-500 to-indigo-600', bgLight: 'bg-blue-50', textColor: 'text-blue-600' },
                            { label: 'Total Media', value: adminStats.totalMedia, icon: Layers, gradient: 'from-violet-500 to-purple-600', bgLight: 'bg-violet-50', textColor: 'text-violet-600' },
                            { label: 'Total Images', value: adminStats.totalImages, icon: ImageIcon, gradient: 'from-amber-400 to-orange-500', bgLight: 'bg-amber-50', textColor: 'text-amber-600' },
                            { label: 'Total Videos', value: adminStats.totalVideos, icon: Video, gradient: 'from-red-500 to-pink-600', bgLight: 'bg-red-50', textColor: 'text-red-600' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="bg-white rounded-2xl p-5 border border-borderColor shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl ${stat.bgLight} ${stat.textColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${stat.gradient} opacity-60`} />
                                </div>
                                <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-2xl font-black text-textMain">{stat.value ?? '—'}</p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        );
    }

    // Regular User Welcome
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-borderColor shadow-sm"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Sparkles className="w-6 h-6 text-textMain" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-textMain tracking-tight">
                            Welcome back, {user?.username || 'there'}!
                        </h2>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-amber-700 border border-primary/20 text-[10px] font-black uppercase tracking-wider">
                            User
                        </span>
                    </div>
                    <p className="text-sm text-textSecondary mt-0.5">Manage your personal uploads, organize albums, and explore your gallery.</p>
                </div>
            </div>
            <Link
                to="/upload"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-textMain text-xs font-black uppercase tracking-widest hover:bg-secondary transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:scale-[0.98] whitespace-nowrap"
            >
                <Upload className="w-3.5 h-3.5" /> Upload Photos
            </Link>
        </motion.div>
    );
};


const Dashboard = () => {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const urlQuery = searchParams.get('q') || '';
    const initialTab = searchParams.get('tab') || ''; // Changed 'all' to '' to match TABS structure for 'All'

    const [typeFilter, setTypeFilter] = useState(initialTab);
    const [currentAlbum, setCurrentAlbum] = useState(null);
    const [page, setPage] = useState(1);
    const [filterOptions, setFilterOptions] = useState({ cameras: [], locations: [], albums: [], sceneTypes: [], moods: [], people: [], resolutions: [], mimetypes: [] });
    const [activeFilters, setActiveFilters] = useState({
        search: '',
        camera: '',
        location: '',
        startDate: '',
        endDate: '',
        dateMode: 'range',
        sceneType: '',
        mood: '',
        personName: '',
        resolution: '',
        mimetype: ''
    });
    const [stagedFilters, setStagedFilters] = useState({
        search: '',
        camera: '',
        location: '',
        startDate: '',
        endDate: '',
        dateMode: 'range',
        sceneType: '',
        mood: '',
        personName: '',
        resolution: '',
        mimetype: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState(urlQuery);
    const [suggestions, setSuggestions] = useState({ keywords: [], locations: [], cameras: [], media: [] });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Fetch Search Suggestions
    const fetchSuggestions = useCallback(async (q) => {
        if (!q || q.length < 2) {
            setSuggestions({ keywords: [], locations: [], cameras: [], media: [] });
            return;
        }
        setIsSuggesting(true);
        try {
            const res = await api.get(`/media/suggestions?q=${encodeURIComponent(q)}`);
            setSuggestions(res.data.data);
        } catch (err) {
            console.error('Suggestions Error:', err);
        } finally {
            setIsSuggesting(false);
        }
    }, []);

    // Debounce Search Suggestions
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery && searchQuery.length >= 2) {
                fetchSuggestions(searchQuery);
            } else {
                setSuggestions({ keywords: [], locations: [], cameras: [], media: [] });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchSuggestions]);

    // Sync search input with URL query
    useEffect(() => {
        setSearchQuery(urlQuery);
    }, [urlQuery]);

    // Reset page when search query changes to avoid stuck on high pages
    useEffect(() => {
        if (urlQuery) {
            // Check if global search is a date
            if (!handleSmartDateSearch(urlQuery)) {
                // Not a date, just reset filters for normal search if needed
                setActiveFilters(prev => ({ ...prev, search: '' }));
            }
        }
        setPage(1);
    }, [urlQuery]);

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

    // Auto-open filters if ?search=true is present
    useEffect(() => {
        if (searchParams.get('search') === 'true') {
            setShowFilters(true);
            setStagedFilters(activeFilters);
        }
        if (searchParams.get('tab')) {
            setTypeFilter(searchParams.get('tab'));
            setCurrentAlbum(null);
        }
    }, [searchParams]);

    // Debounce search
    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         setDebouncedSearch(search);
    //     }, 600);
    //     return () => clearTimeout(timer);
    // }, [search]);

    const fetchMedia = useCallback(async (q = urlQuery, type = typeFilter, p = page, albumId = currentAlbum?._id, filters = activeFilters) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', p);

            let endpoint = '/media';

            // If we have a general search query OR filters OR we're in an album with a search, use search endpoint
            const hasActiveFilters = filters.search || filters.camera || filters.location || filters.startDate || filters.endDate || filters.sceneType || filters.mood;

            if (q || hasActiveFilters || (albumId && filters.search)) {
                endpoint = '/media/search';
                params.set('q', q || filters.search || '');
                params.set('limit', 50);

                if (albumId) params.set('albumId', albumId);

                // Add Discrete Filters to search endpoint
                if (filters.camera) params.set('camera', filters.camera);
                if (filters.location) params.set('location', filters.location);
                if (filters.startDate) params.set('startDate', filters.startDate);
                if (filters.endDate) params.set('endDate', filters.endDate);
                if (filters.sceneType) params.set('sceneType', filters.sceneType);
                if (filters.mood) params.set('mood', filters.mood);
                if (filters.personName) params.set('personName', filters.personName);
                if (filters.resolution) params.set('resolution', filters.resolution);
                if (filters.mimetype) params.set('mimetype', filters.mimetype);
            } else {
                if (type && type !== 'albums') params.set('type', type);
                if (albumId) params.set('albumId', albumId);
                params.set('limit', 24);
            }

            const res = await api.get(`${endpoint}?${params}`);
            // STEP 3: Frontend safety filter — only display AWS S3 media
            const s3Only = (res.data.data || []).filter(
                item => item.url && item.url.includes('amazonaws.com')
            );
            setMedia(s3Only);
            setTotalPages(res.data.pages || 1);
            setTotalCount(res.data.total || 0);
        } catch (err) {
            console.error('Failed to fetch media', err);
        } finally {
            setLoading(false);
        }
    }, [urlQuery, typeFilter, page, currentAlbum, activeFilters]);

    const handleSmartDateSearch = (text) => {
        // Simple regex for dates like "21 Feb 2026", "Feb 2026", "2026"
        const dayMonthYearRegex = /^(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})$/i;
        const monthYearRegex = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})$/i;
        const yearRegex = /^(\d{4})$/;

        let newFilters = { ...stagedFilters };
        let found = false;

        if (dayMonthYearRegex.test(text)) {
            const [, day, month, year] = text.match(dayMonthYearRegex);
            const dateStr = new Date(`${day} ${month} ${year}`).toISOString().split('T')[0];
            newFilters = { ...newFilters, startDate: dateStr, endDate: dateStr, dateMode: 'single', search: '' };
            found = true;
        } else if (monthYearRegex.test(text)) {
            const [, month, year] = text.match(monthYearRegex);
            const start = new Date(`${month} 1 ${year}`).toISOString().split('T')[0];
            const end = new Date(parseInt(year), new Date(`${month} 1 ${year}`).getMonth() + 1, 0).toISOString().split('T')[0];
            newFilters = { ...newFilters, startDate: start, endDate: end, dateMode: 'month', search: '' };
            found = true;
        } else if (yearRegex.test(text)) {
            const year = text.match(yearRegex)[1];
            newFilters = { ...newFilters, startDate: `${year}-01-01`, endDate: `${year}-12-31`, dateMode: 'year', search: '' };
            found = true;
        }

        if (found) {
            handleFilterApply(newFilters);
            return true;
        }
        return false;
    };

    const fetchFilterOptions = useCallback(async () => {
        try {
            const res = await api.get('/media/filter-options');
            setFilterOptions(res.data.data || res.data); // Support both standard and raw response
        } catch (err) {
            console.error('Failed to fetch filter options', err);
        }
    }, []);

    useEffect(() => {
        if (user) fetchFilterOptions();
    }, [user, fetchFilterOptions]);

    useEffect(() => {
        fetchMedia(urlQuery, typeFilter, page, currentAlbum?._id, activeFilters);
        if (currentAlbum) {
            addToPath(currentAlbum);
        }
    }, [page, typeFilter, currentAlbum, urlQuery, fetchMedia, addToPath, activeFilters]);

    useEffect(() => {
        const q = searchParams.get('q') || '';
        const camera = searchParams.get('camera') || '';
        const location = searchParams.get('location') || '';
        const startDate = searchParams.get('startDate') || '';
        const endDate = searchParams.get('endDate') || '';
        const sceneType = searchParams.get('sceneType') || '';
        const mood = searchParams.get('mood') || '';
        const personName = searchParams.get('personName') || '';
        const resolution = searchParams.get('resolution') || '';
        const mimetype = searchParams.get('mimetype') || '';
 
        if (q || camera || location || startDate || endDate || sceneType || mood || personName || resolution || mimetype) {
            const filtersFromUrl = {
                search: q,
                camera,
                location,
                startDate,
                endDate,
                sceneType,
                mood,
                personName,
                resolution,
                mimetype,
                dateMode: 'range'
            };
            setActiveFilters(filtersFromUrl);
            setStagedFilters(filtersFromUrl);
        }
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        
        const newParams = new URLSearchParams(searchParams);
        if (searchQuery) {
            newParams.set('q', searchQuery);
        } else {
            newParams.delete('q');
        }
        setSearchParams(newParams);
    };

    const handleTabChange = (val) => {
        setTypeFilter(val);
        setCurrentAlbum(null);
        setPage(1);
    };

    const handleFilterApply = useCallback((newFilters) => {
        const filters = { ...activeFilters, ...newFilters };
        setActiveFilters(filters);
        setStagedFilters(filters);
        setPage(1);
        setShowFilters(true);

        // Construct new URL parameters
        const newParams = new URLSearchParams();
        // If filters.search is set, use it as 'q'
        if (filters.search) {
            newParams.set('q', filters.search);
        } else if (urlQuery) {
            // Keep existing q if filters.search is empty but urlQuery exists 
            // (or clear it if we want the panel to be the master)
            // Let's make the panel keyword override if it was explicitly cleared
            // If newFilters contains search: '', then use that.
            if (newFilters.hasOwnProperty('search')) {
                if (newFilters.search) newParams.set('q', newFilters.search);
            } else {
                newParams.set('q', urlQuery);
            }
        }

        if (filters.camera) newParams.set('camera', filters.camera);
        if (filters.location) newParams.set('location', filters.location);
        if (filters.startDate) newParams.set('startDate', filters.startDate);
        if (filters.endDate) newParams.set('endDate', filters.endDate);
        if (filters.sceneType) newParams.set('sceneType', filters.sceneType);
        if (filters.mood) newParams.set('mood', filters.mood);
        if (filters.personName) newParams.set('personName', filters.personName);
        if (filters.resolution) newParams.set('resolution', filters.resolution);
        if (filters.mimetype) newParams.set('mimetype', filters.mimetype);
        if (searchParams.get('tab')) newParams.set('tab', searchParams.get('tab'));
        if (searchParams.get('search') === 'true') newParams.set('search', 'true');

        setSearchParams(newParams);
        fetchMedia(newParams.get('q') || '', typeFilter, 1, currentAlbum?._id, filters);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeFilters, fetchMedia, urlQuery, typeFilter, currentAlbum, searchParams, setSearchParams]);

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

            {/* ══════════════════════════════════════════════════════════════
                ROLE-BASED WELCOME BANNER
            ══════════════════════════════════════════════════════════════ */}
            <RoleWelcomeBanner user={user} />

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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 lg:flex-initial">
                    {/* Persistent Search Bar (Normal AI Search) */}
                    <div className="flex-1 min-w-0 sm:min-w-[300px] lg:min-w-[450px] relative">
                        <form onSubmit={handleSearch} className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                <Search className={`w-4 h-4 text-textSecondary group-focus-within:text-primary transition-colors duration-300 ${isSuggesting ? 'animate-spin' : ''}`} />
                                <Sparkles className="w-3 h-3 text-secondary animate-pulse opacity-60" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search keyword, camera, or location..."
                                value={searchQuery}
                                onFocus={() => setShowSuggestions(true)}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                className="w-full bg-white border border-borderColor/50 rounded-2xl pl-14 pr-10 py-3.5 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all group-hover:border-primary/30 shadow-sm"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        const newParams = new URLSearchParams(searchParams);
                                        newParams.delete('q');
                                        setSearchParams(newParams);
                                        setShowSuggestions(false);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-bg flex items-center justify-center text-textSecondary hover:text-accent transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </form>

                        {/* Real-time Smart Suggestions Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && (searchQuery.length >= 2) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-3 bg-white border border-borderColor/50 rounded-3xl shadow-2xl p-6 z-[100] max-h-[500px] overflow-y-auto custom-scrollbar"
                                >
                                    <div className="flex flex-col gap-8">
                                        {/* Categories Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-6 border-b border-borderColor/20">
                                            {/* AI Keywords */}
                                            {suggestions.keywords.length > 0 && (
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <Sparkles className="w-3 h-3 text-secondary" /> AI Keywords
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {suggestions.keywords.map(k => (
                                                            <button 
                                                                key={k.text} 
                                                                onClick={() => {
                                                                    setSearchQuery(k.text);
                                                                    handleSearch({ preventDefault: () => {}, target: { value: k.text } });
                                                                    setShowSuggestions(false);
                                                                }}
                                                                className="px-3 py-1.5 bg-bg hover:bg-primary/10 rounded-xl text-[10px] font-bold text-textMain border border-borderColor/30 transition-all hover:border-primary/30 flex items-center gap-1.5"
                                                            >
                                                                #{k.text} <span className="opacity-40 text-[8px]">{k.count}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Smart Locations */}
                                            {suggestions.locations.length > 0 && (
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <MapPin className="w-3 h-3 text-red-500" /> Top Locations
                                                    </p>
                                                    <div className="space-y-1">
                                                        {suggestions.locations.map(l => (
                                                            <button 
                                                                key={l.text} 
                                                                onClick={() => {
                                                                    setSearchQuery(l.text);
                                                                    handleSearch({ preventDefault: () => {} });
                                                                    setShowSuggestions(false);
                                                                }}
                                                                className="w-full text-left px-3 py-2 hover:bg-red-50 rounded-xl text-[10px] font-bold text-textMain transition-all flex items-center justify-between group"
                                                            >
                                                                <span className="truncate pr-4">{l.text}</span>
                                                                <span className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">Find in {l.count} items</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Camera Details */}
                                        {suggestions.cameras.length > 0 && (
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Camera className="w-3 h-3 text-violet-500" /> Hardware / Devices
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {suggestions.cameras.map(c => (
                                                        <button 
                                                            key={c.text} 
                                                            onClick={() => {
                                                                    setSearchQuery(c.text);
                                                                    handleSearch({ preventDefault: () => {} });
                                                                    setShowSuggestions(false);
                                                            }}
                                                            className="px-4 py-2 bg-violet-50 hover:bg-violet-100 rounded-xl text-[10px] font-black text-violet-700 transition-all border border-violet-100"
                                                        >
                                                            {c.text}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quick Media Previews */}
                                        {suggestions.media.length > 0 && (
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <ImageIcon className="w-3 h-3 text-emerald-500" /> Match Previews
                                                </p>
                                                <div className="grid grid-cols-4 gap-3">
                                                    {suggestions.media.map(m => (
                                                        <button 
                                                            key={m.id}
                                                            onClick={() => {
                                                                setSelectedImage(m); // Select it
                                                                setShowSuggestions(false);
                                                            }}
                                                            className="aspect-square rounded-2xl overflow-hidden group shadow-sm bg-bg relative"
                                                        >
                                                            <img 
                                                                src={m.url} 
                                                                alt={m.title} 
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                {m.type === 'video' ? <Video className="w-6 h-6 text-white" /> : <Layers className="w-6 h-6 text-white" />}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* No Results */}
                                        {!isSuggesting && !suggestions.keywords.length && !suggestions.locations.length && !suggestions.cameras.length && (
                                            <div className="py-10 text-center space-y-3">
                                                <div className="w-16 h-16 bg-bg rounded-[24px] flex items-center justify-center mx-auto text-textSecondary/50">
                                                    <Search className="w-8 h-8" />
                                                </div>
                                                <p className="text-[10px] font-black text-textSecondary uppercase tracking-widest">No smart results found for "{searchQuery}"</p>
                                                <p className="text-[9px] font-bold text-textSecondary/60 italic lowercase">Try searching for a city, camera model, or AI keyword.</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Action Footer */}
                                    <div className="mt-8 pt-4 border-t border-borderColor/20 flex items-center justify-between">
                                        <p className="text-[9px] font-bold text-textSecondary flex items-center gap-1.5 opacity-60 italic">
                                            <Sparkles className="w-2.5 h-2.5" /> <span>Press Enter to view all results</span>
                                        </p>
                                        <button 
                                            onClick={() => setShowSuggestions(false)}
                                            className="text-[9px] font-black uppercase text-accent hover:underline"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setShowFilters(!showFilters);
                                if (!showFilters) setStagedFilters(activeFilters);
                            }}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm border ${showFilters ? 'bg-primary border-primary text-textMain' : 'bg-white border-borderColor/50 text-textSecondary hover:border-primary/30'}`}
                        >
                            <Filter className={`w-4 h-4 ${showFilters ? 'animate-pulse' : ''}`} />
                            <span className="hidden sm:inline">Filters</span>
                            {Object.values(activeFilters).some(v => v !== '' && v !== 'range') && (
                                <span className="w-2 h-2 rounded-full bg-accent animate-bounce" />
                            )}
                        </button>

                        {typeFilter === 'albums' && !currentAlbum && (
                            <button
                                onClick={handleCreateAlbum}
                                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-textMain bg-primary hover:bg-secondary transition-all shadow-xl shadow-primary/20 group"
                            >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                                <span className="hidden sm:inline">New Collection</span>
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Advanced Filter Bar */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-12"
                    >
                        <div className="bg-white border border-borderColor/50 rounded-[32px] p-8 shadow-2xl shadow-black/5 flex flex-col gap-10 relative overflow-hidden">
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

                            <div className="flex items-center justify-between border-b border-borderColor/30 pb-6 relative z-10">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-textMain flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Layers className="w-4 h-4" />
                                        </div>
                                        Refining Search
                                    </h3>
                                    <p className="text-[10px] text-textSecondary font-bold mt-1.5 uppercase tracking-widest opacity-60">Fine-tune your library with AI-powered discovery</p>
                                </div>
                                {Object.values(stagedFilters).some(v => v !== '' && v !== 'range') && (
                                    <button
                                        onClick={() => {
                                            const cleared = { search: '', camera: '', location: '', startDate: '', endDate: '', sceneType: '', mood: '', personName: '', resolution: '', mimetype: '', dateMode: 'range' };
                                            setStagedFilters(cleared);
                                            setActiveFilters(cleared);
                                            setSearchParams({});
                                        }}
                                        className="text-[10px] font-black text-accent px-5 py-2.5 rounded-2xl bg-accent/5 hover:bg-accent hover:text-white uppercase tracking-widest flex items-center gap-2.5 transition-all duration-300 active:scale-95 shadow-sm border border-accent/10"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" /> Clear All Filters
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8 relative z-10">
                                
                                {/* ─── SECTION 1: KEYWORDS & AI ─── */}
                                <div className="space-y-6">
                                    <p className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] flex items-center gap-2 border-l-2 border-primary/20 pl-3">Discovery</p>
                                    <div className="space-y-4">
                                        {/* Keyword Filter */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                <Search className="w-3 h-3 text-primary" /> Keyword Search
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    placeholder="e.g. sunset, mountains..."
                                                    value={stagedFilters.search}
                                                    onChange={(e) => setStagedFilters(prev => ({ ...prev, search: e.target.value }))}
                                                    className="w-full bg-bg border border-borderColor/50 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all group-hover:border-primary/30"
                                                />
                                            </div>
                                        </div>

                                        {/* Scene Type Filter */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                <Sparkles className="w-3 h-3 text-secondary" /> Scene Context
                                            </label>
                                            <select
                                                value={stagedFilters.sceneType}
                                                onChange={(e) => setStagedFilters(prev => ({ ...prev, sceneType: e.target.value }))}
                                                className="w-full bg-bg border border-borderColor/50 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
                                            >
                                                <option value="">All Scenes</option>
                                                {filterOptions.sceneTypes && filterOptions.sceneTypes.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Mood Filter */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                <MessageSquare className="w-3 h-3 text-orange-500" /> Emotional Mood
                                            </label>
                                            <select
                                                value={stagedFilters.mood}
                                                onChange={(e) => setStagedFilters(prev => ({ ...prev, mood: e.target.value }))}
                                                className="w-full bg-bg border border-borderColor/50 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
                                            >
                                                <option value="">Any Mood</option>
                                                {filterOptions.moods && filterOptions.moods.map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ─── SECTION 2: PEOPLE & SPECS ─── */}
                                <div className="space-y-6">
                                    <p className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] flex items-center gap-2 border-l-2 border-primary/20 pl-3">Specifications</p>
                                    <div className="space-y-4">
                                        {/* People Filter */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                <Users className="w-3 h-3 text-blue-500" /> Detected People
                                            </label>
                                            <select
                                                value={stagedFilters.personName}
                                                onChange={(e) => setStagedFilters(prev => ({ ...prev, personName: e.target.value }))}
                                                className="w-full bg-bg border border-borderColor/50 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
                                            >
                                                <option value="">Everyone</option>
                                                {filterOptions.people && filterOptions.people.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Camera Filter */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                <Camera className="w-3 h-3 text-violet-500" /> Camera Device
                                            </label>
                                            <select
                                                value={stagedFilters.camera}
                                                onChange={(e) => setStagedFilters(prev => ({ ...prev, camera: e.target.value }))}
                                                className="w-full bg-bg border border-borderColor/50 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
                                            >
                                                <option value="">Any Camera</option>
                                                {filterOptions.cameras && filterOptions.cameras.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Resolution Filter */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                <Layers className="w-3 h-3 text-emerald-500" /> Resolution
                                            </label>
                                            <select
                                                value={stagedFilters.resolution}
                                                onChange={(e) => setStagedFilters(prev => ({ ...prev, resolution: e.target.value }))}
                                                className="w-full bg-bg border border-borderColor/50 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
                                            >
                                                <option value="">Any Resolution</option>
                                                {filterOptions.resolutions && filterOptions.resolutions.map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ─── SECTION 3: LOCATION & TYPE ─── */}
                                <div className="space-y-6">
                                    <p className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] flex items-center gap-2 border-l-2 border-primary/20 pl-3">Meta Data</p>
                                    <div className="space-y-4">
                                        {/* Location Filter */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                <MapPin className="w-3 h-3 text-red-500" /> Geospatial Location
                                            </label>
                                            <select
                                                value={stagedFilters.location}
                                                onChange={(e) => setStagedFilters(prev => ({ ...prev, location: e.target.value }))}
                                                className="w-full bg-bg border border-borderColor/50 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
                                            >
                                                <option value="">Anywhere</option>
                                                {filterOptions.locations && filterOptions.locations.map(l => (
                                                    <option key={l} value={l}>{l}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* File Type Filter */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                <ImageIcon className="w-3 h-3 text-amber-500" /> File Type / Format
                                            </label>
                                            <select
                                                value={stagedFilters.mimetype}
                                                onChange={(e) => setStagedFilters(prev => ({ ...prev, mimetype: e.target.value }))}
                                                className="w-full bg-bg border border-borderColor/50 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
                                            >
                                                <option value="">All Formats</option>
                                                {filterOptions.mimetypes && filterOptions.mimetypes.map(m => (
                                                    <option key={m} value={m}>{m.split('/')[1]?.toUpperCase() || m}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ─── SECTION 4: TIME MACHINE ─── */}
                                <div className="space-y-6">
                                    <p className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] flex items-center gap-2 border-l-2 border-primary/20 pl-3">Time Range</p>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                <Calendar className="w-3 h-3 text-indigo-500" /> Mode
                                            </label>
                                            <div className="flex bg-bg border border-borderColor/50 rounded-2xl p-1 overflow-hidden">
                                                {['range', 'month', 'year'].map(mode => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => setStagedFilters(prev => ({ ...prev, dateMode: mode }))}
                                                        className={`flex-1 py-2 text-[8px] font-black uppercase tracking-tighter rounded-xl transition-all duration-300 ${stagedFilters.dateMode === mode ? 'bg-primary text-textMain shadow-md' : 'text-textSecondary hover:bg-white'
                                                            }`}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {stagedFilters.dateMode === 'range' && (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="date"
                                                        value={stagedFilters.startDate}
                                                        onChange={(e) => setStagedFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                                        className="w-1/2 bg-bg border border-borderColor/50 rounded-2xl px-3 py-3 text-[10px] font-bold outline-none transition-all focus:border-primary"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={stagedFilters.endDate}
                                                        onChange={(e) => setStagedFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                                        className="w-1/2 bg-bg border border-borderColor/50 rounded-2xl px-3 py-3 text-[10px] font-bold outline-none transition-all focus:border-primary"
                                                    />
                                                </div>
                                            )}
                                            {stagedFilters.dateMode === 'month' && (
                                                <div className="flex gap-2">
                                                    <select
                                                        value={stagedFilters.startDate ? new Date(stagedFilters.startDate).getMonth() : new Date().getMonth()}
                                                        onChange={(e) => {
                                                            const m = parseInt(e.target.value);
                                                            const y = stagedFilters.startDate ? new Date(stagedFilters.startDate).getFullYear() : new Date().getFullYear();
                                                            const firstDay = new Date(y, m, 1).toISOString().split('T')[0];
                                                            const lastDay = new Date(y, m + 1, 0).toISOString().split('T')[0];
                                                            setStagedFilters(prev => ({ ...prev, startDate: firstDay, endDate: lastDay }));
                                                        }}
                                                        className="w-2/3 bg-bg border border-borderColor/50 rounded-2xl px-3 py-3 text-xs font-bold outline-none transition-all"
                                                    >
                                                        {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                                                    </select>
                                                    <select
                                                        value={stagedFilters.startDate ? new Date(stagedFilters.startDate).getFullYear() : YEARS[0]}
                                                        onChange={(e) => {
                                                            const y = parseInt(e.target.value);
                                                            const m = stagedFilters.startDate ? new Date(stagedFilters.startDate).getMonth() : new Date().getMonth();
                                                            const firstDay = new Date(y, m, 1).toISOString().split('T')[0];
                                                            const lastDay = new Date(y, m + 1, 0).toISOString().split('T')[0];
                                                            setStagedFilters(prev => ({ ...prev, startDate: firstDay, endDate: lastDay }));
                                                        }}
                                                        className="w-1/3 bg-bg border border-borderColor/50 rounded-2xl px-2 py-3 text-xs font-bold outline-none transition-all"
                                                    >
                                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                            {stagedFilters.dateMode === 'year' && (
                                                <select
                                                    value={stagedFilters.startDate ? new Date(stagedFilters.startDate).getFullYear() : YEARS[0]}
                                                    onChange={(e) => {
                                                        const y = e.target.value;
                                                        setStagedFilters(prev => ({ ...prev, startDate: `${y}-01-01`, endDate: `${y}-12-31` }));
                                                    }}
                                                    className="w-full bg-bg border border-borderColor/50 rounded-2xl px-4 py-3 text-xs font-bold outline-none transition-all"
                                                >
                                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between pt-6 border-t border-borderColor/30 relative z-10">
                                <p className="text-[10px] font-bold text-textSecondary italic opacity-60">Pro tip: Use multiple filters to pinpoint exact media.</p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowFilters(false)}
                                        className="px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-textSecondary hover:bg-bg transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleFilterApply(stagedFilters)}
                                        className="bg-primary hover:bg-secondary text-textMain px-10 py-3.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/30 transition-all active:scale-[0.98] flex items-center gap-3 hover:-translate-y-1"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" /> Apply Refined Search
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                    user={user}
                    onClose={() => setSelectedImage(null)}
                    albums={albums}
                    filterOptions={filterOptions}
                    onFilter={handleFilterApply}
                    onDelete={(id) => {
                        setMedia(media.filter(m => m._id !== id));
                        setTotalCount(c => c - 1);
                        setSelectedImage(null);
                    }}
                    onUpdate={(updated) => {
                        setMedia(media.map(m => m._id === updated._id ? updated : m));
                        setSelectedImage(updated);
                        fetchFilterOptions(); // Reflect new metadata in search lists
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
