import { Hono } from 'hono'
import { serve } from 'bun'
import { serveStatic } from 'hono/bun'
import path from 'path'
import { DeviceManager } from './adb/device-manager'
import { StreamManager } from './streaming/websocket-handler'
import { createApiRoutes } from './api/routes'
import { createStreamingConfigRoutes } from './api/streaming-config'

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
    message: 'Serve Android Server',
    version: '0.0.1',
  })
})

// API routes
const apiRoutes = createApiRoutes(deviceManager)
const streamingConfigRoutes = createStreamingConfigRoutes(streamManager)
app.route('/api', apiRoutes)
app.route('/api', streamingConfigRoutes)

// Serve static files from built client
const clientDistPath = path.join(process.cwd(), '..', 'client', 'dist')
try {
  app.use('/*', serveStatic({ root: clientDistPath }))
  app.get('/', serveStatic({ path: 'index.html', root: clientDistPath }))
} catch (error) {
  // Client not built yet, that's ok for development
}

let PORT = Number(Bun.env.PORT || 3000)

async function startServer() {
  try {
    console.log('Initializing device manager...')
    await deviceManager.initialize()

    const devices = deviceManager.getDevices()
    console.log(`Found ${devices.length} device(s):`)
    devices.forEach((d) => {
      console.log(`  - ${d.id} (${d.model}) [${d.state}]`)
    })

    // Try to start server on available port
    let server: any = null
    let portAttempt = PORT
    const maxAttempts = 20

    for (let i = 0; i < maxAttempts; i++) {
      try {
        server = serve({
          port: portAttempt,
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

            // Upgrade the connection - this handles the HTTP response internally
            const success = server.upgrade(req, {
              data: { deviceId, clientId },
            })

            if (success) {
              console.log(
                `WebSocket upgrade requested for device ${deviceId}, client ${clientId}`,
              )
              // Don't return anything - let the upgrade complete
              return undefined as any
            } else {
              console.error('WebSocket upgrade failed')
              return new Response('Upgrade failed', { status: 500 })
            }
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
          const data = ws.data as any
          if (data?.deviceId && data?.clientId) {
            wsConnections.set(ws, {
              deviceId: data.deviceId,
              clientId: data.clientId,
            })

            const client = deviceManager.getAdbClient(data.deviceId)
            if (client) {
              streamManager.createStreamForDevice(data.deviceId, client)
              streamManager.addClient(data.deviceId, ws, data.clientId)
            }

            console.log(
              `WebSocket opened: ${data.clientId} for device ${data.deviceId}`,
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

        // Successfully started
        PORT = portAttempt
        console.log(`\n🌐 Open http://localhost:${PORT} in your browser`)
        console.log(`✅ Server running at http://localhost:${PORT}\n`)
        break
      } catch (error: any) {
        // Check if it's an address in use error
        if (error.code === 'EADDRINUSE' || error.message?.includes('port')) {
          portAttempt++
          if (i < maxAttempts - 1) {
            // Try next port
            continue
          }
        }
        // If not a port error or we've exceeded max attempts, throw
        throw error
      }
    }

    if (!server) {
      throw new Error(`Failed to find an available port after ${maxAttempts} attempts starting from ${PORT - maxAttempts}`)
    }
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
