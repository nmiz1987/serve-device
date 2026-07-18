import type { EncodedFrame } from './encoder'

export class FrameBuffer {
  private frames: EncodedFrame[] = []
  private maxSize: number
  private resolution: { width: number; height: number }

  constructor(
    maxSize: number = 3,
    resolution: { width: number; height: number } = { width: 1080, height: 1920 },
  ) {
    this.maxSize = maxSize
    this.resolution = resolution
  }

  addFrame(frame: EncodedFrame): void {
    this.frames.push(frame)

    // Keep only the last N frames
    if (this.frames.length > this.maxSize) {
      this.frames.shift()
    }
  }

  getLatestFrame(): EncodedFrame | null {
    return this.frames.length > 0 ? this.frames[this.frames.length - 1] : null
  }

  getFrameCount(): number {
    return this.frames.length
  }

  clear(): void {
    this.frames = []
  }

  setResolution(width: number, height: number): void {
    this.resolution = { width, height }
  }

  getResolution(): { width: number; height: number } {
    return this.resolution
  }
}
