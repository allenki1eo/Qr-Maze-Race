interface LeaderboardEntry {
  username: string
  completionTime: number
  difficulty: string
  score: number
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  onClose: () => void
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

const DIFF_COLOR: Record<string, string> = {
  easy: '#00ff88',
  medium: '#ffd700',
  hard: '#ff4444',
}

export default function Leaderboard({ entries, onClose }: LeaderboardProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(10,10,15,0.95)' }}>
      <div className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,215,0,0.3)', background: '#12121a' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,215,0,0.2)' }}>
          <h2 className="font-orbitron text-lg font-bold neon-text-gold uppercase tracking-widest">Leaderboard</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl">✕</button>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-4xl">🏁</span>
            <p className="font-orbitron text-sm text-gray-500">No runs yet. Be the first!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {entries.map((e, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <span
                  className="font-orbitron text-lg font-black w-8 text-center"
                  style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#555' }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-orbitron text-sm text-white truncate">{e.username}</p>
                  <p className="font-orbitron text-xs text-gray-500">{formatTime(e.completionTime)}</p>
                </div>
                <span
                  className="font-orbitron text-xs uppercase px-2 py-1 rounded"
                  style={{ color: DIFF_COLOR[e.difficulty] ?? '#888', background: `${DIFF_COLOR[e.difficulty] ?? '#888'}22` }}
                >
                  {e.difficulty}
                </span>
                <span className="font-orbitron text-base font-bold neon-text-gold">{e.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
