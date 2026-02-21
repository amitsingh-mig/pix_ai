import React from 'react';
import { Folder, MoreVertical, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';

const AlbumCard = ({ album, onOpen, onRename, onDelete }) => {
    return (
        <div
            className="group relative bg-bgSecondary border border-borderColor/50 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer"
            onClick={() => onOpen(album)}
        >
            <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <Folder className="w-16 h-16 text-primary/40 group-hover:scale-110 transition-transform duration-500" />
            </div>

            <div className="p-4 bg-bgSecondary/80 backdrop-blur-md">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-sm font-bold text-textMain truncate max-w-[150px]">{album.name}</h3>
                        <p className="text-[10px] text-textSecondary uppercase tracking-widest mt-1 font-medium">
                            {album.description || 'Collection'}
                        </p>
                    </div>

                    <div className="relative group/actions">
                        <button
                            className="p-1 hover:bg-bg rounded-lg text-textSecondary hover:text-textMain transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Optional: Show dropdown menu
                            }}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        <div className="absolute right-0 top-8 bg-bgSecondary border border-borderColor shadow-2xl rounded-xl py-2 w-32 hidden group-hover/actions:block z-10">
                            <button
                                onClick={(e) => { e.stopPropagation(); onRename(album); }}
                                className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-bg text-textMain transition-colors"
                            >
                                <Edit2 className="w-3 h-3 text-secondary" />
                                Rename
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(album); }}
                                className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-bg text-accent transition-colors"
                            >
                                <Trash2 className="w-3 h-3" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlbumCard;
