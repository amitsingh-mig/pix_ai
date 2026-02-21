import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import faviconUrl from '/favicon.svg';

// ─── 3D Animated Sphere ───────────────────────────────────────────────────────
const AnimatedSphere = () => {
    const meshRef = useRef();
    const ringRef = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        if (meshRef.current) {
            meshRef.current.rotation.x = Math.sin(t * 0.4) * 0.3;
            meshRef.current.rotation.y = t * 0.7;
            meshRef.current.rotation.z = Math.cos(t * 0.3) * 0.2;
            meshRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.05);
        }

        if (ringRef.current) {
            ringRef.current.rotation.z = -t * 0.5;
            ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.1;
        }
    });

    return (
        <group>
            <mesh ref={meshRef} castShadow>
                <icosahedronGeometry args={[1.3, 4]} />
                <MeshDistortMaterial
                    color="#FFD41D"
                    emissive="#FFA240"
                    emissiveIntensity={0.4}
                    metalness={0.8}
                    roughness={0.1}
                    distort={0.35}
                    speed={3}
                    transparent
                    opacity={0.95}
                />
            </mesh>

            <mesh ref={ringRef}>
                <torusGeometry args={[2.0, 0.04, 16, 60]} />
                <meshStandardMaterial
                    color="#FFD41D"
                    emissive="#FFD41D"
                    emissiveIntensity={0.6}
                    transparent
                    opacity={0.5}
                />
            </mesh>

            <mesh>
                <sphereGeometry args={[1.6, 32, 32]} />
                <meshStandardMaterial
                    color="#FFD41D"
                    emissive="#FFD41D"
                    emissiveIntensity={0.1}
                    transparent
                    opacity={0.06}
                    side={2}
                />
            </mesh>
        </group>
    );
};

// ─── Particle Field ───────────────────────────────────────────────────────────
const Particles = () => {
    const count = 80;
    const positions = React.useMemo(() => {
        const pos = [];
        for (let i = 0; i < count; i++) {
            pos.push(
                (Math.random() - 0.5) * 14,
                (Math.random() - 0.5) * 14,
                (Math.random() - 0.5) * 14
            );
        }
        return new Float32Array(pos);
    }, []);

    const particlesRef = useRef();
    useFrame(({ clock }) => {
        if (particlesRef.current) {
            particlesRef.current.rotation.y = clock.getElapsedTime() * 0.04;
        }
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#FFD41D"
                size={0.06}
                transparent
                opacity={0.5}
                sizeAttenuation
            />
        </points>
    );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
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

// ─── Main Loader Component ────────────────────────────────────────────────────
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
                    {/* 3D Canvas */}
                    <div className="loader-canvas-wrap">
                        <Canvas
                            camera={{ position: [0, 0, 5], fov: 50 }}
                            gl={{ antialias: true, alpha: true }}
                            style={{ background: 'transparent' }}
                        >
                            <ambientLight intensity={0.2} />
                            <pointLight position={[4, 4, 4]} intensity={60} color="#FFD41D" />
                            <pointLight position={[-4, -2, -4]} intensity={20} color="#FFA240" />
                            <directionalLight position={[0, 5, 5]} intensity={1} color="#ffffff" />
                            <Suspense fallback={null}>
                                <AnimatedSphere />
                                <Particles />
                                <Environment preset="city" />
                            </Suspense>
                        </Canvas>
                    </div>

                    {/* Branding */}
                    <motion.div
                        className="loader-brand"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        {/* App logo from favicon */}
                        <img
                            src={faviconUrl}
                            alt="PIXAI logo"
                            className="loader-logo"
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
                            {progress < 40 ? 'Initializing AI engine...' :
                                progress < 70 ? 'Loading media library...' :
                                    progress < 90 ? 'Preparing your workspace...' :
                                        'Ready!'}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Loader3D;
