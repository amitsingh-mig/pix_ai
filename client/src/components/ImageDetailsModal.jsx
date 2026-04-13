import React, { useState, useEffect } from 'react';
import Lottie from "lottie-react";
import api from '../services/api';
import AICaptionPanel from './AICaptionPanel';
import {
    X, Calendar, HardDrive, FileType, User, Tag, Folder,
    PlusCircle, MapPin, Watch, Maximize, Download, Trash2,
    Move, Edit3, Share2, Info, Camera, Aperture, Command, Cpu, Sparkles,
    Copy, Check, Clock, Scaling, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import imageInfoAnimation from "../assets/lottie/image-info.json";

const ImageDetailsModal = ({ image, user, onClose, onUpdate, onDelete, onFilter, albums = [], filterOptions = { cameras: [], locations: [] } }) => {
    const [activeTab, setActiveTab] = useState('info');
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
                        {/* Tab Headers */}
                        <div className="flex bg-white border-b border-borderColor px-2 py-2">
                            {[
                                { id: 'info', icon: Info, label: 'Info' },
                                { id: 'ai', icon: Sparkles, label: 'AI' },
                                { id: 'ocr', icon: Edit3, label: 'Text' },
                                { id: 'map', icon: MapPin, label: 'Map' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ${
                                        activeTab === tab.id 
                                            ? 'bg-primary/10 text-primary' 
                                            : 'text-textSecondary hover:bg-gray-50'
                                    }`}
                                >
                                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
                        >
                            {/* TAB 1: INFO */}
                            {activeTab === 'info' && (
                                <>
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-borderColor">
                                                <FileType className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-[18px] font-black text-textMain leading-tight truncate uppercase tracking-tight">{image.title}</h2>
                                                <div className="flex items-center gap-1.5 mt-1 text-textSecondary uppercase tracking-widest text-[9px] font-bold">
                                                    <Folder className="w-3 h-3 text-secondary" />
                                                    <span>{image.album?.name || 'Ungrouped'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-borderColor/40 space-y-5">
                                            <div className="flex items-center gap-4">
                                                <Calendar className="w-4 h-4 text-primary" />
                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-textSecondary tracking-[0.2em] mb-0.5">Captured</p>
                                                    <p className="text-sm font-bold text-textMain">{formatDate(image.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <HardDrive className="w-4 h-4 text-secondary" />
                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-textSecondary tracking-[0.2em] mb-0.5">Disk Space</p>
                                                    <p className="text-sm font-bold text-textMain">{formatSize(image.metadata?.size)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Scaling className="w-4 h-4 text-accent" />
                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-textSecondary tracking-[0.2em] mb-0.5">Resolution</p>
                                                    <p className="text-sm font-bold text-textMain">{image.metadata?.resolution || 'Original'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tags Section */}
                                        <div className="space-y-4">
                                            <p className="text-[10px] uppercase font-black text-textSecondary tracking-[0.2em] pl-2">Social Tags</p>
                                            <div className="flex flex-wrap gap-2">
                                                {image.tags?.map((tag, i) => (
                                                    <span 
                                                        key={i} 
                                                        onClick={() => onFilter && onFilter({ search: tag })}
                                                        className="group relative px-4 py-2 bg-white rounded-full text-[11px] font-bold text-textMain border border-borderColor hover:border-primary/50 transition-all cursor-pointer"
                                                    >
                                                        #{tag}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
                                                            className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px]"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={tagInput}
                                                        onChange={(e) => setTagInput(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                                        placeholder="Add tag..."
                                                        className="w-24 px-3 py-2 bg-transparent border-b border-borderColor text-[11px] font-bold outline-none focus:border-primary"
                                                    />
                                                    <button 
                                                        onClick={handleAddTag}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-textMain shadow-lg hover:scale-110 active:scale-90 transition-all"
                                                    >
                                                        <PlusCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* TAB 2: AI INSIGHTS */}
                            {activeTab === 'ai' && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
                                        <Sparkles className="w-12 h-12 absolute -top-2 -right-2 opacity-20 group-hover:scale-125 transition-transform duration-700" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-4 opacity-70">AI Photography Analysis</p>
                                        <p className="text-sm font-medium leading-relaxed italic">
                                            "{image.metadata?.photographyInsight || image.metadata?.exif?.photographyInsight || "Analysis in progress..."}"
                                        </p>
                                    </div>

                                    {/* AI Metadata Overview */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="p-5 bg-white rounded-[2rem] border border-borderColor/40 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Camera className="w-4 h-4 text-primary" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-textSecondary">Equipment Data</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-textSecondary">Model</span>
                                                    <span className="text-xs font-black uppercase">{image.camera?.model || 'Generic Camera'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-textSecondary">Aperture</span>
                                                    <span className="text-xs font-black uppercase">{image.metadata?.exif?.aperture || 'f/unknown'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-textSecondary">Exposure</span>
                                                    <span className="text-xs font-black uppercase">{image.metadata?.exif?.shutterSpeed || 'unknown'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI Face Recognition */}
                                        {image.metadata?.people?.length > 0 && (
                                            <div className="p-5 bg-white rounded-[2rem] border border-borderColor/40 shadow-sm">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Users className="w-4 h-4 text-accent" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-textSecondary">Identified People</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {image.metadata.people.map((p, i) => (
                                                        <span key={i} className="px-3 py-1 bg-accent/5 text-accent text-[10px] font-black rounded-full uppercase border border-accent/10">
                                                            {p.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* AI Captions */}
                                    <AICaptionPanel
                                        image={image}
                                        onCaptionsUpdate={(captionData) => onUpdate && onUpdate({ ...image, aiCaptions: captionData })}
                                    />
                                </div>
                            )}

                            {/* TAB 3: OCR TEXT */}
                            {activeTab === 'ocr' && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-white rounded-[2.5rem] border border-borderColor/50 shadow-sm">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Command className="w-5 h-5 text-primary" />
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-widest">Text Discovery</h3>
                                                <p className="text-[9px] text-textSecondary font-bold uppercase mt-0.5">OCR Engine Activated</p>
                                            </div>
                                        </div>

                                        {image.text && image.text.length > 0 ? (
                                            <div className="space-y-4">
                                                {image.text.map((line, i) => (
                                                    <div key={i} className="group relative">
                                                        <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-primary/20 group-hover:bg-primary transition-colors" />
                                                        <p className="text-sm font-medium text-textMain lowercase tracking-tight pl-2">
                                                            {line}
                                                        </p>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => navigator.clipboard.writeText(image.text.join('\n'))}
                                                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    <Copy className="w-3.5 h-3.5" /> Copy All Text
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="py-20 text-center opacity-30">
                                                <Edit3 className="w-12 h-12 mx-auto mb-4" />
                                                <p className="text-xs font-bold uppercase tracking-widest">No text detected</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: MAP */}
                            {activeTab === 'map' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-[2.5rem] overflow-hidden border border-borderColor/50 shadow-sm">
                                        <div className="h-64 relative bg-gray-100">
                                            {(image.location?.latitude || image.metadata?.location?.lat) && (image.location?.longitude || image.metadata?.location?.lng) ? (
                                                <iframe
                                                    title="Location Map"
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    scrolling="no"
                                                    marginHeight="0"
                                                    marginWidth="0"
                                                    src={`https://maps.google.com/maps?q=${image.location?.latitude || image.metadata.location.lat},${image.location?.longitude || image.metadata.location.lng}&hl=en&z=14&output=embed`}
                                                    className="grayscale-[0.1] contrast-[1.1]"
                                                ></iframe>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center">
                                                    <MapPin className="w-12 h-12 text-gray-200" />
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">No GPS Data</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase text-textSecondary tracking-[0.2em] mb-1">Location Details</p>
                                                    <h3 className="text-sm font-bold text-textMain uppercase tracking-tight leading-tight">
                                                        {image.location?.name || image.metadata?.location?.placeName || 'Unknown Location'}
                                                    </h3>
                                                    <p className="text-[11px] text-textSecondary mt-1 font-medium italic">
                                                        {image.location?.address || image.metadata?.location?.address || 'Geolocation missing address details.'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${image.location?.latitude || image.metadata.location.lat},${image.location?.longitude || image.metadata.location.lng}`)}
                                                className="w-full py-3.5 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:scale-95 transition-all"
                                            >
                                                Open in Google Maps
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Bottom Actions */}
                        <div className="p-6 bg-white border-t border-borderColor grid grid-cols-2 gap-3">
                            <button onClick={handleDownload} className="btn-primary">Download</button>
                            <button onClick={handleDelete} className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-danger hover:bg-red-50 border border-borderColor transition-all">Delete</button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageDetailsModal;
