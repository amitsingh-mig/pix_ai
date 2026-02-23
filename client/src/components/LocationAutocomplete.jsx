import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X, Search } from 'lucide-react';

const LocationAutocomplete = ({ onSelect, defaultValue = '' }) => {
    const [query, setQuery] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (!query.trim() || query.length < 3) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(() => {
            fetchSuggestions(query);
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const fetchSuggestions = async (searchQuery) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
                {
                    signal: abortControllerRef.current.signal,
                    headers: { 'User-Agent': 'AI-Media-Management-System' }
                }
            );
            const data = await response.json();
            setSuggestions(data);
            setIsOpen(true);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Location search error:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item) => {
        const locationData = {
            placeName: item.name || item.display_name.split(',')[0],
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            city: item.address.city || item.address.town || item.address.village || item.address.suburb || '',
            country: item.address.country || ''
        };

        setQuery(item.display_name);
        setSuggestions([]);
        setIsOpen(false);
        onSelect(locationData);
    };

    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
        setIsOpen(false);
        onSelect(null);
    };

    return (
        <div id="location-search" className="relative w-full" ref={dropdownRef}>
            <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary/50" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder="Search location (e.g. London, Tokyo...)"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-bg border border-borderColor focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                    {query && (
                        <button
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 rounded-full text-textSecondary/50 hover:text-danger transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-[110] w-full mt-2 bg-white border border-borderColor rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-1">
                    <div className="max-h-60 overflow-y-auto scrollbar-hide py-1">
                        {suggestions.map((item, index) => (
                            <button
                                key={item.place_id || index}
                                onClick={() => handleSelect(item)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors group"
                            >
                                <div className="mt-0.5 w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0">
                                    <Search className="w-3 h-3" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-textMain truncate mb-0.5">
                                        {item.name || item.display_name.split(',')[0]}
                                    </p>
                                    <p className="text-[10px] text-textSecondary truncate">
                                        {item.display_name}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationAutocomplete;
