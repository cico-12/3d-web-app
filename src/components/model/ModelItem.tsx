import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useMemo, useRef, useCallback } from 'react';
import { savePose } from '@/lib/firestore';
import { useSceneState, ModelId } from '@/store/sceneState';

type Id = ModelId;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function debounce<T extends (...a: any[]) => any>(fn: T, ms: number) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };


function intersectsOBB(
  aPos: THREE.Vector2,
  aYaw: number,
  aHalf: THREE.Vector2,
  bPos: THREE.Vector2,
  bYaw: number,
  bHalf: THREE.Vector2
) {
  const ca = Math.cos(aYaw), sa = Math.sin(aYaw);
  const cb = Math.cos(bYaw), sb = Math.sin(bYaw);

  const aX = new THREE.Vector2(ca, -sa);
  const aZ = new THREE.Vector2(sa,  ca);

  const bX = new THREE.Vector2(cb, -sb);
  const bZ = new THREE.Vector2(sb,  cb);

  const R00 = aX.dot(bX);
  const R01 = aX.dot(bZ);
  const R10 = aZ.dot(bX);
  const R11 = aZ.dot(bZ);

  const eps = 1e-6;
  const AbsR00 = Math.abs(R00) + eps;
  const AbsR01 = Math.abs(R01) + eps;
  const AbsR10 = Math.abs(R10) + eps;
  const AbsR11 = Math.abs(R11) + eps;

  const d = new THREE.Vector2().subVectors(bPos, aPos);

  const tA = new THREE.Vector2(d.dot(aX), d.dot(aZ));

  const aEx = aHalf.x;
  const aEz = aHalf.y;
  const bEx = bHalf.x;
  const bEz = bHalf.y;

  if (Math.abs(tA.x) > aEx + bEx * AbsR00 + bEz * AbsR01) return false;
  if (Math.abs(tA.y) > aEz + bEx * AbsR10 + bEz * AbsR11) return false;

  const tB = new THREE.Vector2(d.dot(bX), d.dot(bZ));

  if (Math.abs(tB.x) > bEx + aEx * AbsR00 + aEz * AbsR10) return false;
  if (Math.abs(tB.y) > bEz + aEx * AbsR01 + aEz * AbsR11) return false;

  return true;
}

function getWorldPosYaw(obj: THREE.Object3D) {
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  obj.getWorldPosition(p);
  obj.getWorldQuaternion(q);
  const e = new THREE.Euler().setFromQuaternion(q, 'YXZ');
  return { p, yaw: e.y };
}

function yawFromQuat(q: THREE.Quaternion) {
  return new THREE.Euler().setFromQuaternion(q, 'YXZ').y;
}
function quatFromYaw(yaw: number) {
  const e = new THREE.Euler(0, yaw, 0, 'YXZ');
  return new THREE.Quaternion().setFromEuler(e);
}
function shortestAngleDiff(a: number, b: number) {
  let d = (b - a + Math.PI) % (Math.PI * 2);
  if (d < 0) d += Math.PI * 2;
  return d - Math.PI;
}
function normDeg(deg: number) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

