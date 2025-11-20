import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, MapControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useCallback } from 'react';
import { useSceneState } from '@/store/sceneState';
import ModelItem from './model/ModelItem';
import RotationHUD from './RotationHUD';
import CanvasLoader from './CanvasLoader';
import { createTextBox3D, TextBox3DRecord } from '@/lib/firestore';
import TextBoxes3D from './TextBoxes3D';
import TextBoxHUD from './TextBoxHUD';

function Ground() {
  const { camera } = useThree();
  const { editMode, addTextBox3D, setEditMode, mode } = useSceneState();

  const handleGroundClick = useCallback(
    async (e: any) => {
      if (editMode !== 'textCreate') return;
      e.stopPropagation();

      const p = e.point as THREE.Vector3;

      const cam = (camera as THREE.PerspectiveCamera | THREE.OrthographicCamera);

      const y = mode === '2d' ? 1.2 : cam.position.y;

      const q = camera.quaternion.clone();
      const euler = new THREE.Euler().setFromQuaternion(q, 'YXZ');
      const yawRad = euler.y;
      const yawDeg = (yawRad * 180) / Math.PI;

      const data: TextBox3DRecord = {
        position: [p.x, y, p.z],
        rotationDeg: yawDeg,
        text: 'Text',
        color: '#000000',
        background: '#ffffff',
        fontSize: 0.3,
        boxWidth: 3,
        boxHeight: 1,
        boxDepth: 0.1,
      };

      const created = await createTextBox3D(data);
      addTextBox3D(created);
      setEditMode('move');
    },
    [camera, editMode, addTextBox3D, setEditMode, mode]
  );

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={handleGroundClick}
    >
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#424242" />
    </mesh>
  );
}

export default function SceneCanvas() {
  const { mode, isInteracting } = useSceneState();

  return (
    <div style={{ position: 'relative' }}>
      <Canvas dpr={1} gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}>
        <color attach="background" args={['#303030']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 10, 6]} intensity={0.9} />

        <Ground />

        <Suspense fallback={<CanvasLoader />}>
          <ModelItem id="modelA" />
          <ModelItem id="modelB" />
          <TextBoxes3D />

          {mode === '3d' ? (
            <>
              <PerspectiveCamera makeDefault fov={55} position={[6, 6, 8]} near={0.1} far={200} />
              <OrbitControls
                enabled={!isInteracting}
                enableDamping
                minDistance={3}
                maxDistance={40}
                maxPolarAngle={Math.PI / 2 - 0.1}
              />
            </>
          ) : (
            <>
              <OrthographicCamera
                makeDefault
                position={[0, 20, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                zoom={60}
              />
              <MapControls enabled={!isInteracting} enableRotate={false} />
            </>
          )}
        </Suspense>
      </Canvas>

      <div
        id="canvas-shield"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />

      <RotationHUD />
      <TextBoxHUD />
    </div>
  );
}
