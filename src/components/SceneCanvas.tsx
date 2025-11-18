import { Canvas } from '@react-three/fiber';
import { OrbitControls, MapControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import { useSceneState } from '@/store/sceneState';
import ModelItem from './model/ModelItem';
import RotationHUD from './RotationHUD';
import CanvasLoader from './CanvasLoader';

export default function SceneCanvas() {
  const { mode, isInteracting } = useSceneState();

  return (
    <div style={{ position: 'relative' }}>
      <Canvas dpr={1} gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}>
        <color attach="background" args={['#303030']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 10, 6]} intensity={0.9} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#424242" />
        </mesh>

        <Suspense fallback={<CanvasLoader />}>
          <ModelItem id="modelA" />
          <ModelItem id="modelB" />

          {mode === '3d' ? (
            <>
              <PerspectiveCamera makeDefault fov={55} position={[6, 6, 8]} near={0.1} far={200} />
              <OrbitControls
                enabled={!isInteracting}
                enableDamping
                minDistance={3}
                maxDistance={20}
                maxPolarAngle={Math.PI / 2 - 0.1}
              />
            </>
          ) : (
            <>
              <OrthographicCamera makeDefault position={[0, 20, 0]} rotation={[-Math.PI / 2, 0, 0]} zoom={60} />
              <MapControls enabled={!isInteracting} enableRotate={false} />
            </>
          )}
        </Suspense>
      </Canvas>
      <div id="canvas-shield" style={{
        position:'absolute', inset:0, pointerEvents:'none'
      }}/>
      <RotationHUD />
    </div>
  );
}
