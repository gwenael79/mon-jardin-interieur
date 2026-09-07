// src/components/SuspenseFallback.jsx
// Fallback affiché pendant le chargement paresseux (React.lazy) d'un écran.

export default function SuspenseFallback() {
  return (
    <div style={styles.wrap}>
      <style>{`
        @keyframes suspenseFallbackPulse {
          0%, 100% { opacity: .55; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.08); }
        }
      `}</style>
      <span style={styles.seed}>🌱</span>
      <span style={styles.label}>Chargement…</span>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh',
    background: '#faf5f2',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  seed: {
    fontSize: 36,
    filter: 'drop-shadow(0 4px 12px rgba(207,155,84,0.25))',
    animation: 'suspenseFallbackPulse 1.6s ease-in-out infinite',
  },
  label: {
    fontFamily: "'Jost', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    color: '#4a5d4e',
  },
}
