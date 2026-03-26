import React, { useState, useEffect } from 'react';
import Lottie from "lottie-react";
import api from '../services/api';
import {
    X, Calendar, HardDrive, FileType, User, Tag, Folder,
    PlusCircle, MapPin, Watch, Maximize, Download, Trash2,
    Move, Edit3, Share2, Info, Camera, Aperture, Command, Cpu, Sparkles,
    Copy, Check, Clock, Scaling, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import imageInfoAnimation from "../assets/lottie/image-info.json";

const ImageDetailsModal = ({ image, user, onClose, onUpdate, onDelete, onFilter, albums = [], filterOptions = { cameras: [], locations: [] } }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [editingField, setEditingField] = useState(null); // 'camera', 'location', 'title'
    const [editValue, setEditValue] = useState('');
    const [showExif, setShowExif] = useState(true);

    if (!image) return null;

    const handleAlbumChange = async (e) => {
        const albumId = e.target.value;
        setIsUpdating(true);
        try {
            await api.put(`/media/${image._id}/album`, { albumId });
            if (onUpdate) {
                const updatedMedia = {
                    ...image,
                    album: albumId ? albums.find(a => a._id === albumId) : null
                };
                onUpdate(updatedMedia);
            }
        } catch (err) {
            alert('Failed to update album');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddTag = async (e) => {
        if (e) e.preventDefault();
        const tag = tagInput.trim().toLowerCase();
        if (!tag) return;

        // Prevent duplicate local tags
        if (image.tags?.includes(tag)) {
            setTagInput('');
            return;
        }

        const newTags = [...(image.tags || []), tag];
        setIsUpdating(true);

        try {
            const res = await api.put(`/media/${image._id}/tags`, { tags: newTags });
            if (onUpdate) {
                onUpdate(res.data.data);
            }
            setTagInput('');
        } catch (err) {
            alert('Failed to update tags');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveTag = async (tagToRemove) => {
        const newTags = image.tags.filter(t => t !== tagToRemove);
        setIsUpdating(true);

        try {
            const res = await api.put(`/media/${image._id}/tags`, { tags: newTags });
            if (onUpdate) {
                onUpdate(res.data.data);
            }
        } catch (err) {
            alert('Failed to remove tag');
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleFieldUpdate = async (field, value) => {
        setIsUpdating(true);
        try {
            const body = {};
            if (field === 'camera') body.camera = { model: value };
            if (field === 'location') body.location = { name: value };
            if (field === 'title') body.title = value;

            const res = await api.put(`/media/${image._id}`, body);
            if (onUpdate) onUpdate(res.data.data);
            setEditingField(null);
        } catch (err) {
            alert('Failed to update metadata');
        } finally {
            setIsUpdating(false);
        }
    };

    const MetadataListEditor = ({ field, icon: Icon, label, value, options }) => {
        const isEditing = editingField === field;

        if (isEditing) {
            return (
                <div className="flex flex-col gap-2 w-full p-2 bg-primary/5 rounded-xl border border-primary/20">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest">{label}</label>
                    <div className="flex gap-2">
                        <input
                            list={`${field}-list`}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleFieldUpdate(field, editValue);
                                if (e.key === 'Escape') setEditingField(null);
                            }}
                            autoFocus
                            className="flex-1 bg-white border border-borderColor rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                        />
                        <datalist id={`${field}-list`}>
                            {options.map(opt => <option key={opt} value={opt} />)}
                        </datalist>
                        <button
                            onClick={() => handleFieldUpdate(field, editValue)}
                            className="p-1.5 bg-primary text-textMain rounded-lg hover:bg-secondary transition-colors"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-between group/edit">
                <div
                    className="hover:bg-gray-50 p-2 -m-2 rounded-lg cursor-pointer transition-colors group/item flex-1"
                    onClick={() => {
                        if (field === 'camera' || field === 'location') {
                            onFilter && onFilter({ [field]: value });
                        }
                    }}
                >
                    <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest leading-none mb-1 group-hover/item:text-primary">{label}</p>
                    <div className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-gray-300 group-hover/item:text-primary/50" />
                        <h3 className="text-sm font-bold text-textMain leading-tight group-hover/item:text-primary truncate">
                            {value || `Set ${label}`}
                        </h3>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setEditingField(field);
                        setEditValue(value || '');
                    }}
                    className="opacity-0 group-hover/edit:opacity-100 p-1.5 text-textSecondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                    title={`Edit ${label}`}
                >
                    <Edit3 className="w-3 h-3" />
                </button>
            </div>
        );
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = image.highResUrl || image.url;
        link.download = image.title || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyMetadata = () => {
        const meta = {
            Title: image.title,
            Camera: image.camera?.model || image.metadata?.exif?.camera || 'N/A',
            Lens: image.metadata?.exif?.lens || 'N/A',
            ISO: image.metadata?.exif?.iso || 'N/A',
            Aperture: image.metadata?.exif?.aperture || 'N/A',
            ShutterSpeed: image.metadata?.exif?.shutterSpeed || 'N/A',
            FocalLength: image.metadata?.exif?.focalLength || 'N/A',
            Resolution: image.metadata?.resolution || 'N/A',
            Size: formatSize(image.metadata?.size),
            Date: formatDate(image.metadata?.exif?.captureDate || image.createdAt)
        };
        const text = Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join('\n');
        navigator.clipboard.writeText(text);
        alert('Metadata copied to clipboard!');
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this media?')) {
            try {
                await api.delete(`/media/${image._id}`);
                if (onDelete) {
                    onDelete(image._id);
                } else {
                    onClose();
                }
            } catch (err) {
                alert('Failed to delete media');
            }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-black/95 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-bg w-full max-w-7xl h-full md:h-[90vh] overflow-hidden md:rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col md:flex-row"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-[110] w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white md:text-textSecondary md:bg-white md:hover:bg-gray-100 backdrop-blur-md transition-all shadow-lg border border-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Left Side: Modern Image Viewer (70%) */}
                    <div className="w-full md:w-[70%] bg-[#0A0C10] flex items-center justify-center relative overflow-hidden group">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-full h-full p-4 md:p-12 flex items-center justify-center"
                        >
                            {image.type === 'image' ? (
                                <img
                                    src={image.lowResUrl || image.thumbnailUrl || image.url}
                                    alt={image.title}
                                    className="max-w-full max-h-full object-contain shadow-[0_30px_60px_rgba(0,0,0,0.5)] rounded-sm"
                                    loading="lazy"
                                />
                            ) : (
                                <video
                                    src={image.url}
                                    controls
                                    className="max-w-full max-h-full object-contain shadow-[0_30px_60px_rgba(0,0,0,0.5)] rounded-sm"
                                />
                            )}
                        </motion.div>

                        {/* Image Overlay/Actions */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full text-xs font-semibold border border-white/10 transition-all hover:scale-105 active:scale-95">
                                <Download className="w-3.5 h-3.5" /> Full Resolution
                            </button>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full text-xs font-semibold border border-white/10 transition-all hover:scale-105 active:scale-95">
                                <Share2 className="w-3.5 h-3.5" /> Share
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Details Panel (30%) */}
                    <div className="w-full md:w-[30%] h-full bg-bg flex flex-col border-l border-borderColor">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
                        >

                            {/* SECTION 1 — Header */}
                            <motion.div variants={itemVariants} className="flex items-start gap-4 mb-2">
                                <div className="p-3 bg-white rounded-xl shadow-sm border border-borderColor">
                                    {image.type === 'image' ? <FileType className="w-6 h-6 text-primary" /> : <Watch className="w-6 h-6 text-primary" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-[20px] font-semibold text-textMain leading-tight truncate">{image.title}</h2>
                                    <div className="flex items-center gap-1.5 mt-1 text-textSecondary uppercase tracking-widest text-[10px] font-bold">
                                        <Folder className="w-3 h-3 text-secondary" />
                                        <span>{image.album?.name || 'Ungrouped'}</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* SECTION 2 — Basic Info Card */}
                            <motion.div
                                variants={itemVariants}
                                className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-borderColor flex flex-col gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest leading-none mb-1">Upload Date</p>
                                        <p className="text-sm font-semibold text-textMain">{formatDate(image.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
                                        <HardDrive className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest leading-none mb-1">File Size</p>
                                        <p className="text-sm font-semibold text-textMain">{formatSize(image.metadata?.size)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500">
                                        <FileType className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest leading-none mb-1">Format</p>
                                        <p className="text-sm font-semibold text-textMain uppercase">{image.metadata?.mimetype?.split('/')[1] || image.type}</p>
                                    </div>
                                </div>
                                {image.type === 'video' && (
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                            <Watch className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest leading-none mb-1">Duration</p>
                                            <p className="text-sm font-semibold text-textMain">{formatDuration(image.metadata?.duration)}</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* SECTION 3 — Location Card */}
                            {image.metadata?.location && (
                                <motion.div
                                    variants={itemVariants}
                                    className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-borderColor hover:border-secondary/20 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-accent">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <MetadataListEditor
                                                    field="location"
                                                    icon={MapPin}
                                                    label="Location"
                                                    value={image.location?.name || image.metadata?.location?.placeName || image.metadata?.location?.city}
                                                    options={filterOptions.locations}
                                                />
                                            </div>
                                        </div>
                                        {(image.location?.latitude || image.metadata?.location?.lat) && (image.location?.longitude || image.metadata?.location?.lng) && (
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${image.location?.latitude || image.metadata.location.lat},${image.location?.longitude || image.metadata.location.lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-textSecondary hover:text-primary transition-colors"
                                                title="Open in Google Maps"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                    <div className="relative h-40 bg-gray-50 rounded-lg overflow-hidden border border-borderColor mb-3">
                                        {(image.location?.latitude || image.metadata?.location?.lat) && (image.location?.longitude || image.metadata?.location?.lng) ? (
                                            <iframe
                                                title="Location Map"
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                scrolling="no"
                                                marginHeight="0"
                                                marginWidth="0"
                                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${(image.location?.longitude || image.metadata.location.lng) - 0.01}%2C${(image.location?.latitude || image.metadata.location.lat) - 0.01}%2C${(image.location?.longitude || image.metadata.location.lng) + 0.01}%2C${(image.location?.latitude || image.metadata.location.lat) + 0.01}&layer=mapnik&marker=${image.location?.latitude || image.metadata.location.lat}%2C${image.location?.longitude || image.metadata.location.lng}`}
                                                className="grayscale-[0.2] contrast-[1.1]"
                                            ></iframe>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center">
                                                <MapPin className="w-6 h-6 text-gray-200" />
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-2">Map Preview Unavailable</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-textSecondary leading-relaxed italic">
                                        {image.location?.address || image.metadata?.location?.address || [image.metadata?.location?.city, image.metadata?.location?.country].filter(Boolean).join(', ')}
                                    </p>
                                </motion.div>
                            )}

                            {/* SECTION 4 — Camera Info Card (Enhanced) */}
                            {image.type === 'image' && (
                                <motion.div
                                    variants={itemVariants}
                                    className="bg-white rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-borderColor transition-all duration-300"
                                >
                                    {/* Handle Header with Toggle */}
                                    <div 
                                        onClick={() => setShowExif(!showExif)}
                                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <Camera className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-black text-textSecondary tracking-widest leading-none mb-1">Camera Details</p>
                                                <p className="text-xs font-bold text-textMain">
                                                    {image.camera?.model || image.metadata?.exif?.model || image.metadata?.exif?.camera || image.device || 'Unknown Device'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {image.metadata?.exif?.isAIEstimated && (
                                                <span className="px-2 py-0.5 bg-violet-50 text-violet-500 text-[8px] font-black rounded-full uppercase tracking-tighter border border-violet-100">AI Est.</span>
                                            )}
                                            <button className={`p-1.5 rounded-lg transition-transform duration-300 ${showExif ? 'rotate-180 bg-primary/10 text-primary' : 'bg-gray-50 text-textSecondary'}`}>
                                                <Move className="w-3.5 h-3.5 rotate-90" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expandable Content */}
                                    <AnimatePresence>
                                        {showExif && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="border-t border-borderColor"
                                            >
                                                {!image.metadata?.exif && (
                                                    <div className="p-8 text-center bg-gray-50/50">
                                                        <Info className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                                                        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase italic">Metadata not available in this image</p>
                                                    </div>
                                                )}
                                                {image.metadata?.exif && (
                                                <div className="p-5 space-y-5">
                                                    {/* AI Photography Insight */}
                                                    {(image.metadata?.photographyInsight || image.metadata?.exif?.photographyInsight) && (
                                                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 relative group/insight">
                                                            <div className="flex items-start gap-3">
                                                                <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                                                                <div>
                                                                    <p className="text-[9px] font-black uppercase text-textSecondary tracking-widest mb-1 group-hover/insight:text-primary transition-colors">AI Photography Insight</p>
                                                                    <p className="text-xs font-semibold text-textMain leading-relaxed italic">
                                                                        "{image.metadata?.photographyInsight || image.metadata?.exif?.photographyInsight}"
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Metadata Grid */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">Lens</p>
                                                            <div className="flex items-center gap-2">
                                                                <Scaling className="w-3.5 h-3.5 text-gray-300" />
                                                                <p className="text-xs font-bold text-textMain truncate">{image.metadata?.exif?.lens || 'Not Available'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">Aperture</p>
                                                            <div className="flex items-center gap-2">
                                                                <Aperture className="w-3.5 h-3.5 text-gray-300" />
                                                                <p className="text-xs font-bold text-textMain">{image.metadata?.exif?.aperture || 'Not Available'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">ISO</p>
                                                            <div className="flex items-center gap-2">
                                                                <Info className="w-3.5 h-3.5 text-gray-300" />
                                                                <p className="text-xs font-bold text-textMain">{image.metadata?.exif?.iso || 'Not Available'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">Shutter</p>
                                                            <div className="flex items-center gap-2">
                                                                <Watch className="w-3.5 h-3.5 text-gray-300" />
                                                                <p className="text-xs font-bold text-textMain">{image.metadata?.exif?.shutterSpeed || 'Not Available'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">Focal Length</p>
                                                            <div className="flex items-center gap-2">
                                                                <Eye className="w-3.5 h-3.5 text-gray-300" />
                                                                <p className="text-xs font-bold text-textMain">{image.metadata?.exif?.focalLength || 'Not Available'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">Dimensions</p>
                                                            <div className="flex items-center gap-2">
                                                                <Maximize className="w-3.5 h-3.5 text-gray-300" />
                                                                <p className="text-xs font-bold text-textMain">{image.metadata?.resolution || 'Not Available'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1 col-span-2 pt-2 border-t border-gray-50">
                                                            <p className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">Captured On</p>
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                                                <p className="text-xs font-bold text-textMain">
                                                                    {image.metadata?.exif?.captureDate ? formatDate(image.metadata.exif.captureDate) : 'Not Available'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Copy Button */}
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleCopyMetadata(); }}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 text-textSecondary hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-borderColor transition-all active:scale-[0.98]"
                                                    >
                                                        <Copy className="w-3 h-3" /> Copy Metadata
                                                    </button>
                                                </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {/* SECTION 5 — Uploaded By Card */}
                            <motion.div
                                variants={itemVariants}
                                className="bg-white rounded-xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-borderColor flex items-center justify-between group cursor-default"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-textMain font-bold text-sm shadow-md transition-transform group-hover:scale-105">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest leading-none mb-1">Uploader</p>
                                        <p className="text-sm font-bold text-textMain">{image.uploadedBy?.username || 'Owner'}</p>
                                    </div>
                                </div>
                                <div className="px-2 py-1 bg-gray-50 rounded text-[9px] font-black text-textSecondary uppercase tracking-widest">Verified User</div>
                            </motion.div>

                            {/* SECTION 6 — Tags Card */}
                            <motion.div
                                variants={itemVariants}
                                className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-borderColor"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-primary" />
                                        <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest">Tags</p>
                                        {/* AI badge if Rekognition was used */}
                                        {image.metadata?.aiTagSource?.includes('rekognition') && (
                                            <span
                                                title={`${image.metadata?.aiTagCount || 0} tags auto-generated by AWS Rekognition + OpenAI`}
                                                className="flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-600 text-[9px] font-black rounded-full uppercase tracking-wider border border-violet-200"
                                            >
                                                <Sparkles className="w-2.5 h-2.5" />
                                                AI • {image.metadata?.aiTagCount || 0} tags
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('highlightAI');
                                        }}
                                        className="text-[9px] font-black uppercase text-secondary hover:text-primary flex items-center gap-1 transition-colors tracking-widest"
                                    >
                                        <PlusCircle className="w-3 h-3" /> AI Suggest
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {image.tags?.length > 0 ? image.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1.5 rounded-full bg-gray-50 text-textMain text-[11px] font-bold border border-borderColor hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group/tag relative"
                                            onClick={() => onFilter && onFilter({ search: tag })}
                                            title="Click to search this tag"
                                        >
                                            #{tag}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
                                                className="w-2.5 h-2.5 absolute -top-1 -right-1 bg-danger text-white rounded-full opacity-0 group-hover/tag:opacity-100 transition-opacity flex items-center justify-center hover:scale-110"
                                            >
                                                <X className="w-2 h-2" />
                                            </button>
                                        </span>
                                    )) : (
                                        <p className="text-xs text-textSecondary italic">No tags associated.</p>
                                    )}
                                </div>

                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
                                        placeholder="Add custom tag..."
                                        disabled={isUpdating}
                                        className="w-full bg-gray-50 border border-borderColor rounded-lg px-3 py-2 text-xs focus:bg-white focus:border-primary outline-none transition-all pr-12 font-medium disabled:opacity-50"
                                    />
                                    <button
                                        onClick={handleAddTag}
                                        disabled={isUpdating || !tagInput.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md bg-white border border-borderColor text-primary opacity-0 group-focus-within:opacity-100 transition-opacity shadow-sm hover:bg-primary hover:text-white disabled:opacity-0"
                                    >
                                        <PlusCircle className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>

                            {/* Recognized Faces Card */}
                            {image.metadata?.people?.length > 0 && (
                                <motion.div
                                    variants={itemVariants}
                                    className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-borderColor"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <User className="w-4 h-4 text-accent" />
                                        <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest">Recognized Faces</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {image.metadata.people.map((person, i) => (
                                            <div key={i} className="px-3 py-2.5 bg-red-50/30 rounded-lg border border-red-50 flex items-center justify-between group hover:border-accent/30 transition-colors">
                                                <span className="text-[11px] font-bold text-accent truncate">{person.name}</span>
                                                <span className="text-[9px] font-black text-accent/50">{Math.round(person.confidence)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                        </motion.div>

                        {/* Bottom Action Section */}
                        <div className="p-6 border-t border-borderColor bg-white space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-secondary text-textMain font-bold text-xs rounded-xl shadow-[0_4px_12px_rgba(255,212,29,0.3)] transition-all active:scale-[0.98] hover:-translate-y-0.5"
                                >
                                    <Download className="w-4 h-4" /> Download
                                </button>
                                {user && (user.role === 'admin' || user.id === image.uploadedBy?._id || user.id === image.uploadedBy) && (
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center justify-center gap-2 py-3.5 bg-white hover:bg-red-50 text-red-500 font-bold text-xs rounded-xl border border-borderColor hover:border-red-200 transition-all active:scale-[0.98]"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Folder className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textSecondary" />
                                    <select
                                        value={image.album?._id || image.album || ''}
                                        onChange={handleAlbumChange}
                                        disabled={isUpdating}
                                        className="w-full py-3.5 pl-10 pr-4 bg-gray-50 border border-borderColor rounded-xl text-xs font-bold text-textMain focus:border-primary transition-all outline-none appearance-none cursor-pointer hover:bg-white"
                                    >
                                        <option value="">No Album (Ungrouped)</option>
                                        {albums.map(album => (
                                            <option key={album._id} value={album._id}>{album.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Move className="w-3.5 h-3.5 text-textSecondary" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageDetailsModal;
