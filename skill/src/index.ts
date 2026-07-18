/**
 * Serve Device AI Skill
 *
 * A TypeScript SDK for controlling Android devices via the Serve Device server.
 * Designed for use with Claude AI agents and testing automation.
 *
 * @example
 * ```typescript
 * const client = new ServeDeviceClient('http://localhost:3000');
 * const devices = await client.getDevices();
 * await client.tap(devices[0].id, 540, 1000);
 * const screenshot = await client.screenshot(devices[0].id);
 * ```
 */

export interface Device {
  id: string
  model: string
  state: 'device' | 'offline' | 'unauthorized'
  resolution?: {
    width: number
    height: number
  }
}

export interface TapOptions {
  x: number
  y: number
}

export interface SwipeOptions {
  x1: number
  y1: number
  x2: number
  y2: number
  duration?: number
}

export interface CommandResponse {
  success: boolean
  message?: string
  error?: string
}

export interface Screenshot {
  data: string // base64 PNG
  width: number
  height: number
  capturedAt: Date
}

export class ServeDeviceClient {
  private baseUrl: string
  private requestTimeout: number

  /**
   * Create a new Serve Device client
   * @param baseUrl - Base URL of the Serve Device server (e.g., 'http://localhost:3000')
   * @param timeout - Request timeout in milliseconds (default: 30000)
   */
  constructor(baseUrl: string, timeout = 30000) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.requestTimeout = timeout
  }

  /**
   * List all connected Android devices
   */
  async getDevices(): Promise<Device[]> {
    const response = await this.fetch('/api/devices')
    const data = await response.json()
    return data.devices || []
  }

  /**
   * Get information about a specific device
   */
  async getDevice(deviceId: string): Promise<Device | null> {
    try {
      const response = await this.fetch(`/api/devices/${deviceId}`)
      return await response.json()
    } catch {
      return null
    }
  }

  /**
   * Wait for a device to be connected
   * @param deviceId - Device ID to wait for
   * @param maxWaitTime - Maximum time to wait in milliseconds (default: 60000)
   */
  async waitForDevice(
    deviceId: string,
    maxWaitTime = 60000,
  ): Promise<boolean> {
    const startTime = Date.now()
    while (Date.now() - startTime < maxWaitTime) {
      const device = await this.getDevice(deviceId)
      if (device?.state === 'device') {
        return true
      }
      await this.delay(1000)
    }
    return false
  }

  /**
   * Take a screenshot from the device
   */
  async screenshot(deviceId: string): Promise<Screenshot> {
    const response = await this.fetch(
      `/api/devices/${deviceId}/screenshot`,
    )
    const data = await response.json()
    return {
      data: data.data,
      width: data.width,
      height: data.height,
      capturedAt: new Date(),
    }
  }

  /**
   * Save screenshot to a file (Node.js only)
   */
  async saveScreenshot(
    deviceId: string,
    filepath: string,
  ): Promise<void> {
    const screenshot = await this.screenshot(deviceId)

    // Only works in Node.js environment
    if (typeof globalThis !== 'undefined' && 'Buffer' in globalThis) {
      const Buffer = (globalThis as any).Buffer
      const buffer = Buffer.from(screenshot.data, 'base64')

      // Dynamic import to avoid breaking in browser environments
      try {
        // @ts-ignore - fs/promises only available in Node.js
        const fs = await import('fs/promises')
        await (fs as any).writeFile(filepath, buffer)
      } catch {
        throw new Error(
          'saveScreenshot requires Node.js environment with fs/promises',
        )
      }
    } else {
      throw new Error('saveScreenshot is only available in Node.js')
    }
  }

  /**
   * Tap/click at specific coordinates
   */
  async tap(deviceId: string, x: number, y: number): Promise<void> {
    await this.executeCommand(`/api/devices/${deviceId}/input/tap`, {
      x,
      y,
    })
  }

  /**
   * Swipe from one point to another
   */
  async swipe(
    deviceId: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    duration?: number,
  ): Promise<void> {
    await this.executeCommand(`/api/devices/${deviceId}/input/swipe`, {
      x1,
      y1,
      x2,
      y2,
      duration: duration || 300,
    })
  }

  /**
   * Type text on the device
   */
  async type(deviceId: string, text: string): Promise<void> {
    await this.executeCommand(`/api/devices/${deviceId}/input/type`, { text })
  }

  /**
   * Press a key or key code
   */
  async key(deviceId: string, keyCode: string): Promise<void> {
    await this.executeCommand(`/api/devices/${deviceId}/input/key`, {
      keyCode,
    })
  }

  /**
   * Press the Back button
   */
  async pressBack(deviceId: string): Promise<void> {
    await this.key(deviceId, 'KEYCODE_BACK')
  }

  /**
   * Press the Home button
   */
  async pressHome(deviceId: string): Promise<void> {
    await this.key(deviceId, 'KEYCODE_HOME')
  }

  /**
   * Press the Recent Apps button
   */
  async pressRecent(deviceId: string): Promise<void> {
    await this.key(deviceId, 'KEYCODE_APP_SWITCH')
  }

  /**
   * Press the Power button
   */
  async pressPower(deviceId: string): Promise<void> {
    await this.key(deviceId, 'KEYCODE_POWER')
  }

  /**
   * Press Volume Up
   */
  async pressVolumeUp(deviceId: string): Promise<void> {
    await this.key(deviceId, 'KEYCODE_VOLUME_UP')
  }

  /**
   * Press Volume Down
   */
  async pressVolumeDown(deviceId: string): Promise<void> {
    await this.key(deviceId, 'KEYCODE_VOLUME_DOWN')
  }

  /**
   * Perform a complete interaction flow:
   * 1. Take a screenshot
   * 2. Perform an action
   * 3. Wait and take another screenshot
   * Useful for vision-based automation
   */
  async interact(
    deviceId: string,
    action: () => Promise<void>,
    delayMs = 500,
  ): Promise<{ before: Screenshot; after: Screenshot }> {
    const before = await this.screenshot(deviceId)
    await action()
    await this.delay(delayMs)
    const after = await this.screenshot(deviceId)
    return { before, after }
  }

  /**
   * Chain multiple commands with delays
   */
  async chain(
    deviceId: string,
    ...commands: Array<{ action: () => Promise<void>; delay?: number }>
  ): Promise<void> {
    for (const { action, delay } of commands) {
      await action()
      if (delay) {
        await this.delay(delay)
      }
    }
  }

  /**
   * Execute a tap at percentages of the screen (0-100)
   */
  async tapPercent(
    deviceId: string,
    percentX: number,
    percentY: number,
  ): Promise<void> {
    const device = await this.getDevice(deviceId)
    if (!device?.resolution) {
      throw new Error('Device resolution not available')
    }

    const x = Math.round((device.resolution.width * percentX) / 100)
    const y = Math.round((device.resolution.height * percentY) / 100)
    await this.tap(deviceId, x, y)
  }

  /**
   * Swipe from percentages of the screen (0-100)
   */
  async swipePercent(
    deviceId: string,
    percentX1: number,
    percentY1: number,
    percentX2: number,
    percentY2: number,
    duration?: number,
  ): Promise<void> {
    const device = await this.getDevice(deviceId)
    if (!device?.resolution) {
      throw new Error('Device resolution not available')
    }

    const x1 = Math.round((device.resolution.width * percentX1) / 100)
    const y1 = Math.round((device.resolution.height * percentY1) / 100)
    const x2 = Math.round((device.resolution.width * percentX2) / 100)
    const y2 = Math.round((device.resolution.height * percentY2) / 100)

    await this.swipe(deviceId, x1, y1, x2, y2, duration)
  }

  /**
   * Scroll down (swipe up)
   */
  async scrollDown(
    deviceId: string,
    distance = 500,
    duration = 300,
  ): Promise<void> {
    const device = await this.getDevice(deviceId)
    if (!device?.resolution) {
      throw new Error('Device resolution not available')
    }

    const centerX = device.resolution.width / 2
    const startY = device.resolution.height * 0.7
    const endY = Math.max(startY - distance, 0)

    await this.swipe(deviceId, centerX, startY, centerX, endY, duration)
  }

  /**
   * Scroll up (swipe down)
   */
  async scrollUp(
    deviceId: string,
    distance = 500,
    duration = 300,
  ): Promise<void> {
    const device = await this.getDevice(deviceId)
    if (!device?.resolution) {
      throw new Error('Device resolution not available')
    }

    const centerX = device.resolution.width / 2
    const startY = device.resolution.height * 0.3
    const endY = Math.min(startY + distance, device.resolution.height)

    await this.swipe(deviceId, centerX, startY, centerX, endY, duration)
  }

  /**
   * Double-tap at coordinates
   */
  async doubleTap(
    deviceId: string,
    x: number,
    y: number,
    delayMs = 100,
  ): Promise<void> {
    await this.tap(deviceId, x, y)
    await this.delay(delayMs)
    await this.tap(deviceId, x, y)
  }

  /**
   * Long-press by holding tap for specified duration
   */
  async longPress(
    deviceId: string,
    x: number,
    y: number,
    duration = 1000,
  ): Promise<void> {
    // Swipe from the point to itself with long duration
    await this.swipe(deviceId, x, y, x, y, duration)
  }

  // Private helper methods

  private async executeCommand(
    endpoint: string,
    body: Record<string, any>,
  ): Promise<CommandResponse> {
    const response = await this.fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        error.error || `Command failed: ${response.statusText}`,
      )
    }

    return (await response.json()) as CommandResponse
  }

  private async fetch(
    path: string,
    init?: RequestInit,
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout)

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export factory function for convenience
export function createClient(baseUrl: string, timeout?: number): ServeDeviceClient {
  return new ServeDeviceClient(baseUrl, timeout)
}

// Export test utilities
export { DeviceTestRunner, DeviceAssertions, waitForCondition, retryOperation } from './test-utils'
export type { TestResult } from './test-utils'
