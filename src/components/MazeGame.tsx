import { Suspense, useRef } from 'react'
import ThreeScene from './ThreeScene'
import HUD from './HUD'
import VictoryScreen from './VictoryScreen'
import { useGameLoop } from '../hooks/useGameLoop'
import { useSwipe } from '../hooks/useSwipe'
import type { MazeData } from '../lib/mazeGenerator'

interface MazeGameProps {
  maze: MazeData
  difficulty: 'easy' | 'medium' | 'hard'
  onMenu: () => void
}

export default function MazeGame({ maze, difficulty, onMenu }: MazeGameProps) {
  const { state, movePlayer, reset } = useGameLoop(maze, difficulty)
  const swipeRef = useRef<HTMLDivElement>(null)
  useSwipe(movePlayer, swipeRef)

  return (
    <div ref={swipeRef} className="relative w-full h-full" style={{ touchAction: 'none' }}>
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-orbitron text-lg neon-text-cyan">Loading 3D Scene...</span>
        </div>
      }>
        <ThreeScene
          maze={maze}
          playerPos={state.playerPos}
          enemyPos={state.enemyPos}
          showEnemy
        />
      </Suspense>

      <HUD
        elapsedMs={state.elapsedMs}
        playerPos={state.playerPos}
        endPos={maze.end}
        mode="solo"
        onMove={movePlayer}
        liveData={{ myPos: state.playerPos }}
      />

      {state.finished && (
        <VictoryScreen
          won={state.won}
          elapsedMs={state.elapsedMs}
          mode="solo"
          onPlayAgain={reset}
          onMenu={onMenu}
        />
      )}
    </div>
  )
}
