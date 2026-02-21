import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Text, Float, Environment, ContactShadows } from '@react-three/drei';
import { Link } from 'react-router-dom';

const MeltdownSphere = () => {
    const meshRef = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (meshRef.current) {
            meshRef.current.distort = 0.4 + Math.sin(t) * 0.2;
            meshRef.current.speed = 2 + Math.sin(t / 2) * 2;
        }
    });

    return (
        <Sphere args={[1, 100, 100]} scale={1.5}>
            <MeshDistortMaterial
                ref={meshRef}
                color="#ef4444"
                roughness={0.1}
                metalness={1}
                distort={0.5}
                speed={2}
            />
        </Sphere>
    );
};

const Error500 = () => {
    return (
        <div className="relative w-full h-[calc(100vh-64px)] bg-[#1a0000] overflow-hidden">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                <color attach="background" args={['#1a0000']} />
                <ambientLight intensity={0.2} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#ff4d4d" />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#ff0000" />

                <Suspense fallback={null}>
                    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                        <MeltdownSphere />
                    </Float>

                    <ContactShadows
                        position={[0, -2.5, 0]}
                        opacity={0.4}
                        scale={20}
                        blur={2}
                        far={4.5}
                    />

                    <Environment preset="night" />
                </Suspense>
            </Canvas>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-24 text-center z-10 w-full px-4">
                <h1 className="text-4xl md:text-7xl font-black text-white mb-2 uppercase tracking-tight">
                    CRITICAL FAILURE
                </h1>
                <p className="text-red-500 font-mono text-2xl mb-6 font-bold animate-pulse">ERROR 500</p>
                <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                    Our servers are experiencing a thermal event. We are working to stabilize the system core.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all duration-300 shadow-xl shadow-red-900/50"
                    >
                        Emergency Restart
                    </button>
                    <Link
                        to="/"
                        className="px-8 py-3 bg-white/10 text-white border border-white/20 rounded-lg font-bold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                    >
                        Evacuate to Home
                    </Link>
                </div>
            </div>

            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <filter id="heat">
                    <feTurbulence type="fractalNoise" baseFrequency="0.01 0.05" numOctaves="2" seed="1">
                        <animate attributeName="baseFrequency" dur="10s" values="0.01 0.05;0.01 0.1;0.01 0.05" repeatCount="indefinite" />
                    </feTurbulence>
                    <feDisplacementMap in="SourceGraphic" scale="10" />
                </filter>
            </svg>

            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-red-600/20 to-transparent" />
        </div>
    );
};

export default Error500;
