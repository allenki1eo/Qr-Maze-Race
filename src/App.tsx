import { useState, useCallback } from 'react'
import './index.css'
import QRScanner from './components/QRScanner'
import MazeGame from './components/MazeGame'
import MultiplayerLobby from './components/MultiplayerLobby'
import MultiplayerGame from './components/MultiplayerGame'
import Leaderboard from './components/Leaderboard'
import { generateMaze, deserializeMaze, type MazeData } from './lib/mazeGenerator'
import type { Id } from '../convex/_generated/dataModel'

type Screen =
  | 'landing'
  | 'username'
  | 'qrSolo'
  | 'soloGame'
  | 'multiLobby'
  | 'multiGame'
  | 'leaderboard'

interface MultiRoomParams {
  roomId: Id<'gameRooms'>
  roomCode: string
  qrData: string
  mazeData: string
  isHost: boolean
  guestUsername?: string
  hostUsername?: string
}

function ParticleBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            left: `${(i * 5.3) % 100}%`,
            top: `${(i * 7.7) % 100}%`,
            background: i % 3 === 0 ? '#00ffff' : i % 3 === 1 ? '#ffd700' : '#9b59b6',
            opacity: 0.15 + (i % 5) * 0.05,
            animation: `drift ${4 + (i % 6)}s linear ${i * 0.4}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes drift {
          0%  { transform: translateY(0)   scale(1); opacity: 0.2; }
          50% { opacity: 0.5; }
          100%{ transform: translateY(-80px) scale(0.5); opacity: 0; }
        }
        @keyframes countdown {
          0%   { transform: scale(2.5); opacity: 0; }
          30%  { transform: scale(1);   opacity: 1; }
          70%  { transform: scale(1);   opacity: 1; }
          100% { transform: scale(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [username, setUsername] = useState('')
  const [usernameInput, setUsernameInput] = useState('')
  const [pendingScreen, setPendingScreen] = useState<Screen>('qrSolo')
  const [maze, setMaze] = useState<MazeData | null>(null)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [multiParams, setMultiParams] = useState<MultiRoomParams | null>(null)

  const goToUsername = useCallback((next: Screen) => {
    if (username) {
      setScreen(next)
    } else {
      setPendingScreen(next)
      setScreen('username')
    }
  }, [username])

  const handleUsernameSubmit = useCallback(() => {
    const name = usernameInput.trim()
    if (!name) return
    setUsername(name)
    setScreen(pendingScreen)
  }, [usernameInput, pendingScreen])

  const handleQRDecoded = useCallback((qrData: string) => {
    const m = generateMaze(qrData)
    setMaze(m)
    setScreen('soloGame')
  }, [])

  const handleRoomReady = useCallback((params: MultiRoomParams) => {
    const m = deserializeMaze(params.mazeData)
    setMaze(m)
    setMultiParams(params)
    setScreen('multiGame')
  }, [])

  return (
    <div className="relative w-full h-full grid-bg flex items-center justify-center overflow-hidden">
      <ParticleBg />

      {/* LANDING */}
      {screen === 'landing' && (
        <div className="relative z-10 flex flex-col items-center gap-8 px-4 text-center max-w-sm w-full">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-6xl mb-2" style={{ filter: 'drop-shadow(0 0 16px #ffd700)' }}>⬛</div>
            <h1 className="font-orbitron text-4xl font-black neon-text-gold leading-tight">
              QR MAZE<br />RACE
            </h1>
            <p className="font-orbitron text-xs text-gray-400 uppercase tracking-widest">
              Scan. Generate. Race.
            </p>
          </div>

          {/* Main CTA buttons */}
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => goToUsername('qrSolo')}
              className="neon-btn w-full py-4 rounded-xl font-orbitron text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all"
              style={{ background: 'rgba(255,215,0,0.15)', border: '2px solid #ffd700', color: '#ffd700', boxShadow: '0 0 20px rgba(255,215,0,0.2)' }}
            >
              ⚔ Solo vs AI
            </button>

            <button
              onClick={() => goToUsername('multiLobby')}
              className="neon-btn w-full py-4 rounded-xl font-orbitron text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all"
              style={{ background: 'rgba(0,255,255,0.1)', border: '2px solid #00ffff', color: '#00ffff', boxShadow: '0 0 20px rgba(0,255,255,0.15)' }}
            >
              👥 Play with Friend
            </button>

            <button
              onClick={() => setScreen('leaderboard')}
              className="neon-btn w-full py-3 rounded-xl font-orbitron text-sm uppercase tracking-widest hover:scale-105 transition-all"
              style={{ background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.6)', color: '#9b59b6' }}
            >
              🏆 Leaderboard
            </button>
          </div>

          {/* Difficulty selector */}
          <div className="w-full">
            <p className="font-orbitron text-xs text-gray-500 uppercase tracking-widest mb-2">AI Difficulty</p>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="flex-1 py-2 rounded-lg font-orbitron text-xs uppercase tracking-widest transition-all"
                  style={{
                    background: difficulty === d ? (d === 'easy' ? 'rgba(0,255,136,0.2)' : d === 'medium' ? 'rgba(255,215,0,0.2)' : 'rgba(255,68,68,0.2)') : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${difficulty === d ? (d === 'easy' ? '#00ff88' : d === 'medium' ? '#ffd700' : '#ff4444') : 'rgba(255,255,255,0.1)'}`,
                    color: difficulty === d ? (d === 'easy' ? '#00ff88' : d === 'medium' ? '#ffd700' : '#ff4444') : '#555',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* USERNAME */}
      {screen === 'username' && (
        <div className="relative z-10 flex flex-col items-center gap-6 px-4 max-w-sm w-full">
          <h2 className="font-orbitron text-xl font-bold neon-text-gold uppercase tracking-widest">Enter Your Name</h2>
          <p className="font-orbitron text-xs text-gray-400 text-center">Your call sign in the maze race.</p>

          <input
            type="text"
            maxLength={20}
            value={usernameInput}
            onChange={e => setUsernameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUsernameSubmit()}
            placeholder="PLAYER ONE"
            autoFocus
            className="w-full text-center font-orbitron text-xl font-bold py-4 rounded-xl bg-transparent outline-none uppercase tracking-widest"
            style={{ border: '2px solid rgba(255,215,0,0.5)', color: '#ffd700', caretColor: '#ffd700' }}
          />

          <button
            onClick={handleUsernameSubmit}
            disabled={!usernameInput.trim()}
            className="neon-btn w-full py-4 rounded-xl font-orbitron text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-40"
            style={{ background: 'rgba(255,215,0,0.15)', border: '2px solid #ffd700', color: '#ffd700' }}
          >
            Continue →
          </button>

          <button onClick={() => setScreen('landing')} className="font-orbitron text-xs text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest">
            ← Back
          </button>
        </div>
      )}

      {/* QR SOLO */}
      {screen === 'qrSolo' && (
        <div className="relative z-10 flex flex-col items-center gap-6 px-4 max-w-sm w-full">
          <div className="text-center">
            <h2 className="font-orbitron text-xl font-bold neon-text-gold uppercase tracking-widest mb-1">Choose Your Maze</h2>
            <p className="font-orbitron text-xs text-gray-400">Generate a random QR or upload one.</p>
          </div>
          <QRScanner onQRDecoded={handleQRDecoded} />
          <button onClick={() => setScreen('landing')} className="font-orbitron text-xs text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest">
            ← Back
          </button>
        </div>
      )}

      {/* SOLO GAME */}
      {screen === 'soloGame' && maze && (
        <div className="absolute inset-0 z-20">
          <MazeGame
            maze={maze}
            difficulty={difficulty}
            onMenu={() => setScreen('landing')}
          />
        </div>
      )}

      {/* MULTI LOBBY */}
      {screen === 'multiLobby' && (
        <div className="relative z-10">
          <MultiplayerLobby
            username={username}
            onRoomReady={handleRoomReady}
            onBack={() => setScreen('landing')}
          />
        </div>
      )}

      {/* MULTI GAME */}
      {screen === 'multiGame' && maze && multiParams && (
        <div className="absolute inset-0 z-20">
          <MultiplayerGame
            maze={maze}
            roomId={multiParams.roomId}
            isHost={multiParams.isHost}
            myUsername={username}
            opponentUsername={multiParams.isHost ? (multiParams.guestUsername ?? 'Guest') : (multiParams.hostUsername ?? 'Host')}
            onMenu={() => setScreen('landing')}
          />
        </div>
      )}

      {/* LEADERBOARD */}
      {screen === 'leaderboard' && (
        <div className="absolute inset-0 z-20">
          <Leaderboard
            entries={[]}
            onClose={() => setScreen('landing')}
          />
        </div>
      )}
    </div>
  )
}
