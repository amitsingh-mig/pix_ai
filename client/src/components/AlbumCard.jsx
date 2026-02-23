import React from 'react';
import { Folder, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';

const AlbumCard = ({ album, onOpen, onRename, onDelete }) => {
    return (
        <div
            className="group relative bg-white border border-borderColor/50 rounded-[2rem] overflow-hidden hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer"
            onClick={() => onOpen(album)}
        >
            {/* Album Icon/Thumbnail Area */}
            <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                <Folder className="w-20 h-20 text-primary/30 group-hover:text-primary/50 group-hover:scale-110 transition-all duration-500 relative z-10" />

                {/* Floating Item Count Badge */}
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/70 backdrop-blur-md rounded-full border border-white/50 shadow-sm z-20">
                    <ImageIcon className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-textMain">{album.mediaCount || 0} Items</span>
                </div>

                {/* Floating Quick Actions */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 z-30">
                    <button
                        title="Rename Album"
                        onClick={(e) => { e.stopPropagation(); onRename(album); }}
                        className="w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur shadow-lg rounded-xl text-secondary hover:bg-white hover:scale-110 transition-all border border-borderColor/20"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        title="Delete Album"
                        onClick={(e) => { e.stopPropagation(); onDelete(album); }}
                        className="w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur shadow-lg rounded-xl text-accent hover:bg-white hover:scale-110 transition-all border border-borderColor/20"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Info Area */}
            <div className="p-6 bg-white relative">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-grow">
                        <h3 className="text-base font-bold text-textMain truncate leading-tight group-hover:text-primary transition-colors">{album.name}</h3>
                        <p className="text-[10px] text-textSecondary uppercase tracking-[0.15em] mt-1.5 font-black opacity-60">
                            {album.description || 'Curated Collection'}
                        </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-bg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                    </div>
                </div>
            </div>

            {/* Hover overlay border */}
            <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/10 rounded-[2rem] transition-all duration-500 pointer-events-none" />
        </div>
    );
};

export default AlbumCard;
