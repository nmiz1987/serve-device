# Serve Device AI Skill

Control Android devices programmatically with Claude AI. This TypeScript SDK enables AI agents to take screenshots, interact with device UI, and automate testing flows.

## Installation

```bash
npm install @serve-device/skill
```

## Quick Start

```typescript
import { ServeDeviceClient } from '@serve-device/skill'

// Create client pointing to your Serve Device server
const client = new ServeDeviceClient('http://localhost:3000')

// Get connected devices
const devices = await client.getDevices()
console.log(devices)
// [
//   {
//     id: 'emulator-5554',
//     model: 'Android SDK built for x86',
//     state: 'device',
//     resolution: { width: 1080, height: 1920 }
//   }
// ]

// Control the device
const deviceId = devices[0].id
await client.tap(deviceId, 540, 960)        // Tap at coordinates
await client.type(deviceId, 'Hello, World') // Type text
await client.pressBack(deviceId)            // Press Back button

// Take a screenshot
const screenshot = await client.screenshot(deviceId)
console.log(screenshot.data) // base64 PNG data
```

## Usage with Claude

This skill is designed for use with Claude AI agents. Register it as a tool in your agent:

```typescript
const tools = [
  {
    name: 'control_android_device',
    description: 'Control a connected Android device',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['tap', 'swipe', 'type', 'screenshot', 'press_back'],
          description: 'The action to perform',
        },
        deviceId: {
          type: 'string',
          description: 'ID of the device to control',
        },
        x: { type: 'number', description: 'X coordinate' },
        y: { type: 'number', description: 'Y coordinate' },
        text: { type: 'string', description: 'Text to type' },
      },
    },
  },
]

// In your agent's tool handler:
const client = new ServeDeviceClient('http://localhost:3000')

async function handleTool(toolName: string, toolInput: Record<string, any>) {
  if (toolName === 'control_android_device') {
    const { action, deviceId, x, y, text } = toolInput
    switch (action) {
      case 'tap':
        return await client.tap(deviceId, x, y)
      case 'screenshot':
        return await client.screenshot(deviceId)
      case 'type':
        return await client.type(deviceId, text)
      case 'press_back':
        return await client.pressBack(deviceId)
    }
  }
}
```

## API Reference

### Basic Operations

#### `getDevices(): Promise<Device[]>`
List all connected Android devices.

```typescript
const devices = await client.getDevices()
```

#### `screenshot(deviceId: string): Promise<Screenshot>`
Take a screenshot from the device.

```typescript
const screenshot = await client.screenshot('emulator-5554')
// screenshot.data: base64 PNG
// screenshot.width: number
// screenshot.height: number
// screenshot.capturedAt: Date
```

#### `tap(deviceId: string, x: number, y: number): Promise<void>`
Tap at specific coordinates.

```typescript
await client.tap(deviceId, 540, 960) // Center of 1080x1920 screen
```

#### `swipe(deviceId: string, x1: number, y1: number, x2: number, y2: number, duration?: number): Promise<void>`
Swipe from one point to another (duration in milliseconds).

```typescript
await client.swipe(deviceId, 540, 1600, 540, 400, 500) // Scroll up
```

#### `type(deviceId: string, text: string): Promise<void>`
Type text on the device.

```typescript
await client.type(deviceId, 'Hello, World!')
```

#### `key(deviceId: string, keyCode: string): Promise<void>`
Press a key or key code (e.g., 'KEYCODE_BACK', 'KEYCODE_ENTER').

```typescript
await client.key(deviceId, 'KEYCODE_BACK')
```

### Convenience Methods

#### `pressBack(deviceId: string): Promise<void>`
Press the Back button.

```typescript
await client.pressBack(deviceId)
```

#### `pressHome(deviceId: string): Promise<void>`
Press the Home button.

```typescript
await client.pressHome(deviceId)
```

#### `pressRecent(deviceId: string): Promise<void>`
Press the Recent Apps button.

