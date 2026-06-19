import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { createSeededRandom } from './seedRandom'

const ADJECTIVES = ['SWIFT','DARK','NEON','VOID','CHROME','STEEL','GHOST','CYBER','QUANTUM','FLUX']
const NOUNS = ['HAWK','VIPER','PHANTOM','NEXUS','CIPHER','PULSE','STORM','VECTOR','NOVA','GRID']

export function generateRandomQRData(): string {
  const rng = createSeededRandom(Date.now())
  const adj = ADJECTIVES[Math.floor(rng() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(rng() * NOUNS.length)]
  const num = Math.floor(rng() * 9000) + 1000
  return `QMR-${adj}-${noun}-${num}`
}

export async function qrDataToCanvas(data: string, canvas: HTMLCanvasElement): Promise<void> {
  await QRCode.toCanvas(canvas, data, {
    width: 256,
    margin: 2,
    color: { dark: '#00FFFF', light: '#0a0a0f' },
  })
}

export async function qrDataToDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 256,
    margin: 2,
    color: { dark: '#00FFFF', light: '#0a0a0f' },
  })
}

export function decodeQRFromCanvas(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const result = jsQR(imageData.data, width, height)
  return result?.data ?? null
}

export function decodeQRFromImageData(imageData: ImageData): string | null {
  const result = jsQR(imageData.data, imageData.width, imageData.height)
  return result?.data ?? null
}

export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
