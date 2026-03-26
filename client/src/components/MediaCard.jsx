import React from 'react';
import { ImageIcon, Video, Trash2, MapPin, Sparkles } from 'lucide-react';

const MediaCard = ({ item, user, onDelete, onClick, onFilter }) => {
    const handleFilterClick = (e, filterType, value) => {
        e.stopPropagation();
        if (onFilter) onFilter({ [filterType]: value });
    };

    // Show max 5 tags in card; more visible in detail modal
    const visibleTags = item.tags?.slice(0, 5) || [];
    const hasAiTags = item.metadata?.aiTagSource?.includes('rekognition') || item.metadata?.aiTagCount > 0;

    return (
        <div className="media-card group relative cursor-pointer" onClick={() => onClick(item)}>
            {/* Thumbnail */}
            <div className="h-48 overflow-hidden bg-bg relative">
                {item.type === 'image' ? (
                    <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <video src={item.url} preload="none" className="w-full h-full object-cover" />
                )}

                {/* Gradient overlay for badges readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10 pointer-events-none" />

                {/* Floating Badges Container — top-left */}
                <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5 z-20 max-w-[calc(100%-44px)]">
                    {/* Album badge */}
                    {item.album && (
                        <div className="bg-black/50 backdrop-blur-md text-white/90 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-white/10 shadow-sm cursor-default whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                            {item.album}
                        </div>
                    )}

                    {/* Location badge */}
                    {(item.location?.name || item.metadata?.location) && (
                        <div
                            className="bg-white/85 backdrop-blur-md text-slate-900 border border-black/5 py-0.5 px-2 rounded-md shadow-sm flex items-center gap-1 cursor-pointer transition-all hover:bg-white active:scale-95 group/loc max-w-full"
                            onClick={(e) => handleFilterClick(e, 'location', item.location?.name || item.metadata?.location?.placeName || item.metadata?.location?.city)}
                        >
                            <MapPin className="w-3 h-3 text-red-500 flex-shrink-0 group-hover/loc:scale-110 transition-transform" />
                            <span className="text-[10px] font-semibold truncate">
                                {item.location?.name || item.metadata?.location?.placeName || item.metadata?.location?.city || 'Location'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Bottom-left: type badge + AI badge */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-20">
                    {/* Media type badge */}
                    <div className="bg-white/90 text-textMain text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm font-medium">
                        {item.type === 'image'
                            ? <><ImageIcon className="w-3 h-3 text-accent" /> Image</>
                            : <><Video className="w-3 h-3 text-accent" /> Video</>}
                    </div>

                    {/* AI-tagged badge — shown only if Rekognition or AI processed this item */}
                    {hasAiTags && (
                        <div
                            title={`AI-tagged: ${item.metadata?.aiTagCount || 0} auto-generated tags`}
                            className="bg-violet-500/90 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm font-bold uppercase tracking-wide cursor-default"
                        >
                            <Sparkles className="w-2.5 h-2.5" />
                            AI
                        </div>
                    )}
                </div>

                {/* Delete button */}
                {user && (user.role === 'admin' || user.id === item.uploadedBy?._id) && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(e, item._id); }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 btn-danger transition-all duration-200 shadow-sm z-20"
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Card Body */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-textMain truncate mb-0.5">{item.title}</h3>
                <p className="text-xs text-textSecondary mb-3">by {item.uploadedBy?.username}</p>

                {/* Tags */}
                {visibleTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {visibleTags.map((tag, i) => (
                            <span
                                key={i}
                                onClick={(e) => handleFilterClick(e, 'search', tag)}
                                className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-textMain font-black uppercase tracking-wider hover:bg-primary transition-all cursor-pointer select-none"
                                title={`Search for "${tag}"`}
                            >
                                #{tag}
                            </span>
                        ))}
                        {/* Overflow indicator */}
                        {(item.tags?.length || 0) > 5 && (
                            <span className="text-[10px] px-2 py-1 rounded-full bg-borderColor/40 text-textSecondary font-bold cursor-default">
                                +{item.tags.length - 5}
                            </span>
                        )}
                    </div>
                ) : (
                    <p className="text-[10px] text-textSecondary italic">No tags yet</p>
                )}
            </div>
        </div>
    );
};

export default MediaCard;
