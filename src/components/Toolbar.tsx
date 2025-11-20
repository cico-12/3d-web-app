import { useEffect } from 'react';
import { useSceneState } from '@/store/sceneState';

export default function Toolbar() {
  const { mode, setMode, editMode, setEditMode } = useSceneState();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        setEditMode((m) => (m === 'move' ? 'rotate' : 'move'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setEditMode]);

  return (
    <div style={{display:'flex',gap:12,alignItems:'center',padding:'8px 12px',borderBottom:'1px solid #eee'}}>
      <strong>View:</strong>
      <button onClick={() => setMode('3d')} disabled={mode==='3d'}>3D</button>
      <button onClick={() => setMode('2d')} disabled={mode==='2d'}>Top-down</button>

      <div style={{ width:1, height:20, background:'#ddd', margin:'0 8px' }} />

      <strong>Edit:</strong>
      <button onClick={() => setEditMode('rotate')} disabled={editMode==='rotate'}>Rotate</button>
      <button onClick={() => setEditMode('textCreate')} disabled={editMode==='textCreate'}>Text Box</button>

      <span style={{opacity:.7,marginLeft:8}}>Tip: press “R” to activate rotation hud</span>
    </div>
  );
}
