'use client';

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import { useSceneState } from '@/store/sceneState';
import {
  updateTextBox3D as updateTextBox3DDb,
  TextBox3DRecord,
} from '@/lib/firestore';

function normDeg(deg: number) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

export default function TextBoxHUD() {
  const {
    selectedTextBoxId,
    textBoxes3D,
    updateTextBox3D: updateLocal,
    setSelectedTextBoxId,
  } = useSceneState();

  const selected = useMemo(
    () => textBoxes3D.find((b) => b.id === selectedTextBoxId) || null,
    [textBoxes3D, selectedTextBoxId]
  );

  const [draft, setDraft] = useState<TextBox3DRecord | null>(
    selected || null
  );

  useEffect(() => {
    setDraft(selected || null);
  }, [selected]);

  if (!selected || !draft) return null;

  const patch = (p: Partial<TextBox3DRecord>) => {
    const next = { ...draft, ...p };
    setDraft(next);
    updateLocal(selected.id, p);
    updateTextBox3DDb(selected.id, p).catch(console.error);
  };

  const handleClose = () => {
    setSelectedTextBoxId(null);
  };

  const [x, y, z] = draft.position;

  const w = draft.boxWidth ?? 3;
  const h = draft.boxHeight ?? 1;
  const d = draft.boxDepth ?? 0.1;

  return (
    <div style={wrap} role="dialog" aria-label="Text box editor">
      <button
        type="button"
        onClick={handleClose}
        style={closeBtn}
        aria-label="Close text editor"
      >
        ×
      </button>

      <div style={header}>
        <span style={title}>Edit text box</span>
      </div>

      <div style={{ ...row, marginBottom: 6 }}>
        <label style={label}>
          Text
          <textarea
            value={draft.text}
            onChange={(e) => patch({ text: e.target.value })}
            style={textarea}
            rows={2}
          />
        </label>
      </div>

      <div style={{ ...row, marginBottom: 6 }}>
        <label style={labelInline}>
          Text color
          <input
            type="color"
            value={draft.color || '#000000'}
            onChange={(e) => patch({ color: e.target.value })}
            style={colorInput}
          />
        </label>

        <label style={labelInline}>
          Bg color
          <input
            type="color"
            value={draft.background ?? '#ffffff'}
            onChange={(e) => patch({ background: e.target.value })}
            style={colorInput}
          />
          <button
            type="button"
            onClick={() => patch({ background: null })}
            style={linkBtn}
          >
            Transparent
          </button>
        </label>
      </div>

      <div style={{ ...row, marginBottom: 6 }}>
        <label style={labelInline}>
          Height (Y)
          <input
            type="number"
            step={0.1}
            value={y.toFixed(1)}
            onChange={(e) => {
              const newY = Number(e.target.value) || 0;
              patch({ position: [x, newY, z] });
            }}
            style={numInput}
          />
        </label>
      </div>

      <div style={{ ...row, marginBottom: 6 }}>
        <label style={labelInline}>
          Width
          <input
            type="number"
            step={0.1}
            min={0.2}
            value={w}
            onChange={(e) =>
              patch({ boxWidth: Math.max(0.2, Number(e.target.value) || w) })
            }
            style={numInput}
          />
        </label>

        <label style={labelInline}>
          Height
          <input
            type="number"
            step={0.1}
            min={0.2}
            value={h}
            onChange={(e) =>
              patch({ boxHeight: Math.max(0.2, Number(e.target.value) || h) })
            }
            style={numInput}
          />
        </label>

        <label style={labelInline}>
          Depth
          <input
            type="number"
            step={0.05}
            min={0.02}
            value={d}
            onChange={(e) =>
              patch({ boxDepth: Math.max(0.02, Number(e.target.value) || d) })
            }
            style={numInput}
          />
        </label>
      </div>

      <div style={{ ...row, marginBottom: 6 }}>
        <label style={labelInline}>
          Font size
          <input
            type="number"
            min={0.1}
            max={1.5}
            step={0.05}
            value={draft.fontSize}
            onChange={(e) => {
              const v = Number(e.target.value) || 0.3;
              patch({ fontSize: v });
            }}
            style={numInput}
          />
        </label>
      </div>

      <div style={row}>
        <label style={{ ...labelInline, flex: 1 }}>
          Rotation
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={normDeg(draft.rotationDeg ?? 0)}
            onChange={(e) => {
              const v = normDeg(Number(e.target.value));
              patch({ rotationDeg: v });
            }}
            style={slider}
          />
        </label>

        <input
          type="number"
          min={0}
          max={360}
          step={1}
          value={normDeg(draft.rotationDeg ?? 0)}
          onChange={(e) => {
            const v = normDeg(Number(e.target.value) || 0);
            patch({ rotationDeg: v });
          }}
          style={numInputSmall}
        />
        <span style={{ fontSize: 11 }}>°</span>
      </div>
    </div>
  );
}

const wrap: CSSProperties = {
  position: 'absolute',
  left: '85%',
  bottom: 250,
  transform: 'translateX(-50%)',
  background: 'rgba(255,255,255,0.96)',
  border: '1px solid #e8e8ee',
  borderRadius: 14,
  padding: '10px 14px 12px 14px',
  boxShadow: '0 12px 30px rgba(0,0,0,0.16)',
  display: 'flex',
  flexDirection: 'column',
  color: '#111',
  gap: 8,
  zIndex: 21,
  minWidth: 260,
  maxWidth: 380,
  backdropFilter: 'saturate(170%) blur(8px)',
};

const closeBtn: CSSProperties = {
  position: 'absolute',
  top: 6,
  right: 8,
  width: 24,
  height: 24,
  borderRadius: 8,
  border: '1px solid #e2e2e6',
  background: '#ffffff',
  color: '#333',
  fontSize: 16,
  lineHeight: 1,
  padding: 0,
  cursor: 'pointer',
};

const header: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const title: CSSProperties = {
  fontWeight: 700,
  fontSize: 14,
};

const row: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
};

const label: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  fontSize: 11,
  gap: 4,
  flex: 1,
};

const labelInline: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
};

const textarea: CSSProperties = {
  width: '100%',
  borderRadius: 8,
  border: '1px solid #dde2ec',
  padding: '4px 6px',
  fontSize: 12,
  resize: 'vertical',
};

const colorInput: CSSProperties = {
  width: 32,
  height: 18,
  padding: 0,
  border: '1px solid #ccc',
  borderRadius: 4,
};

const numInput: CSSProperties = {
  width: 64,
  height: 30,
  borderRadius: 8,
  border: '1px solid #dde2ec',
  padding: '2px 6px',
  fontSize: 12,
};

const numInputSmall: CSSProperties = {
  width: 52,
  height: 28,
  borderRadius: 8,
  border: '1px solid #dde2ec',
  padding: '2px 4px',
  fontSize: 11,
};

const slider: CSSProperties = {
  flex: 1,
  accentColor: '#4a90e2',
};

const linkBtn: CSSProperties = {
  border: 'none',
  background: 'transparent',
  textDecoration: 'underline',
  fontSize: 11,
  color: '#555',
  cursor: 'pointer',
};
