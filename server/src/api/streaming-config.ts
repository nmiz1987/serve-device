import { Hono } from 'hono'
import type { StreamManager } from '../streaming/websocket-handler'
import type { StreamConfig } from '@shared/config'

export function createStreamingConfigRoutes(streamManager: StreamManager) {
  const api = new Hono()

  // Get current streaming config for a device
  api.get('/devices/:deviceId/streaming/config', (c) => {
    const deviceId = c.req.param('deviceId')
    const config = streamManager.getConfig(deviceId)

    if (!config) {
      return c.json({ error: 'Device not streaming' }, 404)
    }

    return c.json(config)
  })

  // Update streaming config for a device
  api.post('/devices/:deviceId/streaming/config', async (c) => {
    const deviceId = c.req.param('deviceId')
    const body = await c.req.json()

    try {
      streamManager.updateConfig(deviceId, body)
      return c.json({ success: true })
    } catch (error) {
      return c.json(
        { success: false, error: 'Invalid config' },
        400,
      )
    }
  })

  return api
}
