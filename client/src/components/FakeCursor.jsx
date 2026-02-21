import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FakeCursor = () => {
    const [target, setTarget] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [clickEffect, setClickEffect] = useState(false);

    const tourTargets = [
        '.sidebar',
        '.upload-button',
        '.upload-form',
        '.tag-input',
        '.ai-tag-button',
        '.media-gallery',
        '.search-bar',
        '.profile-menu'
    ];

    useEffect(() => {
        // Simple logic to follow the tour if it's active
        // Joyride doesn't easily expose the current step index externally without complex state management
        // but we can monitor which tooltip is open or use a simple timer for demo purposes
        // or better: follow the Joyride classes

        const interval = setInterval(() => {
            const activeTooltip = document.querySelector('.joyride-tooltip');
            if (activeTooltip) {
                // Find which step we are on by looking at the targets
                for (const selector of tourTargets) {
                    const el = document.querySelector(selector);
                    const rect = el?.getBoundingClientRect();
                    const isHighlighted = el?.closest('.joyride-spotlight'); // Some joyride versions use different classes

                    if (el && rect) {
                        // Check if Joyride is highlighting this element
                        // Or if it's currently the target of an active step
                        // Joyride often adds data attributes or classes
                        // For simplicity, we'll follow the one that has a spotlight or is being "highlighted"

                        // Let's assume the cursor should move to the element that Joyride is currently centered on
                        setTarget({
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2
                        });
                        setIsVisible(true);

                        // Simulate click if it's the AI tag button
                        if (selector === '.ai-tag-button' && !clickEffect) {
                            setTimeout(() => setClickEffect(true), 1000);
                            setTimeout(() => setClickEffect(false), 1500);
                        }

                        break;
                    }
                }
            } else {
                setIsVisible(false);
            }
        }, 800);

        return () => clearInterval(interval);
    }, [clickEffect]);

    if (!isVisible || !target) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fake-cursor"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                    x: target.x - 12,
                    y: target.y - 12,
                    opacity: 1,
                    scale: clickEffect ? 0.8 : 1,
                    backgroundColor: clickEffect ? 'rgba(255, 212, 29, 0.5)' : 'rgba(255, 255, 255, 0.8)'
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            >
                {clickEffect && (
                    <motion.div
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        style={{
                            position: 'absolute',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '2px solid #FFD41D'
                        }}
                    />
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default FakeCursor;
