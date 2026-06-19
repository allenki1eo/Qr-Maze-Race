import { useEffect, useState } from 'react'

interface VictoryScreenProps {
  won: boolean
  elapsedMs: number
  opponentUsername?: string
  opponentTime?: number
  onPlayAgain: () => void
  onMenu: () => void
  mode: 'solo' | 'multiplayer'
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${rem.toString().padStart(2, '0')}.${Math.floor((ms % 1000) / 10).toString().padStart(2, '0')}`
}

function Particle({ delay }: { delay: number }) {
  const x = Math.random() * 100
  const dur = 1.5 + Math.random() * 2
  const color = ['#ffd700', '#00ffff', '#ff4444', '#00ff88'][Math.floor(Math.random() * 4)]
  return (
    <div
      className="absolute w-2 h-2 rounded-full"
      style={{
        left: `${x}%`,
        bottom: '-10px',
        background: color,
        boxShadow: `0 0 6px ${color}`,
        animation: `particle-rise ${dur}s ease-out ${delay}s forwards`,
      }}
    />
  )
}

export default function VictoryScreen({ won, elapsedMs, opponentUsername, opponentTime, onPlayAgain, onMenu, mode }: VictoryScreenProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{
        background: 'rgba(10,10,15,0.92)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      <style>{`
        @keyframes particle-rise {
          from { transform: translateY(0) scale(1); opacity: 1; }
          to { transform: translateY(-100vh) scale(0.2); opacity: 0; }
        }
        @keyframes trophy-bounce {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
      `}</style>

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {won && Array.from({ length: 30 }, (_, i) => (
          <Particle key={i} delay={i * 0.1} />
        ))}
      </div>

      <div className="text-center px-8 max-w-md w-full" style={{ zIndex: 1 }}>
        {/* Trophy / Icon */}
        <div
          className="text-7xl mb-6"
          style={{ animation: 'trophy-bounce 1.5s ease-in-out infinite' }}
        >
          {won ? '🏆' : '💀'}
        </div>

        {/* Title */}
        <h1
          className="font-orbitron text-4xl font-black mb-2"
          style={{
            color: won ? '#ffd700' : '#ff4444',
            textShadow: `0 0 20px ${won ? '#ffd700' : '#ff4444'}, 0 0 40px ${won ? '#ffd700' : '#ff4444'}`,
          }}
        >
          {won ? 'VICTORY!' : 'DEFEATED'}
        </h1>

        <p className="text-gray-400 font-orbitron text-sm uppercase tracking-widest mb-8">
          {won
            ? mode === 'solo' ? 'You escaped the maze!' : `You beat ${opponentUsername ?? 'your opponent'}!`
            : mode === 'solo' ? 'The enemy caught you.' : `${opponentUsername ?? 'Opponent'} reached the exit first.`}
        </p>

        {/* Time card */}
        <div
          className="rounded-xl p-6 mb-4"
          style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)' }}
        >
          <div className="font-orbitron text-xs text-gray-400 uppercase tracking-widest mb-1">Your Time</div>
          <div className="font-orbitron text-3xl neon-text-gold">{formatTime(elapsedMs)}</div>
        </div>

        {mode === 'multiplayer' && opponentTime !== undefined && (
          <div
            className="rounded-xl p-4 mb-6"
            style={{ background: 'rgba(0,255,255,0.06)', border: '1px solid rgba(0,255,255,0.25)' }}
          >
            <div className="font-orbitron text-xs text-gray-400 uppercase tracking-widest mb-1">
              {opponentUsername ?? 'Opponent'} Time
            </div>
            <div className="font-orbitron text-2xl neon-text-cyan">{formatTime(opponentTime)}</div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="neon-btn flex-1 py-3 rounded-xl font-orbitron text-sm font-bold uppercase tracking-widest transition-all hover:scale-105"
            style={{ background: 'rgba(255,215,0,0.2)', border: '1px solid #ffd700', color: '#ffd700' }}
          >
            Play Again
          </button>
          <button
            onClick={onMenu}
            className="neon-btn flex-1 py-3 rounded-xl font-orbitron text-sm font-bold uppercase tracking-widest transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  )
}
