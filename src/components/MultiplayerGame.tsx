import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import ThreeScene from './ThreeScene'
import HUD from './HUD'
import VictoryScreen from './VictoryScreen'
import type { MazeData } from '../lib/mazeGenerator'
import type { Direction } from '../hooks/useGameLoop'

interface MultiplayerGameProps {
  maze: MazeData
  isHost: boolean
  myUsername: string
  opponentUsername: string
  roomCode: string
  onMenu: () => void
}

// Shared race state simulation (in-memory bus — Convex mutations replace this in prod)
const raceState: Record<string, {
  hostPos: { x: number; y: number }
  guestPos: { x: number; y: number }
  hostFinished: boolean
  guestFinished: boolean
  hostTime?: number
  guestTime?: number
  startTime: number
}> = {}

export default function MultiplayerGame({
  maze,
  isHost,
  myUsername: _myUsername,
  opponentUsername,
  roomCode,
  onMenu,
}: MultiplayerGameProps) {
  const [myPos, setMyPos] = useState({ x: 0, y: 0 })
  const [opponentPos, setOpponentPos] = useState({ x: 0, y: 0 })
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finished, setFinished] = useState(false)
  const [won, setWon] = useState(false)
  const [opponentTime, setOpponentTime] = useState<number | undefined>()
  const [countdown, setCountdown] = useState<number | null>(3)

  const startTimeRef = useRef<number>(0)
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const syncRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Initialize shared state
  useEffect(() => {
    if (!raceState[roomCode]) {
      raceState[roomCode] = {
        hostPos: { x: 0, y: 0 },
        guestPos: { x: 0, y: 0 },
        hostFinished: false,
        guestFinished: false,
        startTime: Date.now() + 3500,
      }
    }
  }, [roomCode])

  // Countdown then start
  useEffect(() => {
    let n = 3
    setCountdown(n)
    const t = setInterval(() => {
      n -= 1
      if (n <= 0) {
        clearInterval(t)
        setCountdown(null)
        startTimeRef.current = Date.now()
        clockRef.current = setInterval(() => {
          setElapsedMs(Date.now() - startTimeRef.current)
        }, 100)
      } else {
        setCountdown(n)
      }
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Sync opponent position
  useEffect(() => {
    syncRef.current = setInterval(() => {
      const state = raceState[roomCode]
      if (!state) return
      const theirPos = isHost ? state.guestPos : state.hostPos
      setOpponentPos({ ...theirPos })

      const theyFinished = isHost ? state.guestFinished : state.hostFinished
      if (theyFinished && !finished) {
        const theirTime = isHost ? state.guestTime : state.hostTime
        setOpponentTime(theirTime)
      }
    }, 100)
    return () => clearInterval(syncRef.current!)
  }, [roomCode, isHost, finished])

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

      // Push to shared state
      const state = raceState[roomCode]
      if (state) {
        if (isHost) state.hostPos = newPos
        else state.guestPos = newPos
      }

      // Check win
      if (nx === maze.end.x && ny === maze.end.y) {
        const myTime = Date.now() - startTimeRef.current
        if (state) {
          if (isHost) { state.hostFinished = true; state.hostTime = myTime }
          else { state.guestFinished = true; state.guestTime = myTime }
        }
        const opponentAlreadyFinished = state ? (isHost ? state.guestFinished : state.hostFinished) : false
        setFinished(true)
        setWon(!opponentAlreadyFinished)
        clearInterval(clockRef.current!)
        clearInterval(syncRef.current!)
      }

      return newPos
    })
  }, [maze, roomCode, isHost, countdown, finished])

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

  return (
    <div className="relative w-full h-full">
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
      />

      {/* Countdown overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none" style={{ background: 'rgba(10,10,15,0.6)' }}>
          <div
            key={countdown}
            className="font-orbitron font-black neon-text-gold"
            style={{
              fontSize: '15vw',
              animation: 'countdown 0.9s ease-in-out forwards',
            }}
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
          onPlayAgain={() => {
            delete raceState[roomCode]
            onMenu()
          }}
          onMenu={() => {
            delete raceState[roomCode]
            onMenu()
          }}
        />
      )}
    </div>
  )
}
