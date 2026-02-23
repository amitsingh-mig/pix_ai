import React from 'react';
import { ChevronRight, Home, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NavigationPath = ({ path, onJump, onHome }) => {
    return (
        <div id="navigation-path" className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar py-2">
            <button
                onClick={onHome}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-borderColor/50 text-textSecondary hover:text-primary hover:border-primary/30 transition-all shadow-sm text-[10px] font-black uppercase tracking-wider"
            >
                <Home className="w-3 h-3" />
                <span>Home</span>
            </button>

            <AnimatePresence>
                {path.map((album, index) => (
                    <motion.div
                        key={`${album._id}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-2"
                    >
                        <ChevronRight className="w-3 h-3 text-borderColor" />
                        <button
                            onClick={() => onJump(index, album)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all shadow-sm text-[10px] font-black uppercase tracking-wider ${index === path.length - 1
                                ? 'bg-primary/10 border-primary/20 text-primary'
                                : 'bg-white border-borderColor/50 text-textSecondary hover:text-primary hover:border-primary/30'
                                }`}
                        >
                            <Folder className="w-3 h-3" />
                            <span>{album.name}</span>
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default NavigationPath;
