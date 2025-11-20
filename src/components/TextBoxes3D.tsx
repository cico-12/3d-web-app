'use client';

import { useThree, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSceneState } from '@/store/sceneState';
import {
  updateTextBox3D as updateTextBox3DDb,
  TextBox3DRecord,
  TextBox3D,
} from '@/lib/firestore';

const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };

function debounce<T extends (...a: any[]) => any>(fn: T, ms: number) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export default function TextBoxes3D() {
  const { textBoxes3D } = useSceneState();
  if (!textBoxes3D.length) return null;

  return (
    <>
      {textBoxes3D.map((box) => (
        <TextBox3DInstance key={box.id} boxId={box.id} />
      ))}
    </>
  );
}

type Props = { boxId: string };

function TextBox3DInstance({ boxId }: Props) {
  const { raycaster, pointer, camera } = useThree();
  const {
    textBoxes3D,
    updateTextBox3D: updateLocal,
    selectedTextBoxId,
    setSelectedTextBoxId,
    setInteracting,
    editMode,
    mode,
  } = useSceneState() as any;

  const data = textBoxes3D.find((b: TextBox3D) => b.id === boxId);
  const groupRef = useRef<THREE.Group>(null);
  const draggingRef = useRef(false);
  const dragOffset = useRef(new THREE.Vector3());

  const ground = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    []
  );

  const saveDebounced = useMemo(
    () =>
      debounce((patch: Partial<TextBox3DRecord>) => {
        updateTextBox3DDb(boxId, patch).catch(console.error);
      }, 180),
    [boxId]
  );

  const updateBoth = useCallback(
    (patch: Partial<TextBox3DRecord>) => {
      updateLocal(boxId, patch);
      saveDebounced(patch);
    },
    [boxId, updateLocal, saveDebounced]
  );

  useEffect(() => {
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setInteracting(false);
    };
    window.addEventListener('pointerup', onUp, true);
    return () => window.removeEventListener('pointerup', onUp, true);
  }, [setInteracting]);

  useFrame(() => {
    if (!draggingRef.current || !groupRef.current) return;

    raycaster.setFromCamera(pointer, camera);
    const p = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(ground, p)) {
      let nx = p.x + dragOffset.current.x;
      let nz = p.z + dragOffset.current.z;

      nx = Math.min(bounds.maxX, Math.max(bounds.minX, nx));
      nz = Math.min(bounds.maxZ, Math.max(bounds.minZ, nz));

      const currentY = groupRef.current.position.y;
      const newPos: [number, number, number] = [nx, currentY, nz];

      groupRef.current.position.set(nx, currentY, nz);
      updateBoth({ position: newPos });
    }
  });

  if (!data) return null;

  const {
    position,
    rotationDeg,
    text,
    color,
    background,
    fontSize,
    boxWidth,
    boxHeight,
    boxDepth,
  } = data;

  const onPointerDown = (e: any) => {
    e.stopPropagation();
    setSelectedTextBoxId(boxId);

    if (editMode !== 'move') return;

    draggingRef.current = true;
    setInteracting(true);

    if (!groupRef.current) return;
    const worldPos = groupRef.current.position.clone();
    const p = new THREE.Vector3();
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(ground, p)) {
      dragOffset.current.copy(worldPos).sub(p);
    } else {
      dragOffset.current.set(0, 0, 0);
    }
  };

  const yawRad = (rotationDeg * Math.PI) / 180;
  const safeText = text || '';

  const autoWidth = fontSize * Math.max(6, safeText.length) * 0.1;
  const autoHeight = fontSize * 4.0;
  const autoDepth = 0.1;

  const width = boxWidth ?? Math.max(2.4, Math.min(autoWidth, 10));
  const height = boxHeight ?? autoHeight;
  const depth = boxDepth ?? autoDepth;

  const boxCenterY = height * 0.5 + 0.1;

  const innerRotation: [number, number, number] =
    mode === '2d' ? [-Math.PI / 2, 0, 0] : [0, 0, 0];

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, yawRad, 0]}
      onPointerDown={onPointerDown}
    >
      <group rotation={innerRotation}>
        {background && (
          <mesh position={[0, boxCenterY, 0]}>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial
              color={background}
              transparent
              opacity={1}
            />
          </mesh>
        )}

        <Text
          position={[0, boxCenterY, depth / 2 + 0.001]}
          fontSize={fontSize}
          color={color}
          anchorX="center"
          anchorY="middle"
          maxWidth={width * 0.9}
        >
          {safeText}
        </Text>
      </group>
    </group>
  );
}
