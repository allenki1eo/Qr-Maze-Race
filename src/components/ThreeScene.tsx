import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { MazeData } from '../lib/mazeGenerator'

const CELL = 2   // world units per cell
const WALL_H = 1.5
const WALL_T = 0.15

interface MazeWallsProps {
  maze: MazeData
}

function MazeWalls({ maze }: MazeWallsProps) {
  const walls = useMemo(() => {
    const result: { pos: [number, number, number]; scale: [number, number, number] }[] = []

    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.grid[y][x]
        const cx = x * CELL
        const cz = y * CELL

        // North wall
        if (cell.walls.N) {
          result.push({
            pos: [cx, WALL_H / 2, cz - CELL / 2],
            scale: [CELL + WALL_T, WALL_H, WALL_T],
          })
        }
        // West wall
        if (cell.walls.W) {
          result.push({
            pos: [cx - CELL / 2, WALL_H / 2, cz],
            scale: [WALL_T, WALL_H, CELL + WALL_T],
          })
        }
        // South border
        if (y === maze.height - 1 && cell.walls.S) {
          result.push({
            pos: [cx, WALL_H / 2, cz + CELL / 2],
            scale: [CELL + WALL_T, WALL_H, WALL_T],
          })
        }
        // East border
        if (x === maze.width - 1 && cell.walls.E) {
          result.push({
            pos: [cx + CELL / 2, WALL_H / 2, cz],
            scale: [WALL_T, WALL_H, CELL + WALL_T],
          })
        }
      }
    }
    return result
  }, [maze])

  return (
    <>
      {walls.map((w, i) => (
        <mesh key={i} position={w.pos} scale={w.scale} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#1a2040"
            emissive="#0044aa"
            emissiveIntensity={0.3}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      ))}
    </>
  )
}

function Floor({ maze }: { maze: MazeData }) {
  const size = Math.max(maze.width, maze.height) * CELL + CELL
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(maze.width - 1) * CELL / 2, -0.05, (maze.height - 1) * CELL / 2]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#080810" roughness={1} metalness={0} />
    </mesh>
  )
}

function StartMarker({ maze }: { maze: MazeData }) {
  return (
    <mesh position={[maze.start.x * CELL, 0.05, maze.start.y * CELL]}>
      <cylinderGeometry args={[0.6, 0.6, 0.1, 16]} />
      <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1} />
    </mesh>
  )
}

function EndMarker({ maze }: { maze: MazeData }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 2
      const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.15
      ref.current.scale.setScalar(s)
    }
  })
  return (
    <mesh ref={ref} position={[maze.end.x * CELL, 0.3, maze.end.y * CELL]}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2} />
    </mesh>
  )
}

interface PlayerCubeProps {
  pos: { x: number; y: number }
  color: string
  emissive?: string
  label?: string
}

function PlayerCube({ pos, color, emissive }: PlayerCubeProps) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 0.4 + Math.sin(clock.getElapsedTime() * 4) * 0.08
    }
  })
  return (
    <mesh
      ref={ref}
      position={[pos.x * CELL, 0.4, pos.y * CELL]}
      castShadow
    >
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive ?? color}
        emissiveIntensity={1.5}
        roughness={0.1}
        metalness={0.9}
      />
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
  const midX = ((maze.width - 1) * CELL) / 2
  const midZ = ((maze.height - 1) * CELL) / 2

  return (
    <Canvas
      shadows
      camera={{
        position: [midX, maze.height * 1.8, midZ + maze.height * 1.2],
        fov: 55,
        near: 0.1,
        far: 1000,
      }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0a0a0f']} />
      <fog attach="fog" args={['#0a0a0f', 20, 80]} />

      <ambientLight intensity={0.15} />
      <directionalLight
        position={[midX, 20, midZ]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[playerPos.x * CELL, 3, playerPos.y * CELL]} color="#ffd700" intensity={3} distance={8} />
      <pointLight position={[maze.end.x * CELL, 3, maze.end.y * CELL]} color="#ffd700" intensity={5} distance={10} />

      <Floor maze={maze} />
      <MazeWalls maze={maze} />
      <StartMarker maze={maze} />
      <EndMarker maze={maze} />

      <PlayerCube pos={playerPos} color="#ffd700" emissive="#ffd700" />
      {showEnemy && enemyPos && (
        <PlayerCube pos={enemyPos} color="#ff4444" emissive="#ff4444" />
      )}
      {showGuest && guestPos && (
        <PlayerCube pos={guestPos} color="#00ffff" emissive="#00ffff" />
      )}

      <OrbitControls
        target={[midX, 0, midZ]}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={60}
        enablePan={false}
      />
    </Canvas>
  )
}
