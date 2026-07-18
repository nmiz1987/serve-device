import { FrameEncoder } from './encoder'
import { FrameBuffer } from './frame-buffer'
import { AdbClient } from '../adb/client'

interface StreamClient {
  ws: WebSocket
  id: string
}

export class StreamManager {
  private encoders: Map<string, FrameEncoder> = new Map()
  private buffers: Map<string, FrameBuffer> = new Map()
  private clients: Map<string, Set<StreamClient>> = new Map()
  private streamIntervals: Map<string, NodeJS.Timer> = new Map()
  private targetFps = 30 // Start conservative, optimize later
  private frameInterval = 1000 / this.targetFps

  createStreamForDevice(deviceId: string, adbClient: AdbClient): void {
    if (this.encoders.has(deviceId)) {
      return
    }

    const encoder = new FrameEncoder(adbClient)
    const buffer = new FrameBuffer()

    this.encoders.set(deviceId, encoder)
    this.buffers.set(deviceId, buffer)
    this.clients.set(deviceId, new Set())

    this.startFrameCapture(deviceId)
  }

  addClient(deviceId: string, ws: WebSocket, clientId: string): void {
    if (!this.clients.has(deviceId)) {
      this.createStreamForDevice(deviceId, new AdbClient(deviceId))
    }

    const client: StreamClient = { ws, id: clientId }
    this.clients.get(deviceId)!.add(client)

    console.log(`Client ${clientId} connected to device ${deviceId}`)
  }

  removeClient(deviceId: string, clientId: string): void {
    const clients = this.clients.get(deviceId)
    if (clients) {
      const client = Array.from(clients).find((c) => c.id === clientId)
      if (client) {
        clients.delete(client)
        console.log(`Client ${clientId} disconnected from device ${deviceId}`)
      }

      // Stop streaming if no more clients
      if (clients.size === 0) {
        this.stopFrameCapture(deviceId)
      }
    }
  }

  private startFrameCapture(deviceId: string): void {
    if (this.streamIntervals.has(deviceId)) {
      return
    }

    const encoder = this.encoders.get(deviceId)
    const buffer = this.buffers.get(deviceId)

    if (!encoder || !buffer) return

    console.log(`Starting frame capture for device ${deviceId} at ${this.targetFps} FPS`)

    let lastCapture = Date.now()
    const interval = setInterval(async () => {
      try {
        // Try to capture a frame
        const frame = await encoder.captureFrame()

        if (frame) {
          buffer.addFrame(frame)
          this.broadcastFrame(deviceId, frame)
        }

        const now = Date.now()
        const elapsed = now - lastCapture
        if (elapsed > 5000) {
          lastCapture = now
          const fps = Math.round((1000 / (elapsed / 300)) * 10) / 10
          console.log(`Device ${deviceId}: ${fps} FPS, frame capture: ${encoder.getLastFrameTime()}ms`)
        }
      } catch (error) {
        console.error(`Frame capture error for ${deviceId}:`, error)
      }
    }, this.frameInterval)

    this.streamIntervals.set(deviceId, interval)
  }

  private stopFrameCapture(deviceId: string): void {
    const interval = this.streamIntervals.get(deviceId)
    if (interval) {
      clearInterval(interval)
      this.streamIntervals.delete(deviceId)
      console.log(`Stopped frame capture for device ${deviceId}`)
    }
  }

  private broadcastFrame(deviceId: string, frame: any): void {
    const clients = this.clients.get(deviceId)
    if (!clients) return

    const message = JSON.stringify({
      type: 'frame',
      deviceId,
      timestamp: frame.timestamp,
      frameNumber: frame.frameNumber,
      data: frame.data,
      width: this.buffers.get(deviceId)?.getResolution().width || 1080,
      height: this.buffers.get(deviceId)?.getResolution().height || 1920,
    })

    let deadClients: StreamClient[] = []

    for (const client of clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(message)
        } catch (error) {
          console.error(`Failed to send frame to client ${client.id}:`, error)
          deadClients.push(client)
        }
      } else {
        deadClients.push(client)
      }
    }

    // Clean up dead connections
    deadClients.forEach((client) => {
      this.removeClient(deviceId, client.id)
    })
  }

  setTargetFps(fps: number): void {
    this.targetFps = fps
    this.frameInterval = 1000 / fps
    console.log(`Target FPS set to ${fps}`)
  }

  dispose(): void {
    this.streamIntervals.forEach((interval) => clearInterval(interval))
    this.streamIntervals.clear()
    this.clients.clear()
    this.encoders.clear()
    this.buffers.clear()
  }
}
