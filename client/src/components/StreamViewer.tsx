import { useEffect, useRef, useState } from 'react'
import InputOverlay from './InputOverlay'
import { useDeviceStream } from '../hooks/useDeviceStream'

interface StreamViewerProps {
  deviceId: string
}

export default function StreamViewer({ deviceId }: StreamViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fps, setFps] = useState(0)
  const [latency, setLatency] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const { frameCount, lastFrameTime } = useDeviceStream(
    deviceId,
    canvasRef,
    setError,
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

  return (
    <div className="stream-viewer">
      {error && <div className="stream-error">{error}</div>}
      <div className="stream-container">
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
