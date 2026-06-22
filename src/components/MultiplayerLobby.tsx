import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { generateRoomCode, qrDataToDataURL } from '../lib/qrUtils'
import { generateMaze, serializeMaze } from '../lib/mazeGenerator'
import type { Id } from '../../convex/_generated/dataModel'
import QRScanner from './QRScanner'

type LobbyStep = 'choose' | 'createQR' | 'waitingRoom' | 'joinRoom'

interface MultiplayerLobbyProps {
  username: string
  onRoomReady: (params: {
    roomId: Id<'gameRooms'>
    roomCode: string
    qrData: string
    mazeData: string
    isHost: boolean
    guestUsername?: string
    hostUsername?: string
  }) => void
  onBack: () => void
}

export default function MultiplayerLobby({ username, onRoomReady, onBack }: MultiplayerLobbyProps) {
  const [step, setStep] = useState<LobbyStep>('choose')
  const [roomCode, setRoomCode] = useState('')
  const [roomId, setRoomId] = useState<Id<'gameRooms'> | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [qrData, setQrData] = useState('')
  const [mazeData, setMazeData] = useState('')
  const [hostQrUrl, setHostQrUrl] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  const createRoom = useMutation(api.gameRooms.create)
  const joinRoom = useMutation(api.gameRooms.join)

  // Poll the room we created, waiting for a guest to join
  const room = useQuery(
    api.gameRooms.getById,
    roomId ? { roomId } : 'skip'
  )

  // When guest joins, transition to game
  useEffect(() => {
    if (!room || !roomId) return
    if (room.guestId && room.guestUsername && step === 'waitingRoom') {
      onRoomReady({
        roomId,
        roomCode,
        qrData,
        mazeData,
        isHost: true,
        guestUsername: room.guestUsername,
      })
    }
  }, [room, roomId, roomCode, qrData, mazeData, step, onRoomReady])

  const handleQRDecoded = useCallback(async (qd: string) => {
    setError('')
    const m = generateMaze(qd)
    const md = serializeMaze(m)
    setQrData(qd)
    setMazeData(md)

    const code = generateRoomCode()
    setRoomCode(code)

    const id = await createRoom({
      roomCode: code,
      qrData: qd,
      mazeData: md,
      hostId: username,
      hostUsername: username,
    })
    setRoomId(id)
    qrDataToDataURL(code).then(setHostQrUrl)
    setStep('waitingRoom')
  }, [username, createRoom])

  const handleJoin = useCallback(async () => {
    setError('')
    setJoining(true)
    try {
      const id = await joinRoom({
        roomCode: joinCode.trim(),
        guestId: username,
        guestUsername: username,
      })
      // Fetch room data to get qrData/mazeData
      setRoomId(id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to join room')
      setJoining(false)
    }
  }, [joinCode, username, joinRoom])

  // After joining as guest, get the room data and transition
  const joinedRoom = useQuery(
    api.gameRooms.getById,
    roomId && joining ? { roomId } : 'skip'
  )
  useEffect(() => {
    if (!joinedRoom || !joining || !roomId) return
    if (joinedRoom.guestId === username) {
      onRoomReady({
        roomId,
        roomCode: joinedRoom.roomCode,
        qrData: joinedRoom.qrData,
        mazeData: joinedRoom.mazeData,
        isHost: false,
        hostUsername: joinedRoom.hostUsername,
      })
    }
  }, [joinedRoom, joining, roomId, username, onRoomReady])

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4">
      {step === 'choose' && (
        <>
          <h2 className="font-orbitron text-xl font-bold neon-text-cyan uppercase tracking-widest">Multiplayer</h2>
          <p className="font-orbitron text-xs text-gray-400 text-center">Race a friend through the same maze in real-time.</p>

          <button
            onClick={() => setStep('createQR')}
            className="neon-btn w-full py-4 rounded-xl font-orbitron text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all"
            style={{ background: 'rgba(255,215,0,0.15)', border: '2px solid #ffd700', color: '#ffd700' }}
          >
            ＋ Create Room
          </button>

          <button
            onClick={() => setStep('joinRoom')}
            className="neon-btn w-full py-4 rounded-xl font-orbitron text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all"
            style={{ background: 'rgba(0,255,255,0.1)', border: '2px solid #00ffff', color: '#00ffff' }}
          >
            → Join Room
          </button>

          <button onClick={onBack} className="font-orbitron text-xs text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest">
            ← Back
          </button>
        </>
      )}

      {step === 'createQR' && (
        <>
          <h2 className="font-orbitron text-xl font-bold neon-text-gold uppercase tracking-widest">Choose Your Maze</h2>
          <p className="font-orbitron text-xs text-gray-400 text-center">The QR code determines the maze layout.</p>
          <QRScanner onQRDecoded={handleQRDecoded} />
          <button onClick={() => setStep('choose')} className="font-orbitron text-xs text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest">
            ← Back
          </button>
        </>
      )}

      {step === 'waitingRoom' && (
        <>
          <h2 className="font-orbitron text-xl font-bold neon-text-gold uppercase tracking-widest">Waiting for Opponent</h2>

          <div
            className="rounded-xl px-8 py-5 text-center"
            style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.4)' }}
          >
            <p className="font-orbitron text-xs text-gray-400 uppercase tracking-widest mb-2">Room Code</p>
            <p className="font-orbitron text-5xl font-black neon-text-gold tracking-widest">{roomCode}</p>
            <p className="font-orbitron text-xs text-gray-500 mt-2">Share this code with your friend</p>
          </div>

          {hostQrUrl && (
            <div className="text-center">
              <p className="font-orbitron text-xs text-gray-500 mb-2 uppercase tracking-widest">Or scan to join</p>
              <img src={hostQrUrl} alt="Room QR" width={120} height={120} className="rounded-xl mx-auto" style={{ border: '1px solid rgba(0,255,255,0.3)' }} />
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#00ff88' }} />
            <span className="font-orbitron text-sm text-gray-300">Waiting for player 2...</span>
          </div>

          <button onClick={onBack} className="font-orbitron text-xs text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest">
            ✕ Cancel
          </button>
        </>
      )}

      {step === 'joinRoom' && (
        <>
          <h2 className="font-orbitron text-xl font-bold neon-text-cyan uppercase tracking-widest">Join Room</h2>
          <p className="font-orbitron text-xs text-gray-400 text-center">Enter the 6-digit room code from your friend.</p>

          <input
            type="text"
            maxLength={6}
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center font-orbitron text-4xl font-black py-4 rounded-xl bg-transparent outline-none tracking-widest"
            style={{ border: '2px solid rgba(0,255,255,0.5)', color: '#00ffff', caretColor: '#00ffff' }}
          />

          {error && <p className="font-orbitron text-xs text-red-400 text-center">{error}</p>}

          <button
            onClick={handleJoin}
            disabled={joinCode.length !== 6 || joining}
            className="neon-btn w-full py-4 rounded-xl font-orbitron text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'rgba(0,255,255,0.15)', border: '2px solid #00ffff', color: '#00ffff' }}
          >
            {joining ? 'Joining...' : 'Join →'}
          </button>

          <button onClick={() => setStep('choose')} className="font-orbitron text-xs text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest">
            ← Back
          </button>
        </>
      )}
    </div>
  )
}
