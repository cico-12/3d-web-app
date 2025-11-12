import * as THREE from 'three';

export function boxesIntersect(a: THREE.Object3D, b: THREE.Object3D) {
  const boxA = new THREE.Box3().setFromObject(a);
  const boxB = new THREE.Box3().setFromObject(b);
  return boxA.intersectsBox(boxB);
}
