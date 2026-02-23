import React from 'react';
import { ImageIcon, Video, Trash2, MapPin } from 'lucide-react';

const MediaCard = ({ item, user, onDelete, onClick }) => {
    return (
        <div className="media-card group relative cursor-pointer" onClick={() => onClick(item)}>
            {/* Thumbnail */}
            <div className="h-48 overflow-hidden bg-bg relative">
                {item.type === 'image' ? (
                    <img src={item.thumbnailUrl || item.url} alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <video src={item.url} preload="none" className="w-full h-full object-cover" />
                )}

                {/* Location badge */}
                {item.metadata?.location && (item.metadata.location.city || item.metadata.location.placeName || item.metadata.location.country) && (
                    <div className="media-card__location">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                            {item.metadata.location.placeName || item.metadata.location.city || ''}
                            {(item.metadata.location.placeName || item.metadata.location.city) && item.metadata.location.country ? ', ' : ''}
                            {item.metadata.location.country || ''}
                        </span>
                    </div>
                )}

                {/* Type badge */}
                <div className="absolute bottom-2 left-2 bg-white/90 text-textMain text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm font-medium">
                    {item.type === 'image'
                        ? <><ImageIcon className="w-3 h-3 text-accent" /> Image</>
                        : <><Video className="w-3 h-3 text-accent" /> Video</>}
                </div>

                {/* Delete */}
                {user && (user.role === 'admin' || user.id === item.uploadedBy?._id) && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(e, item._id); }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 btn-danger transition-all duration-200 shadow-sm"
                        title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-textMain truncate mb-0.5">{item.title}</h3>
                <p className="text-xs text-textSecondary mb-3">by {item.uploadedBy?.username}</p>
                <div className="flex flex-wrap gap-1">
                    {item.tags?.slice(0, 4).map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-textMain font-medium">{tag}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MediaCard;
