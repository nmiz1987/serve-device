# Development Guide

## Current Status

**Phases Completed:**
- ✅ Phase 1: Core Infrastructure
- ✅ Phase 2: Streaming Pipeline
- ✅ Phase 3: Input Control (Backend & Frontend)
- ⏳ Phase 4: React Frontend UI Polish
- ⏳ Phase 5: AI Agent Skill API

## Architecture

### Backend (Bun + Hono)
```
server/src/
├── adb/
│   ├── client.ts           # ADB CLI wrapper for device commands
│   └── device-manager.ts   # Device discovery and state management
├── streaming/
│   ├── encoder.ts          # Frame capture from ADB screencap
│   ├── frame-buffer.ts     # Ring buffer for multi-frame storage
│   └── websocket-handler.ts # Stream manager and client handling
├── api/
│   └── routes.ts           # REST API endpoints
└── main.ts                 # Bun server + WebSocket upgrade handler
```

**Key Components:**
- **DeviceManager**: Auto-discovers USB-connected devices, maintains state, refreshes every 5s
- **FrameEncoder**: Captures PNG screenshots via ADB, measures timing
- **StreamManager**: Manages multiple WebSocket clients per device, broadcasts frames at configurable FPS (default 30)
- **REST API**: Full CRUD for device operations (tap, swipe, type, key, screenshot)

### Frontend (React + Vite)
```
client/src/
├── components/
│   ├── DeviceSelector.tsx  # Device list with selection
│   ├── StreamViewer.tsx    # Canvas for video display
│   ├── InputOverlay.tsx    # Click/drag/keyboard capture
│   └── Controls.tsx        # Manual button controls
├── hooks/
│   ├── useDeviceStream.ts  # WebSocket + frame decoding
│   └── useInputControl.ts  # REST API command batching
├── style/
│   └── globals.css         # Dark theme styling
└── App.tsx                 # Main app component
```

**Key Features:**
- Real-time frame streaming via WebSocket
- Mouse click → tap, drag → swipe
- Keyboard shortcuts (Escape→Back, Home, etc.)
- FPS counter and latency display
- Manual control buttons (Back, Home, Volume, Power)

## Building & Running

### Install Dependencies
```bash
bun install
```

### Development Mode
```bash
bun run dev
```
This starts:
- Backend server on `http://localhost:3000`
- Frontend dev server on `http://localhost:5173`

### Production Build
```bash
bun run build
```

### Type Checking
```bash
cd server && bunx tsc --noEmit
cd client && bunx tsc --noEmit
```

## API Endpoints

### Device Management
```bash
GET /api/devices                      # List all devices
GET /api/devices/{deviceId}           # Get device info
GET /api/devices/{deviceId}/screenshot # Get PNG screenshot
```

### Input Control
```bash
POST /api/devices/{deviceId}/input/tap
  Body: { "x": number, "y": number }

POST /api/devices/{deviceId}/input/swipe
  Body: { "x1": number, "y1": number, "x2": number, "y2": number, "duration"?: number }

POST /api/devices/{deviceId}/input/type
  Body: { "text": string }

POST /api/devices/{deviceId}/input/key
  Body: { "keyCode": string }
```

### WebSocket Streaming
```
WS /api/devices/{deviceId}/stream
```
Sends frame messages:
```json
{
  "type": "frame",
  "deviceId": "string",
  "timestamp": number,
  "frameNumber": number,
  "data": "base64 PNG",
  "width": number,
  "height": number
}
```

## Current Limitations & TODOs

### Performance
- **Current FPS**: ~20-30 FPS (USB ADB bottleneck)
- **Target FPS**: 60 FPS (requires H.264 encoding)
- **Next**: Implement libav/ffmpeg H.264 encoder for better throughput

### Streaming
- ✅ PNG frame capture and WebSocket broadcast
- ⏳ H.264 hardware video encoding
- ⏳ Frame resolution downscaling option
- ⏳ Bandwidth optimization

### UI Polish
- ⏳ Device resolution detection and display scaling
- ⏳ Fullscreen mode for stream viewer
- ⏳ Screenshot download capability
- ⏳ Connection status indicator
- ⏳ Frame rate/latency monitoring graphs

### Testing
- ⏳ Unit tests for ADB command builders
- ⏳ Integration tests for device discovery
- ⏳ E2E tests for full control workflow
- ⏳ Performance benchmarking

## Debugging

