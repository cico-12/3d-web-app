'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ensureDefaults, getModelPose, getTextBoxes3D } from '@/lib/firestore';
import { useSceneState } from '@/store/sceneState';

const SceneCanvas = dynamic(() => import('@/components/SceneCanvas'), { ssr: false });
const Toolbar = dynamic(() => import('@/components/Toolbar'), { ssr: false });

export default function Page() {
  const { setModel, addTextBox3D } = useSceneState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await ensureDefaults();
      const [a, b, boxes] = await Promise.all([
        getModelPose('modelA'),
        getModelPose('modelB'),
        getTextBoxes3D(),
      ]);
      if (a) setModel('modelA', a);
      if (b) setModel('modelB', b);
      boxes.forEach((box) => addTextBox3D(box));
      setLoading(false);
    })();
  }, [setModel, addTextBox3D]);

  if (loading) return <div style={{ padding: 20 }}>Loading scene…</div>;

  return (
    <div style={{ height: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
      <Toolbar />
      <SceneCanvas />
    </div>
  );
}
