interface HUDProps {
  elapsedMs: number
  playerPos: { x: number; y: number }
  endPos: { x: number; y: number }
  mode: 'solo' | 'multiplayer'
  opponentUsername?: string
  onMove: (dir: 'N' | 'S' | 'E' | 'W') => void
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${rem.toString().padStart(2, '0')}.${Math.floor((ms % 1000) / 10).toString().padStart(2, '0')}`
}

export default function HUD({ elapsedMs, playerPos, endPos, mode, opponentUsername, onMove }: HUDProps) {
  const dist = Math.abs(playerPos.x - endPos.x) + Math.abs(playerPos.y - endPos.y)

  return (
    <>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3 z-10" style={{ background: 'linear-gradient(to bottom, rgba(10,10,15,0.9), transparent)' }}>
        <div className="flex items-center gap-3">
          <span className="font-orbitron text-xs text-gray-400 uppercase tracking-widest">Time</span>
          <span className="font-orbitron text-2xl neon-text-gold">{formatTime(elapsedMs)}</span>
        </div>

        <div className="text-center">
          <span className="font-orbitron text-xs text-gray-400 uppercase tracking-widest block">Distance</span>
          <span className="font-orbitron text-lg neon-text-cyan">{dist} cells</span>
        </div>

        {mode === 'multiplayer' && opponentUsername && (
          <div className="text-right">
            <span className="font-orbitron text-xs text-gray-400 uppercase tracking-widest block">VS</span>
            <span className="font-orbitron text-sm" style={{ color: '#00ffff' }}>{opponentUsername}</span>
          </div>
        )}
      </div>

      {/* Mobile D-pad */}
      <div className="absolute bottom-6 right-6 z-10 grid grid-cols-3 gap-1" style={{ display: 'grid' }}>
        <div />
        <button
          onPointerDown={() => onMove('N')}
          className="neon-btn w-12 h-12 rounded-lg flex items-center justify-center text-lg active:scale-95"
          style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', color: '#ffd700' }}
        >▲</button>
        <div />
        <button
          onPointerDown={() => onMove('W')}
          className="neon-btn w-12 h-12 rounded-lg flex items-center justify-center text-lg active:scale-95"
          style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', color: '#ffd700' }}
        >◄</button>
        <button
          onPointerDown={() => onMove('S')}
          className="neon-btn w-12 h-12 rounded-lg flex items-center justify-center text-lg active:scale-95"
          style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', color: '#ffd700' }}
        >▼</button>
        <button
          onPointerDown={() => onMove('E')}
          className="neon-btn w-12 h-12 rounded-lg flex items-center justify-center text-lg active:scale-95"
          style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', color: '#ffd700' }}
        >►</button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#ffd700', boxShadow: '0 0 6px #ffd700' }} />
          You
        </div>
        {mode === 'solo' && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#ff4444', boxShadow: '0 0 6px #ff4444' }} />
            Enemy
          </div>
        )}
        {mode === 'multiplayer' && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#00ffff', boxShadow: '0 0 6px #00ffff' }} />
            {opponentUsername ?? 'Opponent'}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#ffd700', boxShadow: '0 0 8px #ffd700' }} />
          Exit
        </div>
      </div>
    </>
  )
}
