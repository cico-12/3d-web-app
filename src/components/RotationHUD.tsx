import { useEffect, useMemo, useState } from 'react';
import { useSceneState } from '@/store/sceneState';

function normDeg(deg: number) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

export default function RotationHUD() {
  const {
    editMode,
    selectedId,
    models,
    rotateTargetDeg,
    setRotateTargetDeg,
    setEditMode,
  } = useSceneState();

  const pose = selectedId ? models[selectedId] : null;

  const storeDeg = useMemo(() => {
    if (!selectedId) return 0;

    const target = rotateTargetDeg[selectedId];
    if (target != null) return normDeg(target);

    if (!pose) return 0;
    const [x, y, z, w] = pose.quaternion;
    const t3 = 2 * (w * y + x * z);
    const t4 = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(t3, t4);
    return normDeg((yaw * 180) / Math.PI);
  }, [selectedId, rotateTargetDeg, pose]);

  const [tempDeg, setTempDeg] = useState(storeDeg);
  useEffect(() => {
    setTempDeg(storeDeg);
  }, [storeDeg]);

  const close = () => {
    setEditMode('move');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (editMode !== 'rotate') return;

      if (e.key.toLowerCase() === 'q') {
        const next = normDeg(tempDeg - 15);
        setTempDeg(next);
        setRotateTargetDeg(selectedId, next);
      } else if (e.key.toLowerCase() === 'e') {
        const next = normDeg(tempDeg + 15);
        setTempDeg(next);
        setRotateTargetDeg(selectedId, next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editMode, selectedId, tempDeg, setRotateTargetDeg, setEditMode]);

  if (editMode !== 'rotate' || !selectedId) return null;

  const nudge = (delta: number) => {
    const next = normDeg(tempDeg + delta);
    setTempDeg(next);
    setRotateTargetDeg(selectedId, next);
  };

  const snapTo = (deg: number) => {
    const v = normDeg(deg);
    setTempDeg(v);
    setRotateTargetDeg(selectedId, v);
  };

  return (
    <div style={wrap} role="dialog" aria-label="Rotation controls">
      <button
        onClick={close}
        aria-label="Close rotation controls"
        style={closeBtn}
      >
        ×
      </button>

      <div style={header}>
        <span style={title}>Rotate selected</span>
        <span style={readout}>{Math.round(tempDeg)}°</span>
      </div>

      <div style={row}>
        <button
          style={{ ...bigBtn, ...neg }}
          onClick={() => nudge(-15)}
          aria-label="Rotate -15 degrees"
        >
          <span style={arrow}>&#8634;</span>
          <span style={degText}>−15°</span>
        </button>

        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={tempDeg}
          onChange={(e) => {
            const v = Number(e.target.value);
            setTempDeg(v);
            setRotateTargetDeg(selectedId, v);
          }}
          style={slider}
        />

        <button
          style={{ ...bigBtn, ...pos }}
          onClick={() => nudge(+15)}
          aria-label="Rotate +15 degrees"
        >
          <span style={arrow}>&#8635;</span>
          <span style={degText}>+15°</span>
        </button>
      </div>

      <div style={row}>
        <button style={pill} onClick={() => nudge(-90)}>−90°</button>
        <button style={pill} onClick={() => nudge(-5)}>−5°</button>
        <input
          type="number"
          min={0}
          max={360}
          step={1}
          value={tempDeg}
          onChange={(e) => {
            const v = normDeg(Number(e.target.value));
            setTempDeg(v);
            setRotateTargetDeg(selectedId, v);
          }}
          style={num}
        />°
        <button style={pill} onClick={() => nudge(+5)}>+5°</button>
        <button style={pill} onClick={() => nudge(+90)}>+90°</button>
      </div>

      <div style={{ ...row, gap: 6, flexWrap: 'wrap' }}>
        <span style={muted}>Snap:</span>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
          <button key={d} style={chip} onClick={() => snapTo(d)}>
            {d}°
          </button>
        ))}
        <button style={chipStrong} onClick={() => snapTo(0)}>Reset</button>
      </div>

      <div style={footer}>
        <span style={muted}>
          Tips: Q/E = ±15° • Drag slider for fine control • Esc to close
        </span>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: 18,
  transform: 'translateX(-50%)',
  background: 'rgba(255,255,255,0.96)',
  border: '1px solid #e8e8ee',
  borderRadius: 14,
  padding: '12px 14px 14px 14px',
  boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
  display: 'flex',
  flexDirection: 'column',
  color: 'black',
  gap: 10,
  zIndex: 20,
  backdropFilter: 'saturate(170%) blur(8px)',
};

const closeBtn: React.CSSProperties = {
  position: 'absolute',
  top: 6,
  right: 8,
  width: 28,
  height: 28,
  borderRadius: 8,
  border: '1px solid #e2e2e6',
  background: '#ffffff',
  color: '#333',
  fontSize: 18,
  lineHeight: 1,
  padding: 0,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
  paddingRight: 30,
};
const title: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 14,
  color: '#1b1f23',
};
const readout: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontSize: 18,
  fontWeight: 700,
  color: '#1b1f23',
  padding: '2px 8px',
  borderRadius: 8,
  background: '#f5f7fb',
  border: '1px solid #e9edf6',
} as React.CSSProperties;

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const bigBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  border: 'none',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(0,0,0,0.10)',
  transition: 'transform .06s ease',
};
const pos: React.CSSProperties = {
  background: '#e8fff6',
  color: '#0f9d58',
};
const neg: React.CSSProperties = {
  background: '#fff0f0',
  color: '#c62828',
};
const arrow: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1,
};
const degText: React.CSSProperties = {
  fontSize: 16,
};

const slider: React.CSSProperties = {
  width: 320,
  accentColor: '#4a90e2',
};

const pill: React.CSSProperties = {
  background: 'rgb(243, 246, 251)',
  border: '1px solid #e5e9f2',
  borderRadius: 999,
  padding: '8px 12px',
  color: 'black',
  fontWeight: 600,
  cursor: 'pointer',
};

const chip: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e9f2',
  borderRadius: 999,
  padding: '6px 10px',
  color: 'black',
  fontSize: 12,
  cursor: 'pointer',
};
const chipStrong: React.CSSProperties = {
  ...chip,
  background: '#ffffff',
  borderColor: '#525252',
  fontWeight: 700,
};

const num: React.CSSProperties = {
  width: 80,
  height: 36,
  borderRadius: 10,
  border: '1px solid #dde2ec',
  padding: '0 10px',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
};

const footer: React.CSSProperties = { marginTop: 2 };
const muted: React.CSSProperties = { opacity: 0.7, fontSize: 12 };
