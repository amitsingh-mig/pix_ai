import React, { useState, useEffect } from 'react';
import Lottie from "lottie-react";
import api from '../services/api';
import {
    X, Calendar, HardDrive, FileType, User, Tag, Folder,
    PlusCircle, MapPin, Watch, Maximize, Download, Trash2,
    Move, Edit3, Share2, Info, Camera, Aperture, Command, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import imageInfoAnimation from "../assets/lottie/image-info.json";

const ImageDetailsModal = ({ image, onClose, onUpdate, onDelete, albums = [] }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [tagInput, setTagInput] = useState('');


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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
        link.href = image.url;
        link.download = image.title || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                                    src={image.url}
                                    alt={image.title}
                                    className="max-w-full max-h-full object-contain shadow-[0_30px_60px_rgba(0,0,0,0.5)] rounded-sm"
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
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest leading-none mb-1">Location</p>
                                                <h3 className="text-sm font-bold text-textMain leading-tight">
                                                    {image.metadata.location.placeName || image.metadata.location.city || 'Exact Location'}
                                                </h3>
                                            </div>
                                        </div>
                                        {image.metadata.location.lat && image.metadata.location.lng && (
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${image.metadata.location.lat},${image.metadata.location.lng}`}
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
                                        {image.metadata.location.lat && image.metadata.location.lng ? (
                                            <iframe
                                                title="Location Map"
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                scrolling="no"
                                                marginHeight="0"
                                                marginWidth="0"
                                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${image.metadata.location.lng - 0.01}%2C${image.metadata.location.lat - 0.01}%2C${image.metadata.location.lng + 0.01}%2C${image.metadata.location.lat + 0.01}&layer=mapnik&marker=${image.metadata.location.lat}%2C${image.metadata.location.lng}`}
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
                                        {image.metadata.location.address || [image.metadata.location.city, image.metadata.location.country].filter(Boolean).join(', ')}
                                    </p>
                                </motion.div>
                            )}

                            {/* SECTION 4 — Camera Info Card */}
                            {image.metadata?.exif && (
                                <motion.div
                                    variants={itemVariants}
                                    className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-borderColor"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Camera className="w-4 h-4 text-primary" />
                                        <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest">Capture Details</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                                        <div>
                                            <p className="text-[10px] text-textSecondary font-medium mb-0.5">Camera</p>
                                            <p className="text-[11px] font-bold text-textMain truncate flex items-center gap-1.5">
                                                <Cpu className="w-3 h-3 text-gray-300" /> {image.metadata.exif.camera || 'Unknown Device'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-textSecondary font-medium mb-0.5">Lens</p>
                                            <p className="text-[11px] font-bold text-textMain truncate flex items-center gap-1.5">
                                                <Maximize className="w-3 h-3 text-gray-300" /> {image.metadata.exif.lens || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-textSecondary font-medium mb-0.5">ISO</p>
                                            <p className="text-[11px] font-bold text-textMain flex items-center gap-1.5">
                                                <Info className="w-3 h-3 text-gray-300" /> {image.metadata.exif.iso || '--'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-textSecondary font-medium mb-0.5">Aperture</p>
                                            <p className="text-[11px] font-bold text-textMain flex items-center gap-1.5">
                                                <Aperture className="w-3 h-3 text-gray-300" /> {image.metadata.exif.aperture || '--'}
                                            </p>
                                        </div>
                                        <div className="col-span-2 pt-3 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Watch className="w-3 h-3 text-gray-300" />
                                                <p className="text-[11px] font-bold text-textMain">{image.metadata.exif.shutterSpeed || 'N/A'}</p>
                                            </div>
                                            {image.metadata.resolution && (
                                                <div className="flex items-center gap-1.5">
                                                    <Maximize className="w-3 h-3 text-gray-300" />
                                                    <p className="text-[11px] font-bold text-textMain">{image.metadata.resolution}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
                                        <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest">Metadata Tags</p>
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
                                        <span key={i} className="px-3 py-1.5 rounded-full bg-gray-50 text-textMain text-[11px] font-bold border border-borderColor hover:border-primary hover:bg-white transition-all cursor-default">
                                            #{tag}
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
                                        placeholder="Add custom tag..."
                                        className="w-full bg-gray-50 border border-borderColor rounded-lg px-3 py-2 text-xs focus:bg-white focus:border-primary outline-none transition-all pr-12 font-medium"
                                    />
                                    <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md bg-white border border-borderColor text-primary opacity-0 group-focus-within:opacity-100 transition-opacity shadow-sm hover:bg-primary hover:text-white">
                                        <Edit3 className="w-3.5 h-3.5" />
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
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center justify-center gap-2 py-3.5 bg-white hover:bg-red-50 text-red-500 font-bold text-xs rounded-xl border border-borderColor hover:border-red-200 transition-all active:scale-[0.98]"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
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
