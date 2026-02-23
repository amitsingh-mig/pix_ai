import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

    const addAlbum = (album) => {
        setAlbums(prev => [album, ...prev]);
    };

    const updateAlbumState = (updatedAlbum) => {
        setAlbums(prev => prev.map(a => a._id === updatedAlbum._id ? updatedAlbum : a));
    };

    const removeAlbumState = (albumId) => {
        setAlbums(prev => prev.filter(a => a._id !== albumId));
    };

    const deleteAlbum = async (albumId) => {
        try {
            await api.delete(`/albums/${albumId}`);
            removeAlbumState(albumId);
            return { success: true };
        } catch (err) {
            console.error('Failed to delete album', err);
            throw err;
        }
    };

    const [navigationPath, setNavigationPath] = useState([]);

    const addToPath = useCallback((album) => {
        if (!album) return;
        setNavigationPath(prev => {
            // If already at the end, don't add
            if (prev.length > 0 && prev[prev.length - 1]._id === album._id) return prev;
            // Limit to last 5
            const newPath = [...prev, album];
            if (newPath.length > 5) return newPath.slice(1);
            return newPath;
        });
    }, []);

    const clearPath = () => setNavigationPath([]);

    const jumpToPath = (index) => {
        setNavigationPath(prev => prev.slice(0, index + 1));
    };

    return (
        <AlbumContext.Provider value={{
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
        }}>
            {children}
        </AlbumContext.Provider>
    );
};
