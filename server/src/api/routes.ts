import { Hono } from 'hono'
import type { DeviceManager } from '../adb/device-manager'
import type { CommandResponse, DeviceListResponse, ScreenshotResponse } from '../../shared/types'

export function createApiRoutes(deviceManager: DeviceManager) {
  const api = new Hono()

  // List all devices
  api.get('/devices', (c) => {
    const devices = deviceManager.getDevices()
    return c.json({ devices } as DeviceListResponse)
  })

  // Get device info
  api.get('/devices/:deviceId', (c) => {
    const deviceId = c.req.param('deviceId')
    const device = deviceManager.getDevice(deviceId)

    if (!device) {
      return c.json({ error: 'Device not found' }, 404)
    }

    return c.json(device)
  })

  // Get screenshot
  api.get('/devices/:deviceId/screenshot', async (c) => {
    const deviceId = c.req.param('deviceId')
    const client = deviceManager.getAdbClient(deviceId)

    if (!client) {
      return c.json({ error: 'Device not found' }, 404)
    }

    try {
      const buffer = await client.screencap()
      const data = buffer.toString('base64')
      const device = deviceManager.getDevice(deviceId)

      return c.json({
        data,
        width: device?.resolution?.width || 1080,
        height: device?.resolution?.height || 1920,
      } as ScreenshotResponse)
    } catch (error) {
      return c.json(
        { error: 'Failed to capture screenshot', message: String(error) },
        500,
      )
    }
  })

  // Tap
  api.post('/devices/:deviceId/input/tap', async (c) => {
    const deviceId = c.req.param('deviceId')
    const client = deviceManager.getAdbClient(deviceId)

    if (!client) {
      return c.json({ error: 'Device not found' }, 404)
    }

    try {
      const { x, y } = await c.req.json()

      if (typeof x !== 'number' || typeof y !== 'number') {
        return c.json({ error: 'Invalid coordinates' }, 400)
      }

      await client.tap(x, y)
      return c.json({ success: true } as CommandResponse)
    } catch (error) {
      return c.json(
        { success: false, error: 'Failed to execute tap' },
        500,
      )
    }
  })

  // Swipe
  api.post('/devices/:deviceId/input/swipe', async (c) => {
    const deviceId = c.req.param('deviceId')
    const client = deviceManager.getAdbClient(deviceId)

    if (!client) {
      return c.json({ error: 'Device not found' }, 404)
    }

    try {
      const { x1, y1, x2, y2, duration } = await c.req.json()

      if (
        typeof x1 !== 'number' ||
        typeof y1 !== 'number' ||
        typeof x2 !== 'number' ||
        typeof y2 !== 'number'
      ) {
        return c.json({ error: 'Invalid coordinates' }, 400)
      }

      await client.swipe(x1, y1, x2, y2, duration || 300)
      return c.json({ success: true } as CommandResponse)
    } catch (error) {
      return c.json(
        { success: false, error: 'Failed to execute swipe' },
        500,
      )
    }
  })

  // Type text
  api.post('/devices/:deviceId/input/type', async (c) => {
    const deviceId = c.req.param('deviceId')
    const client = deviceManager.getAdbClient(deviceId)

    if (!client) {
      return c.json({ error: 'Device not found' }, 404)
    }

    try {
      const { text } = await c.req.json()

      if (typeof text !== 'string') {
        return c.json({ error: 'Text must be a string' }, 400)
      }

      await client.type(text)
      return c.json({ success: true } as CommandResponse)
    } catch (error) {
      return c.json(
        { success: false, error: 'Failed to type text' },
        500,
      )
    }
  })

  // Key event
  api.post('/devices/:deviceId/input/key', async (c) => {
    const deviceId = c.req.param('deviceId')
    const client = deviceManager.getAdbClient(deviceId)

    if (!client) {
      return c.json({ error: 'Device not found' }, 404)
    }

    try {
      const { keyCode } = await c.req.json()

      if (typeof keyCode !== 'string') {
        return c.json({ error: 'keyCode must be a string' }, 400)
      }

      await client.keyevent(keyCode)
      return c.json({ success: true } as CommandResponse)
    } catch (error) {
      return c.json(
        { success: false, error: 'Failed to execute key event' },
        500,
      )
    }
  })

  return api
}
