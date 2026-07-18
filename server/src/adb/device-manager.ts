import { spawn } from 'child_process'
import type { Device } from '../../shared/types'
import { parseAdbDevices } from '../../shared/utils'
import { AdbClient } from './client'

export class DeviceManager {
  private devices: Map<string, Device> = new Map()
  private adbClients: Map<string, AdbClient> = new Map()
  private refreshInterval: NodeJS.Timer | null = null

  async initialize() {
    await this.refreshDevices()
    this.startAutoRefresh()
  }

  async refreshDevices(): Promise<void> {
    try {
      const output = await this.runAdb(['devices'])
      const deviceList = parseAdbDevices(output)

      // Clear old devices that are no longer connected
      const currentIds = new Set(deviceList.map((d) => d.id))
      for (const id of this.devices.keys()) {
        if (!currentIds.has(id)) {
          this.devices.delete(id)
          this.adbClients.delete(id)
        }
      }

      // Add or update devices
      for (const { id, state } of deviceList) {
        if (!this.devices.has(id)) {
          const device = await this.getDeviceInfo(id, state as any)
          if (device) {
            this.devices.set(id, device)
            this.adbClients.set(id, new AdbClient(id))
          }
        } else {
          const device = this.devices.get(id)!
          device.state = state as any
        }
      }
    } catch (error) {
      console.error('Failed to refresh devices:', error)
    }
  }

  private async getDeviceInfo(id: string, state: string): Promise<Device | null> {
    if (state !== 'device') {
      return {
        id,
        model: 'unknown',
        state: state as 'device' | 'offline' | 'unauthorized',
      }
    }

    try {
      const client = new AdbClient(id)
      const model = await client.shell('getprop ro.product.model')
      const resolution = await client.getResolution()

      return {
        id,
        model: model.trim(),
        state: 'device',
        resolution: resolution || undefined,
      }
    } catch {
      return {
        id,
        model: 'unknown',
        state: 'offline',
      }
    }
  }

  private startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.refreshDevices()
    }, 5000) // Refresh every 5 seconds
  }

  getDevices(): Device[] {
    return Array.from(this.devices.values())
  }

  getDevice(id: string): Device | undefined {
    return this.devices.get(id)
  }

  getAdbClient(id: string): AdbClient | undefined {
    return this.adbClients.get(id)
  }

  dispose() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  }

  private runAdb(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn('adb', args)
      let stdout = ''

      process.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new Error('ADB error'))
        }
      })

      process.on('error', (err) => {
        reject(err)
      })
    })
  }
}
