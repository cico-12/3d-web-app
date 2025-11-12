import { create } from 'zustand';
import type { Pose } from '@/lib/firestore';

export type CameraMode = '3d' | '2d';
export type EditMode = 'move' | 'rotate';
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
};

export const useSceneState = create<SceneState>((set) => ({
  mode: '3d',
  setMode: (m) => set({ mode: m }),

  editMode: 'move',
  setEditMode: (m) =>
    set((s) => ({ editMode: typeof m === 'function' ? (m as any)(s.editMode) : m })),

  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),

  rotateTargetDeg: { modelA: null, modelB: null },
  setRotateTargetDeg: (id, deg) =>
    set((s) => ({ rotateTargetDeg: { ...s.rotateTargetDeg, [id]: deg } })),

  models: { modelA: null, modelB: null },
  setModel: (id, pose) => set((s) => ({ models: { ...s.models, [id]: pose } })),

  isInteracting: false,
  setInteracting: (v) => set({ isInteracting: v }),
}));