export default function ModelItem({ id }: { id: Id }) {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const debugRef = useRef<THREE.Group | null>(null);

  const { raycaster, camera, pointer, scene } = useThree();
  const ground = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    []
  );

  const {
    models,
    setModel,
    setInteracting,
    selectedId,
    setSelectedId,
    rotateTargetDeg,
    setRotateTargetDeg,
  } = useSceneState();

  const me = models[id]!;
  const otherId: Id = id === 'modelA' ? 'modelB' : 'modelA';

  const glb = useGLTF(`/models/${me.name}`) as any;

  const rawClone = useMemo(() => {
    const c = glb.scene.clone(true);
    c.traverse((o: any) => {
      if (o.isMesh) {
        if (o.material?.isMaterial) o.material = o.material.clone();
        if (o.geometry?.isBufferGeometry) o.geometry = o.geometry.clone();
      }
    });
    return c;
  }, [glb.scene]);

  const norm = useMemo(() => {
    const tmp = rawClone.clone(true);
    const box = new THREE.Box3().setFromObject(tmp);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const TARGET_MAX = 2.5;
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? TARGET_MAX / maxDim : 1;

    const offset = new THREE.Vector3(-center.x, -center.y, -center.z);
    const minYAfterCenter = box.min.y - center.y;
    offset.y += -minYAfterCenter;

    return { scale, offset };
  }, [rawClone]);

  const modelScene = useMemo(() => {
    const g = new THREE.Group();
    const wrapped = rawClone.clone(true);
    wrapped.position.copy(norm.offset);
    g.add(wrapped);
    g.scale.setScalar(norm.scale);
    return g;
  }, [rawClone, norm]);

  useEffect(() => {
    if (!outer.current) return;

    const tmp = rawClone.clone(true);
    const box = new THREE.Box3().setFromObject(tmp);
    const size = box.getSize(new THREE.Vector3());

    const width = size.x * norm.scale;
    const depth = size.z * norm.scale;

    let halfX = width * 0.5;
    let halfZ = depth * 0.5;

    halfX = Math.max(0, halfX);
    halfZ = Math.max(0, halfZ);

    (outer.current as any).userData.halfXZ = new THREE.Vector2(halfX, halfZ);
  }, [rawClone, norm.scale, me.name]);

  const draggingRef = useRef(false);
  const dragOffset = useRef(new THREE.Vector3());

  const lastValidPos = useRef(new THREE.Vector3(...me.position));
  const lastValidQuat = useRef(
    new THREE.Quaternion(...me.quaternion)
  );

  useEffect(() => {
    if (!outer.current || draggingRef.current) return;
    outer.current.position.set(...me.position);
    outer.current.quaternion.set(...me.quaternion);
    outer.current.position.y = 0;
    lastValidPos.current.set(...me.position);
    lastValidQuat.current.set(...me.quaternion);
  }, [me]);

  const collides = () => {
    const a = outer.current as any;
    const b = scene.getObjectByName(otherId) as any;
    if (!a || !b) return false;

    const aHalf = a.userData?.halfXZ as THREE.Vector2 | undefined;
    const bHalf = b.userData?.halfXZ as THREE.Vector2 | undefined;
    if (!aHalf || !bHalf) return false;

    const { p: aP, yaw: aYaw } = getWorldPosYaw(a);
    const { p: bP, yaw: bYaw } = getWorldPosYaw(b);

    return intersectsOBB(
      new THREE.Vector2(aP.x, aP.z),
      aYaw,
      aHalf,
      new THREE.Vector2(bP.x, bP.z),
      bYaw,
      bHalf
    );
  };

  const savePoseNow = useCallback(async () => {
    if (!outer.current) return;
    const p = outer.current.position;
    const q = outer.current.quaternion;
    await savePose(id, {
      position: [p.x, p.y, p.z],
      quaternion: [q.x, q.y, q.z, q.w],
    });
    setModel(id, {
      position: [p.x, p.y, p.z],
      quaternion: [q.x, q.y, q.z, q.w],
      name: me.name,
    });
    lastValidPos.current.copy(outer.current.position);
    lastValidQuat.current.copy(outer.current.quaternion);
  }, [id, me.name, setModel]);

  const savePoseDebounced = useMemo(
    () => debounce(savePoseNow, 180),
    [savePoseNow]
  );

  const onClickSelect = useCallback(
    (e: any) => {
      e.stopPropagation();
      setSelectedId(id);
    },
    [id, setSelectedId]
  );

  const onPointerDown = (e: any) => {
    onClickSelect(e);
    if (useSceneState.getState().editMode !== 'move') return;
    e.stopPropagation();
    draggingRef.current = true;
    setInteracting(true);

    const p = new THREE.Vector3();
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(ground, p) && outer.current) {
      dragOffset.current.copy(outer.current.position).sub(p);
    } else {
      dragOffset.current.set(0, 0, 0);
    }
  };

  useEffect(() => {
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setInteracting(false);
      if (!outer.current) return;
      outer.current.position.y = 0;
      if (collides()) {
        outer.current.position.copy(lastValidPos.current);
        outer.current.quaternion.copy(lastValidQuat.current);
      } else {
        savePoseNow();
      }
    };
    window.addEventListener('pointerup', onUp, true);
    return () => window.removeEventListener('pointerup', onUp, true);
  }, [savePoseNow, setInteracting]);

  useFrame(() => {
    if (
      useSceneState.getState().editMode === 'move' &&
      draggingRef.current &&
      outer.current
    ) {
      raycaster.setFromCamera(pointer, camera);
      const p = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(ground, p)) {
        const nx = clamp(p.x + dragOffset.current.x, bounds.minX, bounds.maxX);
        const nz = clamp(p.z + dragOffset.current.z, bounds.minZ, bounds.maxZ);

        const obj = outer.current;
        const prev = new THREE.Vector2(obj.position.x, obj.position.z);
        const target = new THREE.Vector2(nx, nz);

        obj.position.set(target.x, 0, target.y);
        if (!collides()) {
          lastValidPos.current.copy(obj.position);
          savePoseDebounced();
        } else {
          let lo = 0.0, hi = 1.0;
          const tmp = new THREE.Vector2();
          obj.position.set(prev.x, 0, prev.y);
          for (let i = 0; i < 18; i++) {
            const mid = (lo + hi) * 0.5;
            tmp.copy(target).sub(prev).multiplyScalar(mid).add(prev);
            obj.position.set(tmp.x, 0, tmp.y);
            if (collides()) hi = mid;
            else lo = mid;
          }
          tmp.copy(target).sub(prev).multiplyScalar(lo).add(prev);
          obj.position.set(tmp.x, 0, tmp.y);
          lastValidPos.current.copy(obj.position);
          savePoseDebounced();
        }
      }
    }

    if (debugRef.current && outer.current && selectedId === id) {
      debugRef.current.position.copy(outer.current.position);
      debugRef.current.position.y = 0.001;
      debugRef.current.quaternion.copy(outer.current.quaternion);
    }
  });

  const targetDeg = rotateTargetDeg[id];

  useEffect(() => {
    if (targetDeg == null || !outer.current) return;
    if (selectedId !== id || useSceneState.getState().editMode !== 'rotate') return;

    const obj = outer.current;
    const startYaw = yawFromQuat(obj.quaternion);
    const targetYaw = (targetDeg * Math.PI) / 180;
    const delta = shortestAngleDiff(startYaw, targetYaw);

    if (Math.abs(delta) < 1e-4) return;

    const quatAtStart = obj.quaternion.clone();

    const applyYaw = (yaw: number) => {
      obj.quaternion.copy(quatFromYaw(yaw));
    };

    applyYaw(startYaw + delta);
    if (!collides()) {
      lastValidQuat.current.copy(obj.quaternion);
      savePoseDebounced();
      const appliedYaw = yawFromQuat(obj.quaternion);
      const appliedDeg = normDeg((appliedYaw * 180) / Math.PI);
      setRotateTargetDeg(id, appliedDeg);
      return;
    }

    obj.quaternion.copy(quatAtStart);
    if (collides()) {
      obj.quaternion.copy(lastValidQuat.current);
      const appliedYaw = yawFromQuat(obj.quaternion);
      const appliedDeg = normDeg((appliedYaw * 180) / Math.PI);
      setRotateTargetDeg(id, appliedDeg);
      return;
    }

    let lo = 0.0, hi = 1.0;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) * 0.5;
      const midYaw = startYaw + delta * mid;
      applyYaw(midYaw);
      if (collides()) hi = mid;
      else lo = mid;
    }

    const finalYaw = startYaw + delta * lo;
    applyYaw(finalYaw);

    if (collides()) {
      obj.quaternion.copy(lastValidQuat.current);
      const appliedYaw = yawFromQuat(obj.quaternion);
      const appliedDeg = normDeg((appliedYaw * 180) / Math.PI);
      setRotateTargetDeg(id, appliedDeg);
      return;
    }

    lastValidQuat.current.copy(obj.quaternion);
    savePoseDebounced();
    const appliedYaw = yawFromQuat(obj.quaternion);
    const appliedDeg = normDeg((appliedYaw * 180) / Math.PI);
    setRotateTargetDeg(id, appliedDeg);
  }, [targetDeg, id, selectedId, savePoseDebounced, setRotateTargetDeg]);

  const isSelected = selectedId === id;

  return (
    <>
      <group
        name={id}
        ref={outer}
        position={[...me.position]}
        onPointerDown={onPointerDown}
        onClick={onClickSelect}
      >
        <group ref={inner}>
          <primitive object={modelScene} />
        </group>
      </group>

      {isSelected && (
        <group ref={debugRef}>
          {(() => {
            const half = (outer.current as any)?.userData?.halfXZ as
              | THREE.Vector2
              | undefined;
            if (!half) return null;
            return (
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[half.x * 2, half.y * 2]} />
                <meshBasicMaterial
                  color="red"
                  wireframe
                  transparent
                  opacity={0.4}
                />
              </mesh>
            );
          })()}
        </group>
      )}
    </>
  );
}

useGLTF.preload('/models/White_3DB24.glb');
useGLTF.preload('/models/White_B33.glb');
