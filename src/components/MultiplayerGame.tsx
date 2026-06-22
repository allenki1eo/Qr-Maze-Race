import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import ThreeScene from './ThreeScene'
import HUD from './HUD'
import VictoryScreen from './VictoryScreen'
import type { MazeData } from '../lib/mazeGenerator'
import type { Direction } from '../hooks/useGameLoop'
import { useSwipe } from '../hooks/useSwipe'

interface MultiplayerGameProps {
  maze: MazeData
  roomId: Id<'gameRooms'>
  isHost: boolean
  myUsername: string
  opponentUsername: string
  onMenu: () => void
}

export default function MultiplayerGame({
  maze,
  roomId,
  isHost,
  myUsername: _myUsername,
  opponentUsername,
  onMenu,
}: MultiplayerGameProps) {
  const [myPos, setMyPos] = useState({ x: 0, y: 0 })
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finished, setFinished] = useState(false)
  const [won, setWon] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(3)

  const startTimeRef = useRef<number>(0)
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSyncRef = useRef<number>(0)
  const swipeRef = useRef<HTMLDivElement>(null)

  const updateHostPos = useMutation(api.gameRooms.updateHostPos)
  const updateGuestPos = useMutation(api.gameRooms.updateGuestPos)
  const finishHost = useMutation(api.gameRooms.finishHost)
  const finishGuest = useMutation(api.gameRooms.finishGuest)
  const startRace = useMutation(api.gameRooms.startRace)

  const room = useQuery(api.gameRooms.getById, { roomId })

  const opponentPos = room
    ? (isHost ? room.guestPos ?? { x: 0, y: 0 } : room.hostPos)
    : { x: 0, y: 0 }

  const opponentTime = room
    ? (isHost ? room.guestTime : room.hostTime)
    : undefined

  // Countdown → start
  useEffect(() => {
    let n = 3
    setCountdown(n)
    const t = setInterval(() => {
      n -= 1
      if (n <= 0) {
        clearInterval(t)
        setCountdown(null)
        startTimeRef.current = Date.now()
        if (isHost) startRace({ roomId })
        clockRef.current = setInterval(() => {
          setElapsedMs(Date.now() - startTimeRef.current)
        }, 100)
      } else {
        setCountdown(n)
      }
    }, 1000)
    return () => clearInterval(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Watch for opponent finishing (real-time via Convex subscription)
  useEffect(() => {
    if (!room || finished) return
    const theyFinished = isHost ? room.guestFinished : room.hostFinished
    if (theyFinished && !finished) {
      // We haven't finished yet, so they won
      setFinished(true)
      setWon(false)
      clearInterval(clockRef.current!)
    }
  }, [room, finished, isHost])

  const handleMove = useCallback((dir: Direction) => {
    if (countdown !== null || finished) return

    setMyPos(prev => {
      const { x, y } = prev
      const cell = maze.grid[y][x]
      let nx = x, ny = y

      if (dir === 'N' && !cell.walls.N) ny -= 1
      if (dir === 'S' && !cell.walls.S) ny += 1
      if (dir === 'W' && !cell.walls.W) nx -= 1
      if (dir === 'E' && !cell.walls.E) nx += 1

      if (nx === x && ny === y) return prev

      const newPos = { x: nx, y: ny }

      // Throttle Convex sync to ~10 updates/sec
      const now = Date.now()
      if (now - lastSyncRef.current > 100) {
        lastSyncRef.current = now
        if (isHost) updateHostPos({ roomId, pos: newPos })
        else updateGuestPos({ roomId, pos: newPos })
      }

      // Check win
      if (nx === maze.end.x && ny === maze.end.y) {
        if (isHost) finishHost({ roomId })
        else finishGuest({ roomId })
        setFinished(true)
        setWon(true)
        clearInterval(clockRef.current!)
      }

      return newPos
    })
  }, [maze, roomId, isHost, countdown, finished, updateHostPos, updateGuestPos, finishHost, finishGuest])

  // Swipe (mobile)
  useSwipe(handleMove, swipeRef)

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'N', w: 'N', W: 'N',
        ArrowDown: 'S', s: 'S', S: 'S',
        ArrowLeft: 'W', a: 'W', A: 'W',
        ArrowRight: 'E', d: 'E', D: 'E',
      }
      const dir = map[e.key]
      if (dir) { e.preventDefault(); handleMove(dir) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleMove])

  const liveData = {
    roomCode: room?.roomCode,
    myPos,
    opponentPos,
    roomStatus: room?.status,
  }

  return (
    <div ref={swipeRef} className="relative w-full h-full" style={{ touchAction: 'none' }}>
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-orbitron text-lg neon-text-cyan">Loading 3D Scene...</span>
        </div>
      }>
        <ThreeScene
          maze={maze}
          playerPos={myPos}
          guestPos={opponentPos}
          showGuest
        />
      </Suspense>

      <HUD
        elapsedMs={elapsedMs}
        playerPos={myPos}
        endPos={maze.end}
        mode="multiplayer"
        opponentUsername={opponentUsername}
        onMove={handleMove}
        liveData={liveData}
      />

      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none" style={{ background: 'rgba(10,10,15,0.6)' }}>
          <div
            key={countdown}
            className="font-orbitron font-black neon-text-gold"
            style={{ fontSize: '15vw', animation: 'countdown 0.9s ease-in-out forwards' }}
          >
            {countdown === 0 ? 'GO!' : countdown}
          </div>
        </div>
      )}

      {finished && (
        <VictoryScreen
          won={won}
          elapsedMs={elapsedMs}
          opponentUsername={opponentUsername}
          opponentTime={opponentTime}
          mode="multiplayer"
          onPlayAgain={onMenu}
          onMenu={onMenu}
        />
      )}
    </div>
  )
}
