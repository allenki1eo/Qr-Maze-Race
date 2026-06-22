import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { MazeData } from '../lib/mazeGenerator'

const CELL = 2
const WALL_H = 1.8
const WALL_T = 0.28

// Fixed top-down camera — no OrbitControls so touch events reach our overlay
function FixedCamera({ cx, cz, size }: { cx: number; cz: number; size: number }) {
  const { camera } = useThree()
  useEffect(() => {
    const height = size * 1.6
    camera.position.set(cx, height, cz + size * 0.08)
    ;(camera as THREE.PerspectiveCamera).fov = 58
    camera.up.set(0, 0, -1)
    camera.lookAt(cx, 0, cz)
    camera.updateProjectionMatrix()
  }, [camera, cx, cz, size])
  return null
}

interface MazeWallsProps { maze: MazeData }

function MazeWalls({ maze }: MazeWallsProps) {
  const walls = useMemo(() => {
    const result: { pos: [number, number, number]; scale: [number, number, number] }[] = []
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.grid[y][x]
        const cx = x * CELL
        const cz = y * CELL
        if (cell.walls.N)
          result.push({ pos: [cx, WALL_H / 2, cz - CELL / 2], scale: [CELL + WALL_T, WALL_H, WALL_T] })
        if (cell.walls.W)
          result.push({ pos: [cx - CELL / 2, WALL_H / 2, cz], scale: [WALL_T, WALL_H, CELL + WALL_T] })
        if (y === maze.height - 1 && cell.walls.S)
          result.push({ pos: [cx, WALL_H / 2, cz + CELL / 2], scale: [CELL + WALL_T, WALL_H, WALL_T] })
        if (x === maze.width - 1 && cell.walls.E)
          result.push({ pos: [cx + CELL / 2, WALL_H / 2, cz], scale: [WALL_T, WALL_H, CELL + WALL_T] })
      }
    }
    return result
  }, [maze])

  return (
    <>
      {walls.map((w, i) => (
        <mesh key={i} position={w.pos} scale={w.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#1a2040" emissive="#0055cc" emissiveIntensity={0.6} roughness={0.2} metalness={0.9} />
        </mesh>
      ))}
    </>
  )
}

function Floor({ maze }: { maze: MazeData }) {
  const size = Math.max(maze.width, maze.height) * CELL + CELL * 2
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(maze.width - 1) * CELL / 2, -0.02, (maze.height - 1) * CELL / 2]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#060810" roughness={1} />
    </mesh>
  )
}

function StartMarker({ maze }: { maze: MazeData }) {
  return (
    <mesh position={[maze.start.x * CELL, 0.04, maze.start.y * CELL]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.55, 24]} />
      <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} />
    </mesh>
  )
}

function EndMarker({ maze }: { maze: MazeData }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 2
  })
  return (
    <mesh ref={ref} position={[maze.end.x * CELL, 0.45, maze.end.y * CELL]}>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={3} />
    </mesh>
  )
}

function PlayerCube({ pos, color }: { pos: { x: number; y: number }; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 0.38 + Math.sin(clock.getElapsedTime() * 5) * 0.06
  })
  return (
    <mesh ref={ref} position={[pos.x * CELL, 0.38, pos.y * CELL]} castShadow>
      <boxGeometry args={[0.65, 0.65, 0.65]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} roughness={0.1} metalness={0.8} />
    </mesh>
  )
}

interface ThreeSceneProps {
  maze: MazeData
  playerPos: { x: number; y: number }
  enemyPos?: { x: number; y: number }
  guestPos?: { x: number; y: number }
  showEnemy?: boolean
  showGuest?: boolean
}

export default function ThreeScene({ maze, playerPos, enemyPos, guestPos, showEnemy, showGuest }: ThreeSceneProps) {
  const cx = ((maze.width - 1) * CELL) / 2
  const cz = ((maze.height - 1) * CELL) / 2
  const size = Math.max(maze.width, maze.height) * CELL

  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 58, near: 0.1, far: 500, position: [cx, size * 1.6, cz] }}
      style={{ pointerEvents: 'none' }} // canvas never gets pointer events — overlay handles touch
    >
      <FixedCamera cx={cx} cz={cz} size={size} />

      <color attach="background" args={['#080810']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[cx, 30, cz]} intensity={1.2} />
      <pointLight position={[playerPos.x * CELL, 4, playerPos.y * CELL]} color="#ffd700" intensity={4} distance={10} />
      <pointLight position={[maze.end.x * CELL, 4, maze.end.y * CELL]} color="#ffd700" intensity={6} distance={12} />

      <Floor maze={maze} />
      <MazeWalls maze={maze} />
      <StartMarker maze={maze} />
      <EndMarker maze={maze} />

      <PlayerCube pos={playerPos} color="#ffd700" />
      {showEnemy && enemyPos && <PlayerCube pos={enemyPos} color="#ff4444" />}
      {showGuest && guestPos && <PlayerCube pos={guestPos} color="#00ffff" />}
    </Canvas>
  )
}
