import React, { useEffect, useRef } from 'react';
import { X, Download, Tag, User, Calendar } from 'lucide-react';

const MediaLightbox = ({ item, onClose }) => {
    const overlayRef = useRef(null);

    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const formatted = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '';

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }}
        >
            <div
                className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-borderColor shadow-2xl flex flex-col lg:flex-row bg-card"
                style={{ maxHeight: '90vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-bg border border-borderColor text-textSecondary hover:text-danger hover:border-danger transition-colors">
                    <X className="w-4 h-4" />
                </button>

                {/* Media */}
                <div className="flex-1 flex items-center justify-center bg-bg min-h-64 overflow-hidden">
                    {item.type === 'image' ? (
                        <img src={item.url} alt={item.title} className="max-w-full max-h-[70vh] object-contain" />
                    ) : (
                        <video src={item.url} className="max-w-full max-h-[70vh]" controls autoPlay />
                    )}
                </div>

                {/* Details */}
                <div className="w-full lg:w-72 p-6 flex flex-col gap-5 border-t lg:border-t-0 lg:border-l border-borderColor overflow-y-auto">
                    <div>
                        <h2 className="text-base font-bold text-textMain mb-2 leading-snug">{item.title}</h2>
                        <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-primary/15 text-textMain border border-primary/25 font-medium capitalize">
                            {item.type}
                        </span>
                    </div>

                    <div className="space-y-2 text-sm text-textSecondary">
                        {item.uploadedBy?.username && (
                            <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-textSecondary/60 flex-shrink-0" />
                                <span>{item.uploadedBy.username}</span>
                            </div>
                        )}
                        {formatted && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-textSecondary/60 flex-shrink-0" />
                                <span>{formatted}</span>
                            </div>
                        )}
                    </div>

                    {item.tags?.length > 0 && (
                        <div>
                            <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-textSecondary uppercase tracking-wider">
                                <Tag className="w-3 h-3" /> AI Tags
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {item.tags.map((tag, i) => (
                                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-textMain font-medium border border-primary/20">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-textMain bg-primary hover:bg-secondary transition-all shadow-sm">
                        <Download className="w-4 h-4" /> Open original
                    </a>
                </div>
            </div>
        </div>
    );
};

export default MediaLightbox;
