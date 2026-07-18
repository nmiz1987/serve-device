import { useEffect, useRef, useState } from 'react'
import InputOverlay from './InputOverlay'
import { useDeviceStream } from '../hooks/useDeviceStream'

interface StreamViewerProps {
  deviceId: string
}

export default function StreamViewer({ deviceId }: StreamViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fps, setFps] = useState(0)
  const [latency, setLatency] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [deviceResolution, setDeviceResolution] = useState<{
    width: number
    height: number
  } | null>(null)
  const [isConnecting, setIsConnecting] = useState(true)

  const { frameCount, lastFrameTime } = useDeviceStream(
    deviceId,
    canvasRef,
    setError,
    setIsConnecting,
    setDeviceResolution,
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(frameCount)
    }, 1000)

    return () => clearInterval(interval)
  }, [frameCount])

  useEffect(() => {
    if (lastFrameTime) {
      const now = Date.now()
      setLatency(now - lastFrameTime)
    }
  }, [lastFrameTime])

  function handleFullscreen() {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.().catch((err) => {
        console.error('Fullscreen failed:', err)
      })
    } else {
      document.exitFullscreen?.()
    }
  }

  function handleScreenshot() {
    if (!canvasRef.current) return

    const link = document.createElement('a')
    link.href = canvasRef.current.toDataURL('image/png')
    link.download = `screenshot-${deviceId}-${Date.now()}.png`
    link.click()
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div className="stream-viewer">
      {error && <div className="stream-error">{error}</div>}

      <div className="stream-header">
        <div className="stream-info">
          {isConnecting && <span className="connecting">● Connecting...</span>}
          {!isConnecting && !error && (
            <span className="connected">● Connected</span>
          )}
          {deviceResolution && (
            <span className="resolution">
              {deviceResolution.width}×{deviceResolution.height}
            </span>
          )}
        </div>
        <div className="stream-controls">
          <button
            className="icon-btn"
            onClick={handleScreenshot}
            title="Download screenshot"
          >
            📷
          </button>
          <button
            className="icon-btn"
            onClick={handleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? '⛔' : '🖥️'}
          </button>
        </div>
      </div>

      <div className="stream-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="stream-canvas"
          width={1080}
          height={1920}
        />
        <InputOverlay
          deviceId={deviceId}
          canvasRef={canvasRef}
          canvasWidth={1080}
          canvasHeight={1920}
        />
      </div>

      <div className="stream-stats">
        <span>FPS: {fps}</span>
        <span>Latency: {latency}ms</span>
      </div>
    </div>
  )
}
