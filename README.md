# Serve Android

Android device control and streaming via web interface. Stream your Android device screen to a web browser and control it remotely with your mouse and keyboard.

## Features

- 📱 **Device Discovery** - Automatically detects all connected Android devices
- 🎮 **Remote Control** - Control your device via web interface
  - Tap/click to touch
  - Drag to swipe
  - Type text
  - Key commands (Back, Home, Volume, etc.)
- 📺 **Live Streaming** - Real-time device screen streaming
- 🤖 **AI Integration** - REST API for AI agents to control devices
- ⚡ **High Performance** - Optimized for 60+ FPS streaming

## Requirements

- **Node.js/Bun** - JavaScript runtime
- **Android Debug Bridge (ADB)** - For device communication
  - macOS: `brew install android-platform-tools`
  - Linux: `apt-get install adb`
  - Windows: [Download from Android Developer Tools](https://developer.android.com/studio/command-line/adb)

## Quick Start

### For End Users (Web UI)

1. **Connect your Android device**
   - USB: Connect via USB cable and enable USB debugging
   - Emulator: Start an Android emulator
   - Verify: `adb devices`

2. **Start Serve Android**
   ```bash
   npx serve-android
   # or with bun
   bunx serve-android
   ```

3. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Select a device from the dropdown
   - Start controlling!

### For Developers (Using the Skill SDK)

1. **Install the skill in your project**
   ```bash
   npm install @serve-android/skill
   ```

2. **Start the Serve Android server**
   ```bash
   npx serve-android
   ```

3. **Use the SDK in your code**
   ```typescript
   import { ServeDeviceClient } from '@serve-android/skill'
   
   const client = new ServeDeviceClient('http://localhost:3000')
   const devices = await client.getDevices()
   await client.tap(devices[0].id, 540, 960)
   ```

📖 [Read the Skill Installation Guide](INSTALL_SKILL.md) for more examples and use cases.

## Project Structure

```
serve-android/
├── server/          # Bun backend (TypeScript)
│   └── src/
│       ├── adb/     # Android Debug Bridge integration
│       ├── api/     # REST API routes
│       └── main.ts  # Server entry point
├── client/          # React frontend (TypeScript)
│   └── src/
│       ├── components/  # React components
│       ├── hooks/       # Custom hooks
│       └── App.tsx      # Main app
└── shared/          # Shared types and utilities
```

## API Endpoints

### Devices
- `GET /api/devices` - List all connected devices
- `GET /api/devices/{deviceId}` - Get device info
- `GET /api/devices/{deviceId}/screenshot` - Get current screenshot

### Input Control
- `POST /api/devices/{deviceId}/input/tap` - Tap at coordinates
- `POST /api/devices/{deviceId}/input/swipe` - Swipe gesture
- `POST /api/devices/{deviceId}/input/type` - Type text
- `POST /api/devices/{deviceId}/input/key` - Press key

### Streaming
- `WS /api/devices/{deviceId}/stream` - WebSocket for video frames

## Example Usage

### Web UI
1. Connect device via USB
2. Open `http://localhost:5173`
3. Click on your device to start streaming
4. Click/drag/type to control

### API (for AI agents)
```bash
# Get devices
curl http://localhost:3000/api/devices

# Take screenshot
curl http://localhost:3000/api/devices/device_id/screenshot | base64 -D > screen.png

# Tap at coordinates
curl -X POST http://localhost:3000/api/devices/device_id/input/tap \
  -H "Content-Type: application/json" \
  -d '{"x": 540, "y": 960}'

# Swipe
curl -X POST http://localhost:3000/api/devices/device_id/input/swipe \
  -H "Content-Type: application/json" \
  -d '{"x1": 540, "y1": 1000, "x2": 540, "y2": 500, "duration": 300}'
```

## Keyboard Shortcuts

- **Escape** - Back button
- **Home** - Home button
- **Space** - Space
- **Enter** - Enter
- **Backspace** - Delete
- **Arrow Keys** - D-pad navigation

## Performance

- **Streaming**: PNG frames over WebSocket (MVP) → H.264 encoding (future)
- **FPS**: Target 60 FPS (realistic 20-30 FPS with USB ADB)
- **Latency**: ~100-200ms end-to-end

## Development

### Watch files and rebuild
```bash
bun run dev
```

### Build for production
```bash
bun run build
```

### Type checking
```bash
bun run type-check
```

## Troubleshooting

### Device not found
- Ensure ADB is installed: `adb --version`
- Check connection: `adb devices`
- Enable USB debugging on your Android device
- For wireless: `adb connect <device-ip>:5555`

### WebSocket connection fails
- Ensure backend is running on port 3000
- Check browser console for errors
- Try refreshing the page

### Low frame rate
- Reduce device resolution (settings coming soon)
- Close other applications
- Use USB 3.0 cable for better throughput

## License

MIT

## Contributing

Contributions welcome! Please open issues and PRs.
