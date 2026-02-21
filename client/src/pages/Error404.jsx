import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Text, MeshDistortMaterial, PresentationControls } from '@react-three/drei';
import { Link } from 'react-router-dom';

const FloatingPlanet = () => {
    const meshRef = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        meshRef.current.rotation.x = Math.cos(t / 4) / 8;
        meshRef.current.rotation.y = Math.sin(t / 4) / 8;
        meshRef.current.rotation.z = Math.sin(t / 4) / 20;
        meshRef.current.position.y = Math.sin(t / 1.5) / 10;
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshDistortMaterial
                color="#3b82f6"
                speed={2}
                distort={0.4}
                radius={1}
            />
        </mesh>
    );
};

const Error404 = () => {
    return (
        <div className="relative w-full h-[calc(100vh-64px)] bg-[#050505] overflow-hidden">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                <color attach="background" args={['#050505']} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />

                <Suspense fallback={null}>
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                    <PresentationControls
                        global
                        config={{ mass: 2, tension: 500 }}
                        snap={{ mass: 4, tension: 1500 }}
                        rotation={[0, 0, 0]}
                        polar={[-Math.PI / 3, Math.PI / 3]}
                        azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
                    >
                        <Float speed={4} rotationIntensity={1} floatIntensity={2}>
                            <FloatingPlanet />
                        </Float>
                    </PresentationControls>

                    <group position={[0, -2, 0]}>
                        <Text
                            position={[0, 0, 0]}
                            fontSize={0.5}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                        >
                            404
                        </Text>
                    </group>
                </Suspense>
            </Canvas>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-24 text-center z-10">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tighter">
                    LOST IN SPACE
                </h1>
                <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                    The page you are looking for has drifted into the void of the digital universe.
                </p>
                <Link
                    to="/"
                    className="px-8 py-3 bg-primary text-textMain rounded-full font-semibold hover:bg-primary/80 transition-all duration-300 shadow-lg shadow-primary/25 border border-primary/50"
                >
                    Return to Mission Control
                </Link>
            </div>

            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
            </div>
        </div>
    );
};

export default Error404;
