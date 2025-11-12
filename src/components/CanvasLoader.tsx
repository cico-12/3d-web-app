import { Html, useProgress } from '@react-three/drei';

export default function CanvasLoader() {
  const { active, progress, loaded, total, item } = useProgress();
  const pct = Math.round(progress);

  return (
    <Html center>
      <div style={wrap} role="status" aria-live="polite">
        <div style={spinner} />
        <div style={line1}>{pct}%</div>
        <div style={line2}>
          Loading {loaded}/{total}
        </div>
        <div style={line3} title={item || ''}>
          {item ? item.split('/').pop() : 'Preparing…'}
        </div>
      </div>
    </Html>
  );
}

const wrap: React.CSSProperties = {
  minWidth: 220,
  textAlign: 'center',
  background: 'rgba(255,255,255,0.96)',
  color: '#111',
  border: '1px solid #e8e8ee',
  borderRadius: 14,
  boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
  padding: '16px 18px',
  backdropFilter: 'saturate(170%) blur(8px)',
};

const spinner: React.CSSProperties = {
  width: 36,
  height: 36,
  margin: '0 auto 10px',
  borderRadius: '50%',
  border: '4px solid #e6ebf4',
  borderTopColor: '#4a90e2',
  animation: 'r3fspin 0.9s linear infinite',
};

if (typeof document !== 'undefined' && !document.getElementById('r3fspin-style')) {
  const style = document.createElement('style');
  style.id = 'r3fspin-style';
  style.textContent = `@keyframes r3fspin { to { transform: rotate(360deg) } }`;
  document.head.appendChild(style);
}

const line1: React.CSSProperties = { fontSize: 18, fontWeight: 800, marginBottom: 2 };
const line2: React.CSSProperties = { fontSize: 12, opacity: 0.7, marginBottom: 2 };
const line3: React.CSSProperties = { fontSize: 11, opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };