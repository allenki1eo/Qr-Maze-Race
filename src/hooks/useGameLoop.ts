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

export function useGameLoop(maze: MazeData | null, enemyDifficulty: 'easy' | 'medium' | 'hard' = 'medium') {
  const [state, setState] = useState<GameState>({
    playerPos: { x: 0, y: 0 },
    enemyPos: maze ? { x: maze.width - 1, y: maze.height - 1 } : { x: 0, y: 0 },
    finished: false,
    won: false,
    elapsedMs: 0,
  })

  const startTimeRef = useRef<number | null>(null)
  const enemyPathRef = useRef<{ x: number; y: number }[]>([])
  const enemyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reset = useCallback(() => {
    if (!maze) return
    startTimeRef.current = null
    enemyPathRef.current = []
    clearInterval(enemyTimerRef.current!)
    clearInterval(clockRef.current!)
    setState({
      playerPos: { x: 0, y: 0 },
      enemyPos: { x: maze.width - 1, y: maze.height - 1 },
      finished: false,
      won: false,
      elapsedMs: 0,
    })
  }, [maze])

  const startGame = useCallback(() => {
    if (!maze) return
    startTimeRef.current = Date.now()

    clockRef.current = setInterval(() => {
      setState(s => ({ ...s, elapsedMs: Date.now() - startTimeRef.current! }))
    }, 100)
  }, [maze])

  const movePlayer = useCallback((dir: Direction) => {
    if (!maze) return
    setState(prev => {
      if (prev.finished) return prev
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now()
      }

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

      if (finished) {
        clearInterval(enemyTimerRef.current!)
        clearInterval(clockRef.current!)
      }

      return { ...prev, playerPos: newPos, finished, won: finished }
    })
  }, [maze])

  // Enemy AI tick
  useEffect(() => {
    if (!maze) return
    const intervalMs = enemyDifficulty === 'hard' ? 200 : enemyDifficulty === 'medium' ? 400 : 700

    enemyTimerRef.current = setInterval(() => {
      setState(prev => {
        if (prev.finished) return prev

        const path = astar(maze, prev.enemyPos, prev.playerPos)
        if (path.length > 1) {
          const next = path[1]
          const hitPlayer = next.x === prev.playerPos.x && next.y === prev.playerPos.y
          if (hitPlayer) {
            clearInterval(enemyTimerRef.current!)
            clearInterval(clockRef.current!)
            return { ...prev, enemyPos: next, finished: true, won: false }
          }
          return { ...prev, enemyPos: next }
        }
        return prev
      })
    }, intervalMs)

    return () => {
      clearInterval(enemyTimerRef.current!)
      clearInterval(clockRef.current!)
    }
  }, [maze, enemyDifficulty])

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

  return { state, movePlayer, reset, startGame }
}