```typescript
await client.pressRecent(deviceId)
```

#### `pressPower(deviceId: string): Promise<void>`
Press the Power button.

```typescript
await client.pressPower(deviceId)
```

#### `pressVolumeUp(deviceId: string): Promise<void>`
Press Volume Up.

```typescript
await client.pressVolumeUp(deviceId)
```

#### `pressVolumeDown(deviceId: string): Promise<void>`
Press Volume Down.

```typescript
await client.pressVolumeDown(deviceId)
```

### Percentage-Based Operations

These methods use screen percentages (0-100) instead of absolute coordinates, making them more robust to different device resolutions.

#### `tapPercent(deviceId: string, percentX: number, percentY: number): Promise<void>`
Tap at screen percentages.

```typescript
await client.tapPercent(deviceId, 50, 50) // Center of screen
```

#### `swipePercent(deviceId: string, percentX1: number, percentY1: number, percentX2: number, percentY2: number, duration?: number): Promise<void>`
Swipe using screen percentages.

```typescript
await client.swipePercent(deviceId, 50, 80, 50, 20, 500) // Scroll up
```

### Scrolling

#### `scrollDown(deviceId: string, distance?: number, duration?: number): Promise<void>`
Scroll down (swipe up from middle of screen).

```typescript
await client.scrollDown(deviceId, 500, 300) // Scroll down 500px in 300ms
```

#### `scrollUp(deviceId: string, distance?: number, duration?: number): Promise<void>`
Scroll up (swipe down from middle of screen).

```typescript
await client.scrollUp(deviceId, 500, 300)
```

### Advanced Interactions

#### `interact(deviceId: string, action: () => Promise<void>, delayMs?: number): Promise<{ before: Screenshot; after: Screenshot }>`
Perform an action and capture before/after screenshots for vision-based automation.

```typescript
const { before, after } = await client.interact(deviceId, async () => {
  await client.tap(deviceId, 540, 960)
}, 500)

// Use before/after for visual comparison or UI analysis
```

#### `chain(deviceId: string, ...commands: Array<{ action: () => Promise<void>; delay?: number }>): Promise<void>`
Execute multiple commands in sequence with optional delays.

```typescript
await client.chain(
  deviceId,
  { action: () => client.tapPercent(deviceId, 50, 50), delay: 200 },
  { action: () => client.type(deviceId, 'Search query') },
  { action: () => client.key(deviceId, 'KEYCODE_ENTER'), delay: 500 },
)
```

#### `doubleTap(deviceId: string, x: number, y: number, delayMs?: number): Promise<void>`
Double-tap at coordinates.

```typescript
await client.doubleTap(deviceId, 540, 960, 100)
```

#### `longPress(deviceId: string, x: number, y: number, duration?: number): Promise<void>`
Long-press (hold for duration milliseconds).

```typescript
await client.longPress(deviceId, 540, 960, 1000) // Hold for 1 second
```

### Utilities

#### `waitForDevice(deviceId: string, maxWaitTime?: number): Promise<boolean>`
Wait for a device to be connected and ready.

```typescript
const ready = await client.waitForDevice('emulator-5554', 30000)
if (!ready) {
  throw new Error('Device not ready')
}
```

#### `getDevice(deviceId: string): Promise<Device | null>`
Get information about a specific device.

```typescript
const device = await client.getDevice('emulator-5554')
if (device?.state === 'device') {
  console.log(`Device ready: ${device.model}`)
}
```

#### `saveScreenshot(deviceId: string, filepath: string): Promise<void>`
Save screenshot to a file (Node.js only).

```typescript
await client.saveScreenshot('emulator-5554', './screenshot.png')
```

## AI Agent Integration Examples

### Vision-Based Testing
```typescript
// Take screenshot, analyze with Claude vision, decide next action
const screenshot = await client.screenshot(deviceId)
const base64Image = screenshot.data

// Send to Claude for analysis
const analysis = await claude.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: base64Image },
        },
        { type: 'text', text: 'What buttons are visible on this screen?' },
      ],
    },
  ],
})
```

