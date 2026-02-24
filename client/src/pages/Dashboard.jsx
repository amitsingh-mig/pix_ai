import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Layers, ChevronLeft, ChevronRight, Folder, ArrowLeft, Plus, Edit2, Trash2, Filter, X, Calendar, Camera, MapPin, RefreshCw } from 'lucide-react';
import MediaCard from '../components/MediaCard';
import AlbumCard from '../components/AlbumCard';
import ImageDetailsModal from '../components/ImageDetailsModal';
import FakeCursor from "../components/FakeCursor";
import AIAssistant from "../components/AIAssistant";
import NavigationPath from '../components/NavigationPath';
import { useAlbums } from '../context/AlbumContext';
import { useSearchParams } from 'react-router-dom';

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

const Dashboard = () => {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const urlQuery = searchParams.get('q') || '';
    const initialTab = searchParams.get('tab') || ''; // Changed 'all' to '' to match TABS structure for 'All'

    const [typeFilter, setTypeFilter] = useState(initialTab);
    const [currentAlbum, setCurrentAlbum] = useState(null);
    const [page, setPage] = useState(1);
    const [filterOptions, setFilterOptions] = useState({ cameras: [], locations: [], albums: [] });
    const [activeFilters, setActiveFilters] = useState({
        search: '',
        camera: '',
        location: '',
        startDate: '',
        endDate: '',
        dateMode: 'range' // range, single, month, year
    });
    const [stagedFilters, setStagedFilters] = useState({
        search: '',
        camera: '',
        location: '',
        startDate: '',
        endDate: '',
        dateMode: 'range'
    });
    const [showFilters, setShowFilters] = useState(false);

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
            const hasActiveFilters = filters.search || filters.camera || filters.location || filters.startDate || filters.endDate;

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
            } else {
                if (type && type !== 'albums') params.set('type', type);
                if (albumId) params.set('albumId', albumId);
                params.set('limit', 24);
            }

            const res = await api.get(`${endpoint}?${params}`);
            setMedia(res.data.data);
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

        if (q || camera || location || startDate || endDate) {
            const filtersFromUrl = {
                search: q,
                camera,
                location,
                startDate,
                endDate,
                dateMode: 'range'
            };
            setActiveFilters(filtersFromUrl);
            setStagedFilters(filtersFromUrl);
        }
    }, [searchParams]);

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
                    <button
                        onClick={() => {
                            setShowFilters(!showFilters);
                            if (!showFilters) setStagedFilters(activeFilters);
                        }}
                        className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm border ${showFilters ? 'bg-primary border-primary text-textMain' : 'bg-white border-borderColor/50 text-textSecondary hover:border-primary/30'}`}
                    >
                        <Filter className={`w-4 h-4 ${showFilters ? 'animate-pulse' : ''}`} />
                        <span>Filters</span>
                        {Object.values(activeFilters).some(v => v) && (
                            <span className="w-2 h-2 rounded-full bg-accent animate-bounce" />
                        )}
                    </button>

                    {typeFilter === 'albums' && !currentAlbum && (
                        <button
                            onClick={handleCreateAlbum}
                            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-textMain bg-primary hover:bg-secondary transition-all shadow-xl shadow-primary/20 group"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                            <span>New Collection</span>
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Advanced Filter Bar */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <div className="bg-white border border-borderColor/50 rounded-[24px] p-6 shadow-sm flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-widest text-textSecondary flex items-center gap-2">
                                    <Layers className="w-3 h-3" /> Refining Search
                                </h3>
                                {(activeFilters.search || activeFilters.camera || activeFilters.location || activeFilters.startDate || activeFilters.endDate ||
                                    stagedFilters.search || stagedFilters.camera || stagedFilters.location || stagedFilters.startDate || stagedFilters.endDate) && (
                                        <button
                                            onClick={() => {
                                                const cleared = { search: '', camera: '', location: '', startDate: '', endDate: '', dateMode: 'range' };
                                                setStagedFilters(cleared);
                                                setActiveFilters(cleared);
                                                setSearchParams({});
                                            }}
                                            className="text-[10px] font-bold text-accent px-3 py-1.5 rounded-full bg-accent/10 hover:bg-accent hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-all duration-200 active:scale-95 shadow-sm"
                                        >
                                            <RefreshCw className="w-3 h-3" /> Reset all filters
                                        </button>
                                    )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Keyword Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                        <Search className="w-3 h-3" /> Keyword
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. flower, birthday..."
                                        value={stagedFilters.search}
                                        onChange={(e) => setStagedFilters(prev => ({ ...prev, search: e.target.value }))}
                                        className="w-full bg-bg border border-borderColor/50 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                                {/* Camera Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                        <Camera className="w-3 h-3" /> Camera Model
                                    </label>
                                    <select
                                        value={stagedFilters.camera}
                                        onChange={(e) => setStagedFilters(prev => ({ ...prev, camera: e.target.value }))}
                                        className="w-full bg-bg border border-borderColor/50 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
                                    >
                                        <option value="">Any Camera</option>
                                        {filterOptions.cameras && filterOptions.cameras.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Location Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                        <MapPin className="w-3 h-3" /> Location
                                    </label>
                                    <select
                                        value={stagedFilters.location}
                                        onChange={(e) => setStagedFilters(prev => ({ ...prev, location: e.target.value }))}
                                        className="w-full bg-bg border border-borderColor/50 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
                                    >
                                        <option value="">Any Location</option>
                                        {filterOptions.locations && filterOptions.locations.map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date Mode & Primary Date Input */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                        <Calendar className="w-3 h-3" /> Date Mode
                                    </label>
                                    <div className="flex bg-bg border border-borderColor/50 rounded-xl p-1 overflow-hidden">
                                        {['range', 'single', 'month', 'year'].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setStagedFilters(prev => ({ ...prev, dateMode: mode }))}
                                                className={`flex-1 py-2 text-[8px] font-black uppercase tracking-tighter rounded-lg transition-all ${stagedFilters.dateMode === mode ? 'bg-primary text-textMain shadow-sm' : 'text-textSecondary hover:bg-white'
                                                    }`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {stagedFilters.dateMode === 'range' && (
                                        <>
                                            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                Start / End
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    value={stagedFilters.startDate}
                                                    onChange={(e) => setStagedFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                                    className="w-1/2 bg-bg border border-borderColor/50 rounded-xl px-2 py-3 text-[11px] font-medium outline-none transition-all"
                                                />
                                                <input
                                                    type="date"
                                                    value={stagedFilters.endDate}
                                                    onChange={(e) => setStagedFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                                    className="w-1/2 bg-bg border border-borderColor/50 rounded-xl px-2 py-3 text-[11px] font-medium outline-none transition-all"
                                                />
                                            </div>
                                        </>
                                    )}
                                    {stagedFilters.dateMode === 'single' && (
                                        <>
                                            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                Select Date
                                            </label>
                                            <input
                                                type="date"
                                                value={stagedFilters.startDate}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setStagedFilters(prev => ({ ...prev, startDate: val, endDate: val }));
                                                }}
                                                className="w-full bg-bg border border-borderColor/50 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all"
                                            />
                                        </>
                                    )}
                                    {stagedFilters.dateMode === 'month' && (
                                        <>
                                            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                Select Month
                                            </label>
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
                                                    className="w-2/3 bg-bg border border-borderColor/50 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all appearance-none"
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
                                                    className="w-1/3 bg-bg border border-borderColor/50 rounded-xl px-2 py-3 text-sm font-medium outline-none transition-all appearance-none"
                                                >
                                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                        </>
                                    )}
                                    {stagedFilters.dateMode === 'year' && (
                                        <>
                                            <label className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                Select Year
                                            </label>
                                            <select
                                                value={stagedFilters.startDate ? new Date(stagedFilters.startDate).getFullYear() : YEARS[0]}
                                                onChange={(e) => {
                                                    const y = e.target.value;
                                                    setStagedFilters(prev => ({
                                                        ...prev,
                                                        startDate: `${y}-01-01`,
                                                        endDate: `${y}-12-31`
                                                    }));
                                                }}
                                                className="w-full bg-bg border border-borderColor/50 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all appearance-none"
                                            >
                                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Apply Button */}
                            <div className="flex items-end pb-1">
                                <button
                                    onClick={() => handleFilterApply(stagedFilters)}
                                    className="w-full bg-primary hover:bg-secondary text-textMain font-black uppercase tracking-[0.2em] text-[10px] py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    Apply Search
                                </button>
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
