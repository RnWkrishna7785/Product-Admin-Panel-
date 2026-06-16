import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial } from '@react-three/drei';
import { useRef } from 'react';


const AnimatedBox = () => {
  const boxRef = useRef(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (boxRef.current) {
      boxRef.current.rotation.x = t * 0.2;
      boxRef.current.rotation.y = t * 0.3;
      boxRef.current.position.y = Math.sin(t) * 0.2;
    }
  });

  return (
    <mesh ref={boxRef} scale={1.8}>
      <boxGeometry args={[1, 1, 1]} />
      
      <MeshDistortMaterial
        color="#ffffff"
        attach="material"
        distort={0.3} 
        speed={2}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
};

const BoxCanvas = () => {
  return (
    <div className="w-full h-full min-h-[300px] relative">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#71717a" />
        
        <AnimatedBox />

        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};

export default BoxCanvas;