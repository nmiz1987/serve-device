// Device information
export interface Device {
  id: string
  model: string
  state: 'device' | 'offline' | 'unauthorized'
  resolution?: {
    width: number
    height: number
  }
}

// WebSocket frame message
export interface FrameMessage {
  type: 'frame'
  deviceId: string
  timestamp: number
  frameNumber: number
  data: string // base64 encoded PNG or H.264 frame
  width: number
  height: number
}

// Input commands
export interface TapCommand {
  type: 'tap'
  x: number
  y: number
}

export interface SwipeCommand {
  type: 'swipe'
  x1: number
  y1: number
  x2: number
  y2: number
  duration?: number
}

export interface TypeCommand {
  type: 'type'
  text: string
}

export interface KeyCommand {
  type: 'key'
  keyCode: string
}

export type InputCommand = TapCommand | SwipeCommand | TypeCommand | KeyCommand

// API responses
export interface DeviceListResponse {
  devices: Device[]
}

export interface CommandResponse {
  success: boolean
  message?: string
  error?: string
}

export interface ScreenshotResponse {
  data: string // base64 PNG
  width: number
  height: number
}
