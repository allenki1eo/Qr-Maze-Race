import { createSeededRandom, hashString } from './seedRandom'

export interface Cell {
  x: number
  y: number
  walls: { N: boolean; S: boolean; E: boolean; W: boolean }
  visited: boolean
}

export interface MazeData {
  grid: Cell[][]
  width: number
  height: number
  start: { x: number; y: number }
  end: { x: number; y: number }
  seed: number
}

export function generateMaze(qrData: string, size: number = 15): MazeData {
  const seed = hashString(qrData)
  const rng = createSeededRandom(seed)
  const width = size
  const height = size

  // Initialize grid — all walls up
  const grid: Cell[][] = []
  for (let y = 0; y < height; y++) {
    grid[y] = []
    for (let x = 0; x < width; x++) {
      grid[y][x] = {
        x,
        y,
        walls: { N: true, S: true, E: true, W: true },
        visited: false,
      }
    }
  }

  // Recursive backtracker
  const stack: Cell[] = []
  const startX = Math.floor(rng() * width)
  const startY = Math.floor(rng() * height)
  let current = grid[startY][startX]
  current.visited = true
  stack.push(current)

  while (stack.length > 0) {
    current = stack[stack.length - 1]
    const neighbors = getUnvisitedNeighbors(current, grid, width, height)

    if (neighbors.length === 0) {
      stack.pop()
    } else {
      const idx = Math.floor(rng() * neighbors.length)
      const next = neighbors[idx]
      removeWall(current, next)
      next.visited = true
      stack.push(next)
    }
  }

  return {
    grid,
    width,
    height,
    start: { x: 0, y: 0 },
    end: { x: width - 1, y: height - 1 },
    seed,
  }
}

function getUnvisitedNeighbors(cell: Cell, grid: Cell[][], w: number, h: number): Cell[] {
  const { x, y } = cell
  const neighbors: Cell[] = []
  if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x])
  if (y < h - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x])
  if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1])
  if (x < w - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1])
  return neighbors
}

function removeWall(a: Cell, b: Cell) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (dx === 1) { a.walls.E = false; b.walls.W = false }
  if (dx === -1) { a.walls.W = false; b.walls.E = false }
  if (dy === 1) { a.walls.S = false; b.walls.N = false }
  if (dy === -1) { a.walls.N = false; b.walls.S = false }
}

export function serializeMaze(maze: MazeData): string {
  return JSON.stringify({
    width: maze.width,
    height: maze.height,
    seed: maze.seed,
    start: maze.start,
    end: maze.end,
    grid: maze.grid.map(row =>
      row.map(cell => ({
        x: cell.x,
        y: cell.y,
        walls: cell.walls,
      }))
    ),
  })
}

export function deserializeMaze(data: string): MazeData {
  const parsed = JSON.parse(data)
  return {
    ...parsed,
    grid: parsed.grid.map((row: Cell[]) =>
      row.map((cell: Cell) => ({ ...cell, visited: true }))
    ),
  }
}
