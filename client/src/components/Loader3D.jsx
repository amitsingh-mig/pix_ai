import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import faviconUrl from '/favicon.svg';

const ProgressBar = ({ progress }) => (
    <div className="loader-progress-track">
        <motion.div
            className="loader-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeInOut' }}
        />
        <div className="loader-progress-glow" style={{ left: `${progress}%` }} />
    </div>
);

// ─── Main Loader Component (2D Fallback) ──────────────────────────────────────
const Loader3D = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        let current = 0;
        const intervals = [
            { target: 30, speed: 60 },
            { target: 65, speed: 35 },
            { target: 85, speed: 20 },
            { target: 100, speed: 40 },
        ];

        let phase = 0;
        const tick = () => {
            if (phase >= intervals.length) return;
            const { target, speed } = intervals[phase];
            if (current < target) {
                current = Math.min(current + 1, target);
                setProgress(current);
                setTimeout(tick, speed);
            } else {
                phase++;
                if (phase < intervals.length) {
                    setTimeout(tick, 80);
                }
            }
        };
        tick();
    }, []);

    useEffect(() => {
        if (progress === 100) {
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(() => onComplete?.(), 600);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [progress, onComplete]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="loader-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                    {/* Simplified 2D Brand/Logo replacing the 3D Canvas */}
                    <motion.div
                        className="loader-brand"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <img
                            src={faviconUrl}
                            alt="PIXAI logo"
                            className="loader-logo"
                            style={{ width: '120px', height: '120px', marginBottom: '20px' }}
                        />
                        <h1 className="loader-title">
                            <span className="loader-title-ai">PIX</span>AI
                        </h1>
                        <p className="loader-subtitle">Powered by MIG</p>
                    </motion.div>

                    {/* Progress */}
                    <motion.div
                        className="loader-footer"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                    >
                        <ProgressBar progress={progress} />
                        <p className="loader-status">
                            {progress < 40 ? 'Initializing engine...' :
                                progress < 70 ? 'Loading library...' :
                                    progress < 90 ? 'Preparing workspace...' :
                                        'Ready!'}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Loader3D;
