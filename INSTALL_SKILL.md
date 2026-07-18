# Installing Serve Android Skill in Your Project

The Serve Android Skill is a TypeScript SDK that allows developers and AI agents to control Android devices programmatically.

## Installation Options

Choose how to install based on your needs:

### Option 1: Local Installation (Recommended)
```bash
npm install serve-android-skill
```
✅ Best for: Single projects, teams, CI/CD pipelines

### Option 2: Global Installation
```bash
npm install -g @serve-android/skill
```
✅ Best for: Multiple projects, quick prototyping

👉 **[Read Full Installation Options Guide](skill/INSTALLATION_OPTIONS.md)** for detailed comparison and examples.

## Setup

### Step 1: Start the Serve Android Server

First, make sure the Serve Android server is running:

```bash
npx serve-android
```

This starts the server on `http://localhost:3000` with a connected Android device.

### Step 2: Import the Skill in Your Project

```typescript
import { ServeDeviceClient } from '@serve-android/skill'

// Create a client pointing to your server
const client = new ServeDeviceClient('http://localhost:3000')
```

### Step 3: Start Using It

```typescript
// Get all connected devices
const devices = await client.getDevices()
console.log(devices)

// Control a device
const deviceId = devices[0].id

// Take a screenshot
const screenshot = await client.screenshot(deviceId)
console.log(`Screenshot: ${screenshot.width}x${screenshot.height}`)

// Tap at coordinates
await client.tap(deviceId, 540, 960)

// Type text
await client.type(deviceId, 'Hello World')

// Press buttons
await client.pressBack(deviceId)
```

## Common Use Cases

### Automated Testing
```typescript
// Test an app installation
const deviceId = devices[0].id

// Open Play Store
await client.tapPercent(deviceId, 50, 50)

// Search for app
await client.type(deviceId, 'MyApp')

// Install and verify
const screenshot = await client.screenshot(deviceId)
```

### Vision-Based Automation
```typescript
// Take screenshot and analyze with AI
const screenshot = await client.screenshot(deviceId)

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
          source: { type: 'base64', media_type: 'image/png', data: screenshot.data },
        },
        { type: 'text', text: 'What do you see on this screen?' },
      ],
    },
  ],
})

// Use the analysis to decide next action
if (analysis.content[0].type === 'text') {
  console.log(analysis.content[0].text)
}
```

### Form Filling
```typescript
// Fill a form on the device
await client.chain(
  deviceId,
  { action: () => client.tapPercent(deviceId, 50, 20) },    // Name field
  { action: () => client.type(deviceId, 'John Doe'), delay: 200 },
  { action: () => client.key(deviceId, 'KEYCODE_TAB') },    // Next field
  { action: () => client.type(deviceId, 'john@example.com'), delay: 200 },
  { action: () => client.key(deviceId, 'KEYCODE_ENTER') },  // Submit
)
```

### Multi-Device Testing
```typescript
// Get all devices
const devices = await client.getDevices()

// Run tests on each device
for (const device of devices) {
  console.log(`Testing on ${device.model}`)
  
  // Run your test
  await client.tapPercent(device.id, 50, 50)
  const screenshot = await client.screenshot(device.id)
  
  // Verify result
  console.log(`Captured: ${screenshot.width}x${screenshot.height}`)
}
```

## API Reference

All methods return Promises. Here's a quick reference:

### Screenshots & Info
- `getDevices()` - List all connected devices
- `getDevice(deviceId)` - Get info about a specific device
- `screenshot(deviceId)` - Capture device screen (base64 PNG)
- `waitForDevice(deviceId, maxWaitTime)` - Wait for device to be ready

### Touch Interactions
- `tap(deviceId, x, y)` - Tap at coordinates
- `tapPercent(deviceId, percentX, percentY)` - Tap by screen percentage
- `doubleTap(deviceId, x, y, delayMs)` - Double-tap
- `longPress(deviceId, x, y, duration)` - Hold for duration
- `swipe(deviceId, x1, y1, x2, y2, duration)` - Swipe gesture
- `swipePercent(deviceId, percentX1, percentY1, percentX2, percentY2, duration)`
- `scrollDown(deviceId, distance, duration)` - Scroll down
- `scrollUp(deviceId, distance, duration)` - Scroll up

