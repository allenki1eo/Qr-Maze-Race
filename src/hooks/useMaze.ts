import { useState, useCallback } from 'react'
import { generateMaze, serializeMaze, type MazeData } from '../lib/mazeGenerator'
import { generateRandomQRData } from '../lib/qrUtils'

export function useMaze() {
  const [maze, setMaze] = useState<MazeData | null>(null)
  const [qrData, setQrData] = useState<string>('')

  const generateNew = useCallback((size?: number) => {
    const data = generateRandomQRData()
    const m = generateMaze(data, size)
    setQrData(data)
    setMaze(m)
    return { maze: m, qrData: data, mazeData: serializeMaze(m) }
  }, [])

  const fromQRData = useCallback((data: string, size?: number) => {
    const m = generateMaze(data, size)
    setQrData(data)
    setMaze(m)
    return { maze: m, qrData: data, mazeData: serializeMaze(m) }
  }, [])

  return { maze, qrData, generateNew, fromQRData }
}
