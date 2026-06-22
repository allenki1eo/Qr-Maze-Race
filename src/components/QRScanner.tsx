import { useEffect, useRef, useState, useCallback } from 'react'
import { decodeQRFromCanvas, generateRandomQRData, qrDataToDataURL } from '../lib/qrUtils'

interface QRScannerProps {
  onQRDecoded: (data: string) => void
}

export default function QRScanner({ onQRDecoded }: QRScannerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [qrDataURL, setQrDataURL] = useState<string>('')
  const [currentData, setCurrentData] = useState<string>('')
  const [tab, setTab] = useState<'generate' | 'upload'>('generate')
  const [error, setError] = useState<string>('')

  const generateNew = useCallback(async () => {
    setError('')
    const data = generateRandomQRData()
    setCurrentData(data)
    const url = await qrDataToDataURL(data)
    setQrDataURL(url)
  }, [])

  useEffect(() => {
    generateNew()
  }, [generateNew])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const offscreen = document.createElement('canvas')
      offscreen.width = img.width
      offscreen.height = img.height
      const ctx = offscreen.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const decoded = decodeQRFromCanvas(offscreen)
      URL.revokeObjectURL(url)
      if (decoded) {
        setCurrentData(decoded)
        qrDataToDataURL(decoded).then(setQrDataURL)
      } else {
        setError('Could not decode QR code. Try a clearer image.')
      }
    }
    img.src = url
  }, [])

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      {/* Tabs */}
      <div className="flex gap-0 rounded-xl overflow-hidden w-full" style={{ border: '1px solid rgba(255,215,0,0.3)' }}>
        {(['generate', 'upload'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError('') }}
            className="flex-1 py-2.5 font-orbitron text-xs uppercase tracking-widest transition-all"
            style={{
              background: tab === t ? 'rgba(255,215,0,0.2)' : 'transparent',
              color: tab === t ? '#ffd700' : '#888',
            }}
          >
            {t === 'generate' ? '⚡ Generate' : '📤 Upload'}
          </button>
        ))}
      </div>

      {/* QR Preview */}
      <div className="relative" style={{ width: 200, height: 200 }}>
        <div
          className="rounded-xl overflow-hidden flex items-center justify-center"
          style={{ width: 200, height: 200, background: '#0a0a0f', border: '2px solid rgba(0,255,255,0.4)', boxShadow: '0 0 20px rgba(0,255,255,0.2)' }}
        >
          {qrDataURL ? (
            <img src={qrDataURL} alt="QR Code" width={180} height={180} />
          ) : (
            <div className="font-orbitron text-xs text-gray-600">Generating...</div>
          )}
        </div>
        <div className="scan-line opacity-60" />
      </div>

      {/* Hidden canvas for QR gen */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {tab === 'generate' && (
        <button
          onClick={generateNew}
          className="neon-btn w-full py-3 rounded-xl font-orbitron text-sm font-bold uppercase tracking-widest transition-all hover:scale-105"
          style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid #00ffff', color: '#00ffff' }}
        >
          ↺ New Random QR
        </button>
      )}

      {tab === 'upload' && (
        <button
          onClick={() => fileRef.current?.click()}
          className="neon-btn w-full py-3 rounded-xl font-orbitron text-sm font-bold uppercase tracking-widest transition-all hover:scale-105"
          style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid #00ffff', color: '#00ffff' }}
        >
          📤 Choose Image
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {error && (
        <p className="font-orbitron text-xs text-red-400 text-center">{error}</p>
      )}

      {currentData && (
        <div className="text-center">
          <p className="font-orbitron text-xs text-gray-500 uppercase tracking-widest mb-1">QR Seed</p>
          <p className="font-orbitron text-sm text-gray-300">{currentData}</p>
        </div>
      )}

      <button
        onClick={() => currentData && onQRDecoded(currentData)}
        disabled={!currentData}
        className="neon-btn w-full py-4 rounded-xl font-orbitron text-base font-black uppercase tracking-widest transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'rgba(255,215,0,0.15)', border: '2px solid #ffd700', color: '#ffd700', boxShadow: '0 0 20px rgba(255,215,0,0.3)' }}
      >
        Generate Maze →
      </button>
    </div>
  )
}
