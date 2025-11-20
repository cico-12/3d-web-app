import { create } from 'zustand';
import type { Pose, TextBox3DRecord, TextBox3D } from '@/lib/firestore';

export type CameraMode = '3d' | '2d';
export type EditMode = 'move' | 'rotate' | 'textCreate';
export type ModelId = 'modelA' | 'modelB';

type SceneState = {
  mode: CameraMode;
  setMode: (m: CameraMode) => void;

  editMode: EditMode;
  setEditMode: (m: EditMode | ((m: EditMode) => EditMode)) => void;

  selectedId: ModelId | null;
  setSelectedId: (id: ModelId | null) => void;

  rotateTargetDeg: Record<ModelId, number | null>;
  setRotateTargetDeg: (id: ModelId, deg: number | null) => void;

  models: Record<ModelId, Pose | null>;
  setModel: (id: ModelId, pose: Pose) => void;

  isInteracting: boolean;
  setInteracting: (v: boolean) => void;

  textBoxes3D: TextBox3D[];
  addTextBox3D: (b: TextBox3D) => void;
  updateTextBox3D: (id: string, patch: Partial<TextBox3DRecord>) => void;
  removeTextBox3D: (id: string) => void;

  selectedTextBoxId: string | null;
  setSelectedTextBoxId: (id: string | null) => void;
};

export const useSceneState = create<SceneState>((set) => ({
  mode: '3d',
  setMode: (m) => set({ mode: m }),

  editMode: 'move',
  setEditMode: (m) =>
    set((s) => ({
      editMode: typeof m === 'function' ? (m as any)(s.editMode) : m,
    })),

  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),

  rotateTargetDeg: { modelA: null, modelB: null },
  setRotateTargetDeg: (id, deg) =>
    set((s) => ({ rotateTargetDeg: { ...s.rotateTargetDeg, [id]: deg } })),

  models: { modelA: null, modelB: null },
  setModel: (id, pose) =>
    set((s) => ({ models: { ...s.models, [id]: pose } })),

  isInteracting: false,
  setInteracting: (v) => set({ isInteracting: v }),

  textBoxes3D: [],
  addTextBox3D: (b) =>
    set((s) => ({ textBoxes3D: [...s.textBoxes3D, b] })),
  updateTextBox3D: (id, patch) =>
    set((s) => ({
      textBoxes3D: s.textBoxes3D.map((b) =>
        b.id === id ? { ...b, ...patch } : b
      ),
    })),
  removeTextBox3D: (id) =>
    set((s) => ({
      textBoxes3D: s.textBoxes3D.filter((b) => b.id !== id),
    })),

  selectedTextBoxId: null,
  setSelectedTextBoxId: (id) => set({ selectedTextBoxId: id }),
}));
