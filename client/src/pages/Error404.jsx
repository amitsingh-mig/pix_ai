import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Error404 = () => {
    return (
        <div className="relative w-full h-screen bg-[#050505] overflow-hidden flex items-center justify-center">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 text-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-[120px] md:text-[180px] font-black text-white leading-none tracking-tighter opacity-10 select-none">
                        404
                    </h1>
                    <div className="mt-[-60px] md:mt-[-90px]">
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">
                            LOST IN SPACE
                        </h2>
                        <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                            The page you are looking for has drifted into the void of the digital universe.
                        </p>
                        <Link
                            to="/"
                            className="inline-block px-10 py-4 bg-primary text-textMain rounded-full font-bold hover:bg-secondary transition-all duration-300 shadow-xl shadow-primary/20 border border-primary/50 hover:-translate-y-1"
                        >
                            Return to Mission Control
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Floating particles (CSS only) */}
            <div className="absolute inset-0 pointer-events-none">
                 {[...Array(20)].map((_, i) => (
                    <div 
                        key={i}
                        className="absolute bg-white/20 rounded-full animate-float-slow"
                        style={{
                            width: Math.random() * 4 + 'px',
                            height: Math.random() * 4 + 'px',
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                            animationDelay: Math.random() * 5 + 's',
                            opacity: Math.random() * 0.5 + 0.2
                        }}
                    />
                 ))}
            </div>
        </div>
    );
};

export default Error404;
