// components/PlantIcon.jsx
// Icône de plante animée selon l'état (0 = épanouie … 3 = en attente)
// Inclut un badge rouge si inactif depuis 3+ jours

import { PLANT_STATES } from '../hooks/useGardenNotification'

const ANIMATIONS = {
  0: 'breathe',
  1: 'breathe',
  2: 'wilt',
  3: 'pulseAlert',
}

export default function PlantIcon({ stateIndex = 0, showBadge = false, size = 52 }) {
  const state = PLANT_STATES[stateIndex]
  const anim  = ANIMATIONS[stateIndex]

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
        @keyframes wilt {
          0%   { transform: rotate(0deg) scale(1); }
          25%  { transform: rotate(-5deg) scale(0.97); }
          75%  { transform: rotate(5deg) scale(0.97); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes pulseAlert {
          0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 0px rgba(201,123,75,0)); }
          50%       { transform: scale(1.1); filter: drop-shadow(0 0 10px rgba(201,123,75,0.6)); }
        }
        .plant-breathe    { animation: breathe    4s ease-in-out infinite; }
        .plant-wilt       { animation: wilt       3s ease-in-out infinite; }
        .plant-pulseAlert { animation: pulseAlert 1.5s ease-in-out infinite; }
      `}</style>

      {/* Emoji plante */}
      <span
        className={`plant-${anim}`}
        style={{
          fontSize:   size,
          display:    'block',
          userSelect: 'none',
          lineHeight: 1,
        }}
        title={state.label}
      >
        {state.emoji}
      </span>

      {/* Badge */}
      {showBadge && (
        <span style={{
          position:     'absolute',
          top:          -6,
          right:        -8,
          background:   '#c97b4b',
          color:        '#fff',
          fontSize:     10,
          fontWeight:   600,
          width:        20,
          height:       20,
          borderRadius: '50%',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          border:       '2px solid #fff',
          animation:    'breathe 2s ease-in-out infinite',
        }}>
          !
        </span>
      )}
    </div>
  )
}