### Form Filling Automation
```typescript
await client.chain(
  deviceId,
  { action: () => client.tapPercent(deviceId, 50, 30) },  // Focus name field
  { action: () => client.type(deviceId, 'John Doe'), delay: 200 },
  { action: () => client.key(deviceId, 'KEYCODE_TAB') },  // Move to email
  { action: () => client.type(deviceId, 'john@example.com'), delay: 200 },
  { action: () => client.key(deviceId, 'KEYCODE_TAB') },  // Move to submit
  { action: () => client.key(deviceId, 'KEYCODE_ENTER') }, // Submit form
)
```

### Navigation Testing
```typescript
const pages: string[] = []

for (let i = 0; i < 5; i++) {
  const screenshot = await client.screenshot(deviceId)
  pages.push(screenshot.data)

  // Scroll to next page
  await client.scrollDown(deviceId)
  await new Promise((r) => setTimeout(r, 500)) // Wait for animation
}

// pages now contains screenshots of each screen
```

## Configuration

### Timeout Control
Set custom request timeout (default: 30s):

```typescript
const client = new ServeDeviceClient(
  'http://localhost:3000',
  60000, // 60 second timeout
)
```

### Error Handling
```typescript
try {
  await client.tap(deviceId, 100, 100)
} catch (error) {
  if (error.message.includes('HTTP 404')) {
    console.error('Device not found')
  } else if (error.name === 'AbortError') {
    console.error('Request timeout')
  } else {
    console.error('Unexpected error:', error.message)
  }
}
```

## Key Codes

Common Android key codes for use with `key()`:

| Key | Code |
|-----|------|
| Back | `KEYCODE_BACK` |
| Home | `KEYCODE_HOME` |
| Recent Apps | `KEYCODE_APP_SWITCH` |
| Power | `KEYCODE_POWER` |
| Volume Up | `KEYCODE_VOLUME_UP` |
| Volume Down | `KEYCODE_VOLUME_DOWN` |
| Enter | `KEYCODE_ENTER` |
| Delete | `KEYCODE_DEL` |
| Space | `KEYCODE_SPACE` |
| Tab | `KEYCODE_TAB` |
| D-pad Up | `KEYCODE_DPAD_UP` |
| D-pad Down | `KEYCODE_DPAD_DOWN` |
| D-pad Left | `KEYCODE_DPAD_LEFT` |
| D-pad Right | `KEYCODE_DPAD_RIGHT` |

See [Android KeyEvent documentation](https://developer.android.com/reference/android/view/KeyEvent) for complete list.

## Performance Tips

1. **Batch operations** - Use `chain()` to reduce latency between commands
2. **Use percentages** - `tapPercent()` and `swipePercent()` work across device resolutions
3. **Cache device info** - Call `getDevice()` once and reuse resolution data
4. **Screenshot timing** - Add delays after UI animations before taking screenshots
5. **Connection pooling** - Reuse the same `ServeDeviceClient` instance

## Troubleshooting

### "Device not found"
```typescript
const devices = await client.getDevices()
console.log(devices) // Check if your device is listed

// Wait for device to be ready
const ready = await client.waitForDevice(deviceId, 10000)
```

### "Command timeout"
```typescript
// Increase timeout for slow operations
const client = new ServeDeviceClient('http://localhost:3000', 60000)
```

### "Cannot connect to server"
```typescript
// Verify server is running
// Default URL: http://localhost:3000
// Check CORS settings if accessing from different domain
```

### Screenshot is blank or black
- Ensure device screen is not locked
- Check device state with `getDevice()`
- Try `pressHome()` to wake the device

## Contributing

Issues and pull requests welcome! Please report bugs at the [project repository](https://github.com/anthropics/serve-device).

## License

MIT
