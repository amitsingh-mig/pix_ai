import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, X, FileImage, Plus, FolderPlus, Loader2 } from 'lucide-react';

const Upload = () => {
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [selectedAlbum, setSelectedAlbum] = useState('');
    const [newAlbumName, setNewAlbumName] = useState('');
    const [showNewAlbumInput, setShowNewAlbumInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingAlbums, setFetchingAlbums] = useState(true);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchAlbums();
    }, []);

    const fetchAlbums = async () => {
        try {
            const res = await api.get('/albums');
            setAlbums(res.data.data);
            setFetchingAlbums(false);
        } catch (err) {
            console.error('Failed to fetch albums', err);
            setFetchingAlbums(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        // Limit to 10 files
        if (files.length + selectedFiles.length > 10) {
            setError('Maximum 10 files allowed per upload at once.');
            return;
        }

        setFiles(prev => [...prev, ...selectedFiles]);

        const newPreviews = selectedFiles.map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            url: URL.createObjectURL(f),
            type: f.type,
            name: f.name
        }));
        setPreviews(prev => [...prev, ...newPreviews]);
        setError('');
        setProgress(0);
    };

    const handleRemoveFile = (id, index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            const fileToRemove = prev.find(p => p.id === id);
            if (fileToRemove) URL.revokeObjectURL(fileToRemove.url);
            return prev.filter(p => p.id !== id);
        });
    };

    const handleCreateAlbum = async () => {
        if (!newAlbumName.trim()) return;
        try {
            const res = await api.post('/albums', { name: newAlbumName });
            setAlbums(prev => [res.data.data, ...prev]);
            setSelectedAlbum(res.data.data._id);
            setNewAlbumName('');
            setShowNewAlbumInput(false);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create album');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (files.length === 0) { setError('Please select at least one file'); return; }

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        if (selectedAlbum) {
            formData.append('albumId', selectedAlbum);
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (evt) => {
                    const pct = Math.round((evt.loaded * 100) / evt.total);
                    setProgress(pct);
                }
            });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-textMain">Upload Media</h1>
                <p className="text-sm text-textSecondary mt-1">Select multiple images or videos to upload at once.</p>
            </div>

            {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-danger text-sm">{error}</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Files & Upload */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="drop-zone min-h-[300px] flex flex-col bg-card/10 border-2 border-dashed border-borderColor rounded-2xl">
                        {previews.length > 0 ? (
                            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {previews.map((prev, idx) => (
                                    <div key={prev.id} className="relative group aspect-square rounded-xl overflow-hidden bg-bg border border-borderColor shadow-sm">
                                        <button type="button" onClick={() => handleRemoveFile(prev.id, idx)}
                                            className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-danger/90 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-3 h-3" />
                                        </button>
                                        {prev.type.startsWith('image/') ? (
                                            <img src={prev.url} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <video src={prev.url} className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-[10px] text-white truncate px-1">{prev.name}</p>
                                        </div>
                                    </div>
                                ))}
                                <label htmlFor="file-upload-more" className="aspect-square rounded-xl border-2 border-dashed border-borderColor hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-all bg-card/20 hover:bg-card/40">
                                    <Plus className="w-5 h-5 text-textSecondary" />
                                    <span className="text-[10px] font-bold text-textSecondary mt-1 uppercase tracking-wider">Add More</span>
                                    <input id="file-upload-more" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,video/*" multiple />
                                </label>
                            </div>
                        ) : (
                            <label htmlFor="file-upload" className="flex-1 flex flex-col items-center justify-center py-16 cursor-pointer group">
                                <div className="drop-zone__icon mb-4 group-hover:scale-110 transition-transform">
                                    <FileImage className="w-10 h-10 text-primary/60 group-hover:text-primary transition-colors" />
                                </div>
                                <p className="text-sm font-semibold text-textMain mb-1 text-center">
                                    <span className="text-primary font-bold">Select files</span> or drag and drop
                                </p>
                                <p className="text-xs text-textSecondary mt-1">Bulk upload up to 10 files at once</p>
                                <input id="file-upload" type="file" className="sr-only"
                                    onChange={handleFileChange} accept="image/*,video/*" multiple />
                            </label>
                        )}
                    </div>

                    {loading && (
                        <div>
                            <div className="h-2 w-full bg-borderColor/30 rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs font-semibold text-textSecondary">Uploading {files.length} items...</p>
                                <p className="text-xs font-bold text-primary">{progress}%</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Album Selection */}
                <div className="space-y-6">
                    <div className="bg-card border border-borderColor rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-borderColor/50">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FolderPlus className="w-4 h-4 text-primary" />
                            </div>
                            <h2 className="text-sm font-bold text-textMain tracking-tight">Album Options</h2>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2.5">Choose Destination</label>
                                {fetchingAlbums ? (
                                    <div className="flex items-center gap-2 text-xs text-textSecondary py-2">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                        <span>Syncing albums...</span>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedAlbum}
                                        onChange={(e) => setSelectedAlbum(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-bg border border-borderColor focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Ungrouped (Default)</option>
                                        {albums.map(album => (
                                            <option key={album._id} value={album._id}>{album.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="pt-2">
                                {!showNewAlbumInput ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowNewAlbumInput(true)}
                                        className="text-[11px] font-bold text-primary hover:text-accent transition-colors flex items-center gap-2 group"
                                    >
                                        <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                                        <span>Create New Album</span>
                                    </button>
                                ) : (
                                    <div className="space-y-3 p-4 rounded-xl bg-bg/50 border border-borderColor/30 animate-in fade-in slide-in-from-top-1">
                                        <input
                                            type="text"
                                            value={newAlbumName}
                                            onChange={(e) => setNewAlbumName(e.target.value)}
                                            placeholder="Enter name..."
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-borderColor focus:border-primary outline-none bg-card"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={handleCreateAlbum}
                                                className="flex-1 py-2 bg-primary text-textMain text-[10px] font-bold rounded-lg hover:bg-secondary transition-colors"
                                            >
                                                Create
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowNewAlbumInput(false)}
                                                className="px-3 py-2 border border-borderColor text-textSecondary text-[10px] font-bold rounded-lg hover:bg-card transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            disabled={loading || files.length === 0}
                            onClick={handleSubmit}
                            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-textMain bg-primary hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98] group"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <UploadIcon className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                            )}
                            <span>{loading ? `Uploading ${progress}%` : `Upload ${files.length} items`}</span>
                        </button>
                        <button type="button" onClick={() => navigate('/')}
                            className="w-full py-2.5 rounded-xl text-xs font-bold text-textSecondary hover:text-textMain transition-colors uppercase tracking-widest">
                            Cancel & Discard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Upload;
