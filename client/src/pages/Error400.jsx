import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const Error400 = () => {
    return (
        <div className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden flex items-center justify-center">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 text-center px-6 max-w-2xl">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                >
                    <div className="flex justify-center mb-10">
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="p-8 bg-yellow-500/10 rounded-[40px] border-2 border-yellow-500/20 shadow-[0_0_80px_-20px_rgba(234,179,8,0.3)]"
                        >
                            <AlertCircle className="w-24 h-24 text-yellow-500" />
                        </motion.div>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-yellow-500 mb-2 tracking-tighter uppercase italic">
                        BAD REQUEST
                    </h1>
                    <p className="text-red-500 font-mono text-xl mb-6 font-bold tracking-widest">400_MALFORMED_SYNTAX</p>
                    
                    <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                        The server could not understand the request due to malformed syntax. 
                        Communication has been interrupted by an unknown interference.
                    </p>

                    <Link
                        to="/"
                        className="inline-block px-10 py-4 bg-yellow-500 text-black rounded-none font-black hover:bg-yellow-400 transition-all duration-300 shadow-[8px_8px_0px_0px_rgba(239,68,68,1)] uppercase tracking-widest transform hover:-translate-y-1 active:translate-y-0 active:translate-x-1"
                    >
                        Abort Mission
                    </Link>
                </motion.div>
            </div>

            {/* Glitch Overlay Effect */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500/20 animate-glitch-line" />
            <div className="absolute top-[30%] left-0 w-full h-[1px] bg-yellow-500/10 animate-glitch-line-slow" />
        </div>
    );
};

export default Error400;
