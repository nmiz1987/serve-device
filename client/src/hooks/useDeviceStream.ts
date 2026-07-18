import { useEffect, useRef, useState } from 'react'

export function useDeviceStream(
  deviceId: string,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  setError: (error: string | null) => void,
) {
  const wsRef = useRef<WebSocket | null>(null)
  const [frameCount, setFrameCount] = useState(0)
  const [lastFrameTime, setLastFrameTime] = useState<number | null>(null)
  const frameCounterRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Connect to WebSocket stream
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/devices/${deviceId}/stream`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Connected to device stream')
      setError(null)
    }

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'frame') {
          // Decode base64 frame data
          const binaryString = atob(data.data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          // Create blob and decode image
          const blob = new Blob([bytes], { type: 'image/png' })
          const url = URL.createObjectURL(blob)
          const img = new Image()

          img.onload = () => {
            // Update canvas
            canvas.width = data.width
            canvas.height = data.height
            ctx.drawImage(img, 0, 0)

            // Update FPS counter
            frameCounterRef.current++
            setLastFrameTime(Date.now())
            setFrameCount(frameCounterRef.current)

            URL.revokeObjectURL(url)
          }

          img.src = url
        }
      } catch (error) {
        console.error('Error processing frame:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setError('Connection error')
    }

    ws.onclose = () => {
      console.log('Stream disconnected')
    }

    // Reset frame counter every second
    const counterInterval = setInterval(() => {
      setFrameCount(frameCounterRef.current)
      frameCounterRef.current = 0
    }, 1000)

    return () => {
      clearInterval(counterInterval)
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [deviceId, canvasRef, setError])

  return { frameCount, lastFrameTime }
}
