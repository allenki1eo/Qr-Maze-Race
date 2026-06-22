import { useEffect, useState } from 'react'

interface LiveData {
  roomCode?: string
  myPos: { x: number; y: number }
  opponentPos?: { x: number; y: number }
  roomStatus?: string
}

interface HUDProps {
  elapsedMs: number
  score: number
  playerPos: { x: number; y: number }
  endPos: { x: number; y: number }
  mode: 'solo' | 'multiplayer'
  opponentUsername?: string
  onMove: (dir: 'N' | 'S' | 'E' | 'W') => void
  liveData?: LiveData
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${rem.toString().padStart(2, '0')}.${Math.floor((ms % 1000) / 10).toString().padStart(2, '0')}`
}

function DPadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      onPointerDown={e => { e.preventDefault(); e.stopPropagation(); onPress() }}
      onTouchStart={e => { e.preventDefault(); e.stopPropagation(); onPress() }}
      className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold select-none active:scale-90 transition-transform"
      style={{
        background: 'rgba(255,215,0,0.2)',
        border: '1px solid rgba(255,215,0,0.5)',
        color: '#ffd700',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {label}
    </button>
  )
}

function LivePanel({ liveData }: { liveData: LiveData }) {
  const [flash, setFlash] = useState(false)
  const [prevPos, setPrevPos] = useState(liveData.myPos)

  useEffect(() => {
    if (liveData.myPos.x !== prevPos.x || liveData.myPos.y !== prevPos.y) {
      setPrevPos(liveData.myPos)
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 300)
      return () => clearTimeout(t)
    }
  }, [liveData.myPos, prevPos])

  return (
    <div
      className="absolute top-16 right-3 z-10 rounded-xl p-3 font-orbitron text-xs"
      style={{
        background: 'rgba(10,10,15,0.85)',
        border: '1px solid rgba(0,255,136,0.3)',
        minWidth: 160,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
        <span style={{ color: '#00ff88', letterSpacing: '0.1em' }}>CONVEX LIVE</span>
      </div>

      {liveData.roomCode && (
        <div className="mb-1.5">
          <span style={{ color: '#555' }}>ROOM </span>
          <span style={{ color: '#ffd700' }}>{liveData.roomCode}</span>
        </div>
      )}

      {/* My position */}
      <div
        className="mb-1 rounded px-1 py-0.5 transition-all duration-150"
        style={{ background: flash ? 'rgba(255,215,0,0.15)' : 'transparent' }}
      >
        <span style={{ color: '#555' }}>YOU  </span>
        <span style={{ color: '#ffd700' }}>
          [{liveData.myPos.x.toString().padStart(2, '0')}, {liveData.myPos.y.toString().padStart(2, '0')}]
        </span>
      </div>

      {/* Opponent position */}
      {liveData.opponentPos && (
        <div className="mb-1">
          <span style={{ color: '#555' }}>OPP  </span>
          <span style={{ color: '#00ffff' }}>
            [{liveData.opponentPos.x.toString().padStart(2, '0')}, {liveData.opponentPos.y.toString().padStart(2, '0')}]
          </span>
        </div>
      )}

      {liveData.roomStatus && (
        <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ color: '#555' }}>STATUS </span>
          <span style={{ color: '#9b59b6' }}>{liveData.roomStatus.toUpperCase()}</span>
        </div>
      )}
    </div>
  )
}

export default function HUD({ elapsedMs, score, playerPos, endPos, mode, opponentUsername, onMove, liveData }: HUDProps) {
  const dist = Math.abs(playerPos.x - endPos.x) + Math.abs(playerPos.y - endPos.y)

  return (
    <>
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(10,10,15,0.9), transparent)', pointerEvents: 'none' }}
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-orbitron text-xs text-gray-400 uppercase tracking-widest">Time</span>
            <span className="font-orbitron text-xl neon-text-gold">{formatTime(elapsedMs)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-orbitron text-xs text-gray-400 uppercase tracking-widest">Score</span>
            <span className="font-orbitron text-lg" style={{ color: '#00ff88', textShadow: '0 0 10px #00ff88' }}>{score.toLocaleString()}</span>
          </div>
        </div>

        <div className="text-center">
          <span className="font-orbitron text-xs text-gray-400 uppercase tracking-widest block">Exit</span>
          <span className="font-orbitron text-lg neon-text-cyan">{dist} cells</span>
        </div>

        {mode === 'multiplayer' && opponentUsername && (
          <div className="text-right">
            <span className="font-orbitron text-xs text-gray-400 uppercase tracking-widest block">VS</span>
            <span className="font-orbitron text-sm" style={{ color: '#00ffff' }}>{opponentUsername}</span>
          </div>
        )}
      </div>

      {/* Live Convex panel */}
      {liveData && <LivePanel liveData={liveData} />}

      {/* Mobile D-pad — bottom right */}
      <div
        className="absolute bottom-6 right-4 z-10"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gap: 4, touchAction: 'none' }}
      >
        <div />
        <DPadButton label="▲" onPress={() => onMove('N')} />
        <div />
        <DPadButton label="◄" onPress={() => onMove('W')} />
        <DPadButton label="▼" onPress={() => onMove('S')} />
        <DPadButton label="►" onPress={() => onMove('E')} />
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-orbitron">
          <span className="w-3 h-3 rounded-sm" style={{ background: '#ffd700', boxShadow: '0 0 6px #ffd700', display: 'inline-block' }} />
          You
        </div>
        {mode === 'solo' && (
          <div className="flex items-center gap-2 text-xs text-gray-400 font-orbitron">
            <span className="w-3 h-3 rounded-sm" style={{ background: '#ff4444', boxShadow: '0 0 6px #ff4444', display: 'inline-block' }} />
            Enemy
          </div>
        )}
        {mode === 'multiplayer' && (
          <div className="flex items-center gap-2 text-xs text-gray-400 font-orbitron">
            <span className="w-3 h-3 rounded-sm" style={{ background: '#00ffff', boxShadow: '0 0 6px #00ffff', display: 'inline-block' }} />
            {opponentUsername ?? 'Opponent'}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400 font-orbitron">
          <span className="w-3 h-3 rounded-sm" style={{ background: '#ffd700', boxShadow: '0 0 8px #ffd700', display: 'inline-block' }} />
          Exit
        </div>
        <div className="mt-1 text-gray-600 font-orbitron" style={{ fontSize: 10 }}>
          ← WASD / Arrows →<br />
          ↕ or Swipe on mobile
        </div>
      </div>
    </>
  )
}