### Enable logging
```bash
# Server logs device discovery, stream events, frame times
DEBUG=serve-device bun run --cwd server dev

# Browser console logs frame reception, WebSocket messages
```

### Common Issues

**Device not found:**
```bash
adb devices    # Verify device shows up
adb shell getprop ro.product.model  # Test device connectivity
```

**WebSocket connection fails:**
- Check backend is running on port 3000
- Check CORS headers in browser DevTools
- Verify firewall allows localhost connections

**Low frame rate:**
- Measure `adb shell screencap` time: `time adb shell screencap /sdcard/test.png`
- Check USB bandwidth: may be saturated by other processes
- Try USB 3.0 cable or higher quality USB connection

### Performance Profiling

Browser DevTools:
1. Open Performance tab
2. Record while using the app
3. Look for:
   - Frame decoding time (should be <16.67ms for 60 FPS)
   - Canvas render time
   - Network message processing

Server logs show:
- Frame capture time (in milliseconds)
- Frames per second achieved
- WebSocket send errors

## Next Steps

### Immediate (Phase 4 Frontend Polish)
1. Add device resolution scaling to canvas
2. Implement fullscreen mode
3. Add connection status indicators
4. Improve error handling and user feedback
5. Style improvements and responsive design

### Medium-term (Phase 2 Optimization)
1. Implement H.264 hardware encoding
2. Add frame resolution downscaling
3. Optimize WebSocket frame batching
4. Add video codec selection UI

### Long-term (Phase 5 AI Integration)
1. Finalize AI skill API design
2. Create NPM package for React Native
3. Document API for agent developers
4. Test with Claude Agent SDK

## Architecture Decision Log

### Why Bun?
- Native TypeScript support without build step
- Built-in WebSocket server with excellent performance
- Fast startup time
- Smaller bundle than Node.js for production

### Why Hono?
- Ultra-lightweight framework (~13kb)
- Excellent TypeScript support
- Works perfectly with Bun
- Simple middleware system

### Why PNG frames over H.264?
- MVP simplicity: no codec dependencies
- Works immediately with ADB screencap
- Browser-native image decoding
- Easy to debug (can save frames to disk)
- Trade-off: ~3-5x larger frame size than H.264

**When to upgrade to H.264:**
- If FPS drops below 20 consistently
- When targeting 60+ FPS
- For production deployment

### Why Bun's native WebSocket?
- Lowest latency (no middleware overhead)
- Built-in server.upgrade() for upgrades
- Automatic frame buffering
- No external dependencies

## Troubleshooting Checklist

Before debugging, verify:
- [ ] `adb devices` shows your device
- [ ] Device USB debugging is enabled
- [ ] No other adb processes running (kill with `adb kill-server`)
- [ ] Backend runs: `bun run --cwd server dev`
- [ ] Frontend runs: `bun run --cwd client dev`
- [ ] Browser can reach `localhost:3000/api/devices`
- [ ] WebSocket upgrade succeeds (check browser DevTools Network tab)

## File Structure Diagram

```
serve-device/
├── server/              # Bun backend
│   ├── src/
│   │   ├── adb/        # Android Device Bridge integration
│   │   ├── streaming/  # WebSocket frame broadcasting
│   │   ├── api/        # REST API routes
│   │   └── main.ts     # Server entry
│   ├── package.json
│   └── tsconfig.json
│
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── components/ # React UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── style/      # CSS styling
│   │   └── App.tsx     # Root component
│   ├── index.html      # HTML template
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── shared/              # Shared types & utilities
│   ├── types.ts        # API and message types
│   ├── utils.ts        # Coordinate and parsing utils
│   └── package.json
│
├── scripts/            # Bash utilities
│   ├── adb-discover.sh
│   └── setup.sh
│
├── package.json        # Root workspace config
├── bun.lock           # Dependency lock file
├── README.md          # User guide
└── DEVELOPMENT.md     # This file
```

## Contributing

When making changes:
1. Keep TypeScript types strict
2. Follow existing code style
3. Test with real device if possible
4. Update this guide if architecture changes
5. Commit with descriptive messages

## Performance Targets

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| Frame Rate | 20-30 FPS | 60 FPS | Requires H.264 encoding |
| Latency | 100-200ms | <50ms | Time from click to device response |
| Frame Size | 200-400 KB | 50-100 KB | With H.264 encoding |
| Startup Time | <2s | <1s | Server startup only |
| WebSocket Connect | <500ms | <100ms | After device selection |
