import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

const Error500 = () => {
    return (
        <div className="relative w-full h-screen bg-[#1a0000] overflow-hidden flex items-center justify-center">
            {/* Heat Gradient Background */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-red-600/10 via-transparent to-transparent" />

            <div className="relative z-10 text-center px-6 max-w-2xl">
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                    <div className="flex justify-center mb-10">
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="w-32 h-32 bg-red-600 rounded-full blur-3xl absolute -z-10"
                        />
                        <div className="p-8 bg-red-600/10 rounded-full border-2 border-red-600/20">
                            <ShieldAlert className="w-24 h-24 text-red-600" />
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black text-white mb-2 uppercase tracking-tight">
                        CORE MELTDOWN
                    </h1>
                    <p className="text-red-500 font-mono text-2xl mb-8 font-bold animate-pulse tracking-widest uppercase">
                        CRITICAL_SERVER_ERROR_500
                    </p>
                    
                    <p className="text-gray-400 text-lg mb-12 max-w-lg mx-auto leading-relaxed">
                        Our systems are currently experiencing a thermal event. 
                        The infrastructure team is working in high-heat conditions to stabilize the mission.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all duration-300 shadow-2xl shadow-red-900/40 uppercase tracking-widest hover:-translate-y-1 active:translate-y-0"
                        >
                            Emergency Restart
                        </button>
                        <Link
                            to="/"
                            className="px-10 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-black hover:bg-white/10 transition-all duration-300 backdrop-blur-md uppercase tracking-widest hover:-translate-y-1 active:translate-y-0"
                        >
                            Evacuate to Home
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Heat Haze Effect (SVG) */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <filter id="heat">
                    <feTurbulence type="fractalNoise" baseFrequency="0.01 0.05" numOctaves="2" seed="1">
                        <animate attributeName="baseFrequency" dur="10s" values="0.01 0.05;0.01 0.1;0.01 0.05" repeatCount="indefinite" />
                    </feTurbulence>
                    <feDisplacementMap in="SourceGraphic" scale="10" />
                </filter>
            </svg>
        </div>
    );
};

export default Error500;
