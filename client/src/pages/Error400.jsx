import React, { useRef, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshWobbleMaterial, Text, Box } from '@react-three/drei';
import { Link } from 'react-router-dom';

const GlitchCube = () => {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (meshRef.current) {
            meshRef.current.rotation.x = Math.sin(t / 2) * 2;
            meshRef.current.rotation.y = Math.cos(t / 2) * 2;
            meshRef.current.scale.setScalar(hovered ? 1.2 + Math.sin(t * 10) * 0.1 : 1);
        }
    });

    return (
        <mesh
            ref={meshRef}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <MeshWobbleMaterial
                color={hovered ? "#ef4444" : "#facc15"}
                speed={hovered ? 10 : 2}
                factor={hovered ? 2 : 0.5}
            />
        </mesh>
    );
};

const DecorativeBoxes = () => {
    const boxes = useMemo(() => {
        return [...Array(20)].map(() => ({
            position: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10],
            scale: Math.random() * 0.2,
            speed: Math.random() * 10
        }));
    }, []);

    return (
        <>
            {boxes.map((box, i) => (
                <Float key={i} speed={box.speed} rotationIntensity={5}>
                    <Box position={box.position} scale={box.scale}>
                        <meshStandardMaterial color="#333" wireframe />
                    </Box>
                </Float>
            ))}
        </>
    );
};

const Error400 = () => {
    return (
        <div className="relative w-full h-[calc(100vh-64px)] bg-[#0a0a0a] overflow-hidden">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                <color attach="background" args={['#0a0a0a']} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#facc15" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ef4444" />

                <Suspense fallback={null}>
                    <Float speed={5} rotationIntensity={2} floatIntensity={2}>
                        <GlitchCube />
                    </Float>
                    <DecorativeBoxes />
                </Suspense>
            </Canvas>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-24 text-center z-10 w-full px-4">
                <h1 className="text-4xl md:text-6xl font-black text-yellow-500 mb-2 tracking-tighter uppercase italic">
                    BAD REQUEST
                </h1>
                <p className="text-red-500 font-mono text-xl mb-6 font-bold">ERROR CODE: 400</p>
                <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                    The server could not understand the request due to malformed syntax. Something is broken in the transmission.
                </p>
                <Link
                    to="/"
                    className="px-8 py-3 bg-yellow-500 text-textMain rounded-none font-bold hover:bg-yellow-400 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] uppercase tracking-widest"
                >
                    Abort Mission
                </Link>
            </div>

            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
    );
};

export default Error400;
