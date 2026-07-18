import { FrameEncoder } from './encoder'
import { FrameBuffer } from './frame-buffer'
import { AdbClient } from '../adb/client'
import type { StreamConfig } from '@shared/config'
import { DEFAULT_CONFIG } from '@shared/config'

interface StreamClient {
  ws: any // Bun ServerWebSocket
  id: string
}

export class StreamManager {
  private encoders: Map<string, FrameEncoder> = new Map()
  private buffers: Map<string, FrameBuffer> = new Map()
  private clients: Map<string, Set<StreamClient>> = new Map()
  private streamIntervals: Map<string, NodeJS.Timer> = new Map()
  private configs: Map<string, StreamConfig> = new Map()
  private frameIntervals: Map<string, number> = new Map()

  createStreamForDevice(deviceId: string, adbClient: AdbClient): void {
    if (this.encoders.has(deviceId)) {
      return
    }

    const encoder = new FrameEncoder(adbClient)
    const buffer = new FrameBuffer()
    const config: StreamConfig = { ...DEFAULT_CONFIG }

    this.encoders.set(deviceId, encoder)
    this.buffers.set(deviceId, buffer)
    this.clients.set(deviceId, new Set())
    this.configs.set(deviceId, config)
    this.frameIntervals.set(deviceId, 1000 / config.targetFps)

    this.startFrameCapture(deviceId)
  }

  addClient(deviceId: string, ws: any, clientId: string): void {
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

  getConfig(deviceId: string): StreamConfig | null {
    return this.configs.get(deviceId) || null
  }

  updateConfig(deviceId: string, updates: Partial<StreamConfig>): void {
    const config = this.configs.get(deviceId)
    if (!config) {
      throw new Error('Device not streaming')
    }

    // Validate updates
    if (updates.targetFps && (updates.targetFps < 1 || updates.targetFps > 60)) {
      throw new Error('targetFps must be between 1 and 60')
    }

    if (
      updates.qualityLevel &&
      !['low', 'medium', 'high'].includes(updates.qualityLevel)
    ) {
      throw new Error('Invalid qualityLevel')
    }

    // Apply updates
    Object.assign(config, updates)

    // Update frame interval if FPS changed and restart capture
    if (updates.targetFps) {
      this.frameIntervals.set(deviceId, 1000 / updates.targetFps)
      console.log(`Updated target FPS for device ${deviceId} to ${updates.targetFps}`)

      // Restart frame capture with new interval
      this.stopFrameCapture(deviceId)
      this.startFrameCapture(deviceId)
    }

    this.configs.set(deviceId, config)
  }

  private startFrameCapture(deviceId: string): void {
    if (this.streamIntervals.has(deviceId)) {
      return
    }

    const encoder = this.encoders.get(deviceId)
    const buffer = this.buffers.get(deviceId)
    const config = this.configs.get(deviceId)

    if (!encoder || !buffer || !config) return

    const frameInterval = this.frameIntervals.get(deviceId) || 1000 / config.targetFps
    console.log(`Starting frame capture for device ${deviceId} at ${config.targetFps} FPS (${frameInterval}ms interval)`)

    let lastCapture = Date.now()
    let frameAttempt = 0
    const interval = setInterval(async () => {
      try {
        frameAttempt++
        // Try to capture a frame
        const frame = await encoder.captureFrame()

        if (frame) {
          buffer.addFrame(frame)
          if (frameAttempt <= 3) {
            console.log(`Frame ${frameAttempt} captured: ${frame.data.length} bytes`)
          }
          this.broadcastFrame(deviceId, frame)
        } else {
          if (frameAttempt <= 3) {
            console.log(`Frame ${frameAttempt} capture returned null`)
          }
        }

        const now = Date.now()
        const elapsed = now - lastCapture
        if (elapsed > 5000) {
          lastCapture = now
          const fps = Math.round((1000 / (elapsed / 300)) * 10) / 10
          console.log(`Device ${deviceId}: ${fps} FPS, frame capture: ${encoder.getLastFrameTime()}ms`)
        }
      } catch (error) {
        if (frameAttempt <= 3) {
          console.error(`Frame capture error ${frameAttempt}:`, error)
        }
      }
    }, frameInterval)

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
    if (!clients || clients.size === 0) {
      return
    }

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
    let sentCount = 0

    for (const client of clients) {
      if (client.ws.readyState === 1) { // WebSocket.OPEN
        try {
          client.ws.send(message)
          sentCount++
        } catch (error) {
          console.error(`Failed to send frame to client ${client.id}:`, error)
          deadClients.push(client)
        }
      } else {
        deadClients.push(client)
      }
    }

    if (sentCount > 0 && frame.frameNumber <= 3) {
      console.log(`Frame ${frame.frameNumber} broadcast to ${sentCount} clients`)
    }

    // Clean up dead connections
    deadClients.forEach((client) => {
      this.removeClient(deviceId, client.id)
    })
  }

  dispose(): void {
    this.streamIntervals.forEach((interval) => clearInterval(interval))
    this.streamIntervals.clear()
    this.clients.clear()
    this.encoders.clear()
    this.buffers.clear()
    this.configs.clear()
    this.frameIntervals.clear()
  }
}
