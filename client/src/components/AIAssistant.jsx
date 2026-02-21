import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Sparkles, Lightbulb } from 'lucide-react';
import { Typewriter } from 'react-simple-typewriter';

const AIAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    const tips = [
        "Upload your first image using the Upload button in the top menu.",
        "Use AI auto-tagging in the image details to generate labels instantly.",
        "Add manual tags to your media to improve your organization and search.",
        "Use the powerful search bar to find media by camera, location, or content.",
        "Click any media card to open detailed metadata and album settings.",
        "Organize your media into Albums to keep your library clean and professional."
    ];

    useEffect(() => {
        const checkJustUploaded = () => {
            if (localStorage.getItem('justUploaded')) {
                setIsOpen(true);
                // Force the specific tip
                const uploadTip = "Great! Your media is uploaded. Click on any image to use the 'AI Generate' button for automatic tagging.";
                // We'll insert it at the beginning or just show it
                setCurrentTipIndex(-1); // Use -1 as a special index for the custom tip
                localStorage.removeItem('justUploaded');
            }
        };

        checkJustUploaded();

        if (isOpen) {
            const interval = setInterval(() => {
                setCurrentTipIndex((prev) => (prev + 1) % tips.length);
            }, 8000);
            return () => clearInterval(interval);
        }
    }, [isOpen, tips.length]);

    const displayedTip = currentTipIndex === -1
        ? "Great! Your media is uploaded. Click on any image to use the 'AI Generate' button for automatic tagging."
        : tips[currentTipIndex];

    return (
        <div className="ai-assistant-wrapper">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="ai-assistant-popup"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    >
                        <div className="ai-assistant-header">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <h4>AI Assistant</h4>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="ml-auto text-textSecondary hover:text-danger transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="ai-assistant-content">
                            <span className="ai-assistant-tip-label">
                                <Lightbulb className="w-2.5 h-2.5 inline mr-1" />
                                Smart Tip
                            </span>
                            <p className="text-sm">
                                <Typewriter
                                    words={[displayedTip]}
                                    key={displayedTip}
                                    loop={1}
                                    cursor
                                    cursorStyle='|'
                                    typeSpeed={50}
                                    deleteSpeed={30}
                                    delaySpeed={1000}
                                />
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                className="ai-assistant-btn"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </motion.button>
        </div>
    );
};

export default AIAssistant;
