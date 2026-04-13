import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const AlbumContext = createContext();

export const useAlbums = () => {
    const context = useContext(AlbumContext);
    if (!context) {
        throw new Error('useAlbums must be used within an AlbumProvider');
    }
    return context;
};

export const AlbumProvider = ({ children }) => {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchAlbums = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.get('/albums');
            setAlbums(res.data.data);
        } catch (err) {
            console.error('Failed to fetch albums', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchAlbums();
        } else {
            setAlbums([]);
        }
    }, [user, fetchAlbums]);

    const addAlbum = useCallback((album) => {
        setAlbums(prev => [album, ...prev]);
    }, []);

    const updateAlbumState = useCallback((updatedAlbum) => {
        setAlbums(prev => prev.map(a => a._id === updatedAlbum._id ? updatedAlbum : a));
    }, []);

    const removeAlbumState = useCallback((albumId) => {
        setAlbums(prev => prev.filter(a => a._id !== albumId));
    }, []);

    const deleteAlbum = useCallback(async (albumId) => {
        try {
            await api.delete(`/albums/${albumId}`);
            removeAlbumState(albumId);
            return { success: true };
        } catch (err) {
            console.error('Failed to delete album', err);
            throw err;
        }
    }, [removeAlbumState]);

    const [navigationPath, setNavigationPath] = useState([]);

    const addToPath = useCallback((album) => {
        if (!album) return;
        setNavigationPath(prev => {
            if (prev.length > 0 && prev[prev.length - 1]._id === album._id) return prev;
            const newPath = [...prev, album];
            if (newPath.length > 5) return newPath.slice(1);
            return newPath;
        });
    }, []);

    const clearPath = useCallback(() => setNavigationPath([]), []);

    const jumpToPath = useCallback((index) => {
        setNavigationPath(prev => prev.slice(0, index + 1));
    }, []);

    const contextValue = useMemo(() => ({
        albums,
        loading,
        refreshAlbums: fetchAlbums,
        addAlbum,
        updateAlbumState,
        removeAlbumState,
        deleteAlbum,
        navigationPath,
        addToPath,
        clearPath,
        jumpToPath
    }), [albums, loading, fetchAlbums, addAlbum, updateAlbumState, removeAlbumState, deleteAlbum, navigationPath, addToPath, clearPath, jumpToPath]);

    return (
        <AlbumContext.Provider value={contextValue}>
            {children}
        </AlbumContext.Provider>
    );
};
