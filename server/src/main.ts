import { Hono } from 'hono'
import { serve } from 'bun'
import { DeviceManager } from './adb/device-manager'
import { StreamManager } from './streaming/websocket-handler'
import { createApiRoutes } from './api/routes'

const app = new Hono()
const deviceManager = new DeviceManager()
const streamManager = new StreamManager()
const wsConnections: Map<any, { deviceId: string; clientId: string }> = new Map()

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
      fetch: async (req: Request): Promise<Response> => {
        // Handle WebSocket upgrade for streaming
        if (
          req.headers.get('Upgrade') === 'websocket' &&
          req.url.includes('/api/devices/') &&
          req.url.includes('/stream')
        ) {
          try {
            const url = new URL(req.url)
            const pathParts = url.pathname.split('/')
            const deviceIndex = pathParts.indexOf('devices')
            const deviceId = pathParts[deviceIndex + 1]

            const device = deviceManager.getDevice(deviceId)
            if (!device) {
              return new Response('Device not found', { status: 404 })
            }

            const client = deviceManager.getAdbClient(deviceId)
            if (!client) {
              return new Response('Device not found', { status: 404 })
            }

            // Upgrade connection to WebSocket
            const clientId = crypto.randomUUID()
            const upgraded: any = server.upgrade(req)

            if (upgraded) {
              wsConnections.set(upgraded, { deviceId, clientId })

              // Initialize stream for this device if needed
              streamManager.createStreamForDevice(deviceId, client)
              streamManager.addClient(deviceId, upgraded, clientId)
              return new Response(null, { status: 101 })
            }

            return new Response('Upgrade failed', { status: 500 })
          } catch (error) {
            console.error('WebSocket upgrade error:', error)
            return new Response('Upgrade failed', { status: 500 })
          }
        }

        // Regular HTTP requests
        return app.fetch(req)
      },
      websocket: {
        message: async (ws: any, message: any) => {
          // Handle incoming messages (for future use)
        },
        open: async (ws: any) => {
          const conn = wsConnections.get(ws)
          if (conn) {
            console.log(
              `WebSocket opened: ${conn.clientId} for device ${conn.deviceId}`,
            )
          }
        },
        close: (ws: any) => {
          const conn = wsConnections.get(ws)
          if (conn) {
            console.log(
              `WebSocket closed: ${conn.clientId} for device ${conn.deviceId}`,
            )
            streamManager.removeClient(conn.deviceId, conn.clientId)
          }
          wsConnections.delete(ws)
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
  streamManager.dispose()
  deviceManager.dispose()
  process.exit(0)
})

startServer()
