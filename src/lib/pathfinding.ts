import type { Cell, MazeData } from './mazeGenerator'

interface Node {
  x: number
  y: number
  g: number
  h: number
  f: number
  parent: Node | null
}

function heuristic(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export function astar(
  maze: MazeData,
  start: { x: number; y: number },
  goal: { x: number; y: number }
): { x: number; y: number }[] {
  const { grid } = maze
  const open: Node[] = []
  const closed = new Set<string>()

  const startNode: Node = { x: start.x, y: start.y, g: 0, h: heuristic(start, goal), f: 0, parent: null }
  startNode.f = startNode.g + startNode.h
  open.push(startNode)

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f)
    const current = open.shift()!
    const key = `${current.x},${current.y}`

    if (current.x === goal.x && current.y === goal.y) {
      const path: { x: number; y: number }[] = []
      let node: Node | null = current
      while (node) {
        path.unshift({ x: node.x, y: node.y })
        node = node.parent
      }
      return path
    }

    closed.add(key)
    const cell = grid[current.y]?.[current.x]
    if (!cell) continue

    const neighbors = getPassableNeighbors(cell, maze)
    for (const nb of neighbors) {
      const nbKey = `${nb.x},${nb.y}`
      if (closed.has(nbKey)) continue

      const g = current.g + 1
      const existing = open.find(n => n.x === nb.x && n.y === nb.y)
      if (!existing) {
        const h = heuristic(nb, goal)
        open.push({ x: nb.x, y: nb.y, g, h, f: g + h, parent: current })
      } else if (g < existing.g) {
        existing.g = g
        existing.f = g + existing.h
        existing.parent = current
      }
    }
  }

  return []
}

function getPassableNeighbors(cell: Cell, maze: MazeData): { x: number; y: number }[] {
  const { x, y } = cell
  const { width, height } = maze
  const result: { x: number; y: number }[] = []

  if (!cell.walls.N && y > 0) result.push({ x, y: y - 1 })
  if (!cell.walls.S && y < height - 1) result.push({ x, y: y + 1 })
  if (!cell.walls.W && x > 0) result.push({ x: x - 1, y })
  if (!cell.walls.E && x < width - 1) result.push({ x: x + 1, y })

  return result
}