### Text & Keys
- `type(deviceId, text)` - Type text
- `key(deviceId, keyCode)` - Press a key (e.g., 'KEYCODE_BACK')

### Convenience Methods
- `pressBack(deviceId)` - Press Back button
- `pressHome(deviceId)` - Press Home button
- `pressRecent(deviceId)` - Press Recent Apps
- `pressPower(deviceId)` - Press Power button
- `pressVolumeUp(deviceId)` - Press Volume Up
- `pressVolumeDown(deviceId)` - Press Volume Down

### Advanced
- `chain(deviceId, ...commands)` - Execute commands in sequence
- `interact(deviceId, action, delayMs)` - Perform action and capture before/after screenshots
- `saveScreenshot(deviceId, filepath)` - Save screenshot to file

## Configuration

### Custom Server URL
```typescript
// If your server is on a different host/port
const client = new ServeDeviceClient('http://192.168.1.100:3000')
```

### Custom Timeout
```typescript
// Increase timeout for slow operations (default: 30s)
const client = new ServeDeviceClient('http://localhost:3000', 60000)
```

## Error Handling

```typescript
try {
  await client.tap(deviceId, 100, 100)
} catch (error) {
  if (error.message.includes('404')) {
    console.error('Device not found')
  } else if (error.message.includes('timeout')) {
    console.error('Request timed out')
  } else {
    console.error('Error:', error.message)
  }
}
```

## TypeScript Support

The skill includes full TypeScript definitions:

```typescript
import { ServeDeviceClient, Device, Screenshot } from '@serve-android/skill'

const client = new ServeDeviceClient('http://localhost:3000')
const devices: Device[] = await client.getDevices()
const screenshot: Screenshot = await client.screenshot(devices[0].id)
```

## Troubleshooting

### "Cannot connect to server"
- Make sure `npx serve-android` is running
- Check the server URL in your code
- Verify no firewall is blocking the connection

### "Device not found"
```typescript
// Check available devices
const devices = await client.getDevices()
console.log('Available devices:', devices)

// Wait for device to be ready
const ready = await client.waitForDevice(deviceId, 10000)
```

### "Command timeout"
```typescript
// Increase timeout for slow operations
const client = new ServeDeviceClient('http://localhost:3000', 60000)
```

### "Screenshot is blank"
- Device screen may be locked - try `pressHome()` first
- Check device state: `const device = await client.getDevice(deviceId)`
- Give the app time to render before taking screenshot

## Integration with Claude AI

Use with Claude API to build intelligent automation:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { ServeDeviceClient } from '@serve-android/skill'

const claude = new Anthropic()
const client = new ServeDeviceClient('http://localhost:3000')

// Define tools for Claude
const tools = [
  {
    name: 'take_screenshot',
    description: 'Take a screenshot of the Android device',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'tap_screen',
    description: 'Tap on the device screen',
    input_schema: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
      },
      required: ['x', 'y'],
    },
  },
  {
    name: 'type_text',
    description: 'Type text on the device',
    input_schema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    },
  },
]

// Use with Claude
const response = await claude.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  tools: tools,
  messages: [
    {
      role: 'user',
      content: 'Take a screenshot and tell me what you see',
    },
  ],
})

// Handle tool calls from Claude
for (const block of response.content) {
  if (block.type === 'tool_use') {
    if (block.name === 'take_screenshot') {
      const screenshot = await client.screenshot(deviceId)
      console.log('Screenshot taken:', screenshot.width, 'x', screenshot.height)
    } else if (block.name === 'tap_screen') {
      await client.tap(deviceId, block.input.x, block.input.y)
    } else if (block.name === 'type_text') {
      await client.type(deviceId, block.input.text)
    }
  }
}
```

## Support

For issues and questions:
- 📖 [Full Documentation](skill/README.md)
- 🐛 [Report Bugs](https://github.com/nmiz1987/serve-device/issues)
- 💬 [Discussions](https://github.com/nmiz1987/serve-device/discussions)

## License

MIT
