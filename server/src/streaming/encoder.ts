import { AdbClient } from '../adb/client'

export interface EncodedFrame {
  data: string // base64
  timestamp: number
  frameNumber: number
}

export class FrameEncoder {
  private adbClient: AdbClient
  private frameNumber = 0
  private lastFrameTime = 0
  private isCapturing = false

  constructor(adbClient: AdbClient) {
    this.adbClient = adbClient
  }

  async captureFrame(): Promise<EncodedFrame | null> {
    if (this.isCapturing) {
      return null
    }

    try {
      this.isCapturing = true
      const startTime = Date.now()

      // Capture screenshot via ADB
      const buffer = await this.adbClient.screencap()

      // Encode to base64
      const base64Data = buffer.toString('base64')
      const timestamp = Date.now()
      const frameTime = timestamp - startTime

      this.frameNumber++
      this.lastFrameTime = frameTime

      return {
        data: base64Data,
        timestamp,
        frameNumber: this.frameNumber,
      }
    } catch (error) {
      console.error('Frame capture error:', error)
      return null
    } finally {
      this.isCapturing = false
    }
  }

  getFrameNumber(): number {
    return this.frameNumber
  }

  getLastFrameTime(): number {
    return this.lastFrameTime
  }

  reset(): void {
    this.frameNumber = 0
    this.lastFrameTime = 0
  }
}
