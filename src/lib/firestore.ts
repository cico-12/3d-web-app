import {
  doc,
  getDocFromServer,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export type Pose = {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  name: string;
};

const SCENE_ID = 'default';

export async function getModelPose(id: 'modelA'|'modelB'): Promise<Pose|null> {
  const ref = doc(db, 'scenes', SCENE_ID, 'models', id);
  const snap = await getDocFromServer(ref);
  return snap.exists() ? (snap.data() as Pose) : null;
}

export async function savePose(id: 'modelA'|'modelB', pose: { 
  position: [number, number, number]; 
  quaternion: [number, number, number, number]; 
}) {
  const ref = doc(db, 'scenes', SCENE_ID, 'models', id);
  await setDoc(ref, pose, { merge: true });
}

export async function ensureDefaults() {
  const aRef = doc(db, 'scenes', SCENE_ID, 'models', 'modelA');
  const bRef = doc(db, 'scenes', SCENE_ID, 'models', 'modelB');

  const a = await getModelPose('modelA');
  const b = await getModelPose('modelB');

  if (!a) {
    await setDoc(aRef, {
      position: [0, 0, 0],
      quaternion: [0, 0, 0, 1],
      name: 'White_3DB24.glb',
    }, { merge: true });
  }

  if (!b) {
    await setDoc(bRef, {
      position: [4, 0, 0],
      quaternion: [0, 0, 0, 1],
      name: 'White_B33.glb',
    }, { merge: true });
  }
}

export type TextBox3DRecord = {
  position: [number, number, number];
  rotationDeg: number;
  text: string;
  color: string;
  background: string | null;
  fontSize: number;
  boxWidth: number;
  boxHeight: number;
  boxDepth: number;
};

export type TextBox3D = TextBox3DRecord & { id: string };

const textBoxCollection = collection(db, 'scenes', SCENE_ID, 'textBoxes3D');

export async function getTextBoxes3D(): Promise<TextBox3D[]> {
  const snap = await getDocs(textBoxCollection);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as TextBox3DRecord),
  }));
}

export async function createTextBox3D(data: TextBox3DRecord): Promise<TextBox3D> {
  const ref = await addDoc(textBoxCollection, data);
  return { id: ref.id, ...data };
}

export async function updateTextBox3D(
  id: string,
  patch: Partial<TextBox3DRecord>
): Promise<void> {
  const ref = doc(db, 'scenes', SCENE_ID, 'textBoxes3D', id);
  await updateDoc(ref, patch);
}

export async function deleteTextBox3D(id: string): Promise<void> {
  const ref = doc(db, 'scenes', SCENE_ID, 'textBoxes3D', id);
  await deleteDoc(ref);
}
