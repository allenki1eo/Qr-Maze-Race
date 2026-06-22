import { useState, useEffect, useCallback, useRef } from 'react'
import type { MazeData } from '../lib/mazeGenerator'
import { astar } from '../lib/pathfinding'

export type Direction = 'N' | 'S' | 'E' | 'W'

interface GameState {
  playerPos: { x: number; y: number }
  enemyPos: { x: number; y: number }
  finished: boolean
  won: boolean
  elapsedMs: number
}

const ENEMY_GRACE_MS = 2500 // enemy waits this long before first move

export function useGameLoop(maze: MazeData | null, enemyDifficulty: 'easy' | 'medium' | 'hard' = 'medium') {
  const [state, setState] = useState<GameState>({
    playerPos: { x: 0, y: 0 },
    enemyPos: maze ? { x: maze.width - 1, y: maze.height - 1 } : { x: 0, y: 0 },
    finished: false,
    won: false,
    elapsedMs: 0,
  })

  const startTimeRef = useRef<number>(Date.now())
  const enemyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const enemyStartedRef = useRef(false)

  const stopAll = useCallback(() => {
    clearInterval(enemyTimerRef.current!)
    clearInterval(clockRef.current!)
  }, [])

  const reset = useCallback(() => {
    if (!maze) return
    stopAll()
    enemyStartedRef.current = false
    startTimeRef.current = Date.now()
    setState({
      playerPos: { x: 0, y: 0 },
      enemyPos: { x: maze.width - 1, y: maze.height - 1 },
      finished: false,
      won: false,
      elapsedMs: 0,
    })
  }, [maze, stopAll])

  // Auto-start clock as soon as maze is ready
  useEffect(() => {
    if (!maze) return
    startTimeRef.current = Date.now()
    clockRef.current = setInterval(() => {
      setState(s => {
        if (s.finished) return s
        return { ...s, elapsedMs: Date.now() - startTimeRef.current }
      })
    }, 100)
    return () => clearInterval(clockRef.current!)
  }, [maze])

  const movePlayer = useCallback((dir: Direction) => {
    if (!maze) return
    setState(prev => {
      if (prev.finished) return prev

      const { x, y } = prev.playerPos
      const cell = maze.grid[y][x]
      let nx = x, ny = y

      if (dir === 'N' && !cell.walls.N) ny -= 1
      if (dir === 'S' && !cell.walls.S) ny += 1
      if (dir === 'W' && !cell.walls.W) nx -= 1
      if (dir === 'E' && !cell.walls.E) nx += 1

      if (nx === x && ny === y) return prev

      const newPos = { x: nx, y: ny }
      const finished = nx === maze.end.x && ny === maze.end.y

      if (finished) stopAll()

      return { ...prev, playerPos: newPos, finished, won: finished }
    })
  }, [maze, stopAll])

  // Enemy AI — starts after grace period
  useEffect(() => {
    if (!maze) return
    const intervalMs = enemyDifficulty === 'hard' ? 200 : enemyDifficulty === 'medium' ? 400 : 700

    const graceTimer = setTimeout(() => {
      enemyStartedRef.current = true
      enemyTimerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.finished) return prev

          const path = astar(maze, prev.enemyPos, prev.playerPos)
          if (path.length > 1) {
            const next = path[1]
            const hitPlayer = next.x === prev.playerPos.x && next.y === prev.playerPos.y
            if (hitPlayer) {
              stopAll()
              return { ...prev, enemyPos: next, finished: true, won: false }
            }
            return { ...prev, enemyPos: next }
          }
          return prev
        })
      }, intervalMs)
    }, ENEMY_GRACE_MS)

    return () => {
      clearTimeout(graceTimer)
      clearInterval(enemyTimerRef.current!)
    }
  }, [maze, enemyDifficulty, stopAll])

  // Keyboard listener
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'N', w: 'N', W: 'N',
        ArrowDown: 'S', s: 'S', S: 'S',
        ArrowLeft: 'W', a: 'W', A: 'W',
        ArrowRight: 'E', d: 'E', D: 'E',
      }
      const dir = map[e.key]
      if (dir) {
        e.preventDefault()
        movePlayer(dir)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [movePlayer])

  return { state, movePlayer, reset }
}
