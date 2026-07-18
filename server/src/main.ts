import { Hono } from 'hono'
import { serve } from 'bun'
import { DeviceManager } from './adb/device-manager'
import { createApiRoutes } from './api/routes'

const app = new Hono()
const deviceManager = new DeviceManager()

// CORS middleware
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type')

  if (c.req.method === 'OPTIONS') {
    return c.text('OK')
  }

  await next()
})

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Serve Device Server',
    version: '0.0.1',
  })
})

// API routes
const apiRoutes = createApiRoutes(deviceManager)
app.route('/api', apiRoutes)

// WebSocket handler
app.get('/api/devices/:deviceId/stream', (c) => {
  const deviceId = c.req.param('deviceId')
  const device = deviceManager.getDevice(deviceId)

  if (!device) {
    return c.json({ error: 'Device not found' }, 404)
  }

  if (!Bun.env.BUN_ENV) {
    return c.text('WebSocket upgrade not supported in this context')
  }

  // This will be handled by the Bun.serve WebSocket upgrade
  return new Response(null, {
    status: 101,
    headers: {
      Upgrade: 'websocket',
      Connection: 'Upgrade',
      'Sec-WebSocket-Key': c.req.header('sec-websocket-key') || '',
      'Sec-WebSocket-Version': '13',
    },
  })
})

const PORT = Bun.env.PORT || 3000

async function startServer() {
  try {
    console.log('Initializing device manager...')
    await deviceManager.initialize()

    const devices = deviceManager.getDevices()
    console.log(`Found ${devices.length} device(s):`)
    devices.forEach((d) => {
      console.log(`  - ${d.id} (${d.model}) [${d.state}]`)
    })

    const server = serve({
      port: Number(PORT),
      fetch: async (req) => {
        // Handle WebSocket upgrade
        if (
          req.headers.get('Upgrade') === 'websocket' &&
          req.url.includes('/api/devices/') &&
          req.url.includes('/stream')
        ) {
          try {
            const url = new URL(req.url)
            const deviceId = url.pathname.split('/')[3]

            if (deviceManager.getDevice(deviceId)) {
              const upgrade = server.upgrade(req)
              if (upgrade) {
                const ws = upgrade
                // TODO: Implement streaming logic
                return new Response(null, { webSocket: ws })
              }
            }
          } catch (error) {
            console.error('WebSocket upgrade error:', error)
          }
        }

        // Regular HTTP requests
        return app.fetch(req)
      },
      websocket: {
        message: async (ws, message) => {
          // Handle WebSocket messages
          console.log('WS message:', message)
        },
        open: async (ws) => {
          console.log('WebSocket connected')
        },
        close: (ws) => {
          console.log('WebSocket closed')
        },
        error: (ws, error) => {
          console.error('WebSocket error:', error)
        },
      },
    })

    console.log(`✅ Server running at http://localhost:${PORT}`)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...')
  deviceManager.dispose()
  process.exit(0)
})

startServer()
