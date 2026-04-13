import React from 'react';
import { ImageIcon, Video, Trash2, MapPin, Sparkles, Hash, Camera, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const MediaCard = ({ item, user, onDelete, onClick, onFilter }) => {
    const handleFilterClick = (e, filterType, value) => {
        e.stopPropagation();
        if (onFilter) onFilter({ [filterType]: value });
    };

    const hasAiTags = item.metadata?.aiTagSource?.includes('rekognition') || item.metadata?.aiTagCount > 0;
    const locationName = item.location?.name || item.metadata?.location?.placeName || item.metadata?.location?.city;

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            className="media-card" 
            onClick={() => onClick(item)}
        >
            {/* Visual Container */}
            <div className="aspect-[4/5] relative overflow-hidden">
                {item.type === 'image' ? (
                    <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full relative">
                        <video src={item.url} preload="none" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <Play className="w-5 h-5 text-white fill-white" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Overlays */}
                <div className="media-card-overlay">
                    <div className="space-y-2">
                        {/* Title & Meta */}
                        <div>
                            <h3 className="text-white text-sm font-black uppercase tracking-wider truncate mb-1">
                                {item.title}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-white/60 font-medium uppercase tracking-widest">
                                    by {item.uploadedBy?.username}
                                </span>
                            </div>
                        </div>

                        {/* Quick Info Bar */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                            {locationName && (
                                <div className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 text-primary" />
                                    <span className="text-[8px] text-white font-black uppercase tracking-tighter truncate max-w-[80px]">
                                        {locationName}
                                    </span>
                                </div>
                            )}
                            {item.camera?.model && (
                                <div className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-1">
                                    <Camera className="w-2.5 h-2.5 text-secondary" />
                                    <span className="text-[8px] text-white font-black uppercase tracking-tighter truncate max-w-[80px]">
                                        {item.camera.model}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Tags Preview */}
                        <div className="flex flex-wrap gap-1 pt-1 overflow-hidden h-5">
                            {item.tags?.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-[8px] text-primary font-black uppercase tracking-widest">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Badges (Constant Visibility) */}
                <div className="absolute top-4 left-4 flex gap-2 z-10">
                    {hasAiTags && (
                        <div className="w-6 h-6 rounded-lg bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg border border-white">
                            <Sparkles className="w-3 h-3 text-secondary animate-pulse" />
                        </div>
                    )}
                    {item.type === 'video' && (
                        <div className="w-6 h-6 rounded-lg bg-accent text-white flex items-center justify-center shadow-lg">
                            <Video className="w-3 h-3" />
                        </div>
                    )}
                </div>

                {/* Actions */}
                {user && (user.role === 'admin' || user.id === item.uploadedBy?._id) && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(e, item._id); }}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-danger hover:bg-danger hover:text-white transition-all shadow-xl z-20 scale-75 group-hover:scale-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            {/* Simple Bottom Info (Visible on Mobile/Default) */}
            <div className="p-4 md:group-hover:opacity-0 transition-opacity">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-textMain truncate">
                        {item.title}
                    </h3>
                    <div className="flex items-center gap-1 opacity-50">
                        <ImageIcon className="w-3 h-3" />
                        <span className="text-[9px] font-bold">RAW</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MediaCard;

