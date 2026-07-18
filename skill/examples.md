# Serve Device Skill - Usage Examples

This document shows practical examples of using the Serve Device Skill with Claude AI for device automation and testing.

## Basic Setup

```typescript
import { ServeDeviceClient } from '@serve-device/skill'

const client = new ServeDeviceClient('http://localhost:3000')
```

## Example 1: Simple App Navigation

Tap buttons and navigate through an app:

```typescript
async function navigateApp(deviceId: string) {
  // Start app by tapping icon
  await client.tapPercent(deviceId, 50, 80) // Tap app icon at bottom center
  await new Promise((r) => setTimeout(r, 2000)) // Wait for app to open

  // Tap menu button
  await client.tapPercent(deviceId, 10, 10) // Menu in top-left

  // Tap settings option
  await client.tapPercent(deviceId, 50, 30) // Settings option

  // Take final screenshot
  const screenshot = await client.screenshot(deviceId)
  console.log('Final screen captured')
}

// Usage
const devices = await client.getDevices()
await navigateApp(devices[0].id)
```

## Example 2: Form Filling with Vision

Use Claude vision to understand forms and fill them:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

async function fillFormWithVision(
  deviceId: string,
  instructions: string,
): Promise<string> {
  // Take screenshot to see current state
  const screenshot = await client.screenshot(deviceId)

  // Ask Claude what to do next
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: screenshot.data,
            },
          },
          {
            type: 'text',
            text: `I need help filling a form. Current screen shown above.\n\nInstructions: ${instructions}\n\nDescribe what input fields you see and their approximate locations (as percentages from top-left).`,
          },
        ],
      },
    ],
  })

  const analysis = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as any).text)
    .join('\n')

  return analysis
}

// Usage
const devices = await client.getDevices()
const analysis = await fillFormWithVision(
  devices[0].id,
  'Fill in name as "John Doe" and email as "john@example.com"',
)
console.log('Form analysis:', analysis)
```

## Example 3: Testing Login Flow

Complete login scenario with error handling:

```typescript
async function testLoginFlow(
  deviceId: string,
  username: string,
  password: string,
): Promise<boolean> {
  const device = await client.getDevice(deviceId)
  if (!device || device.state !== 'device') {
    throw new Error('Device not ready')
  }

  try {
    // Clear app data by going to home
    await client.pressHome(deviceId)
    await new Promise((r) => setTimeout(r, 500))

    // Open login app
    await client.tapPercent(deviceId, 50, 50) // Tap in center (adjust for your app)
    await new Promise((r) => setTimeout(r, 2000))

    // Fill username
    await client.tapPercent(deviceId, 50, 30) // Username field
    await client.type(deviceId, username)

    // Fill password
    await client.tapPercent(deviceId, 50, 40) // Password field
    await client.type(deviceId, password)

    // Submit
    await client.tapPercent(deviceId, 50, 60) // Login button
    await new Promise((r) => setTimeout(r, 3000))

    // Check if login succeeded
    const screenshot = await client.screenshot(deviceId)
    // Parse screenshot or use vision to verify success
    return true
  } catch (error) {
    console.error('Login test failed:', error)
    return false
  }
}

// Usage
const success = await testLoginFlow(
  devices[0].id,
  'testuser',
  'password123',
)
console.log('Login test:', success ? 'PASSED' : 'FAILED')
```

## Example 4: Scrolling and List Navigation

Navigate through scrollable lists:

```typescript
async function listAllItems(
  deviceId: string,
  maxItems = 20,
): Promise<string[]> {
  const items: string[] = []
  let previousContent = ''

  for (let i = 0; i < maxItems; i++) {
    // Take screenshot
    const screenshot = await client.screenshot(deviceId)

    // Use vision to extract items from current view
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshot.data,
              },
            },
            {
              type: 'text',
              text: 'Extract all visible list item titles from this screen. Previous items seen: ' +
                previousContent +
                '. Only return NEW items not previously seen, one per line.',
            },
          ],
        },
      ],
    })

    const newItems =
      response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n')
        .split('\n')
        .filter((item) => item.trim()) || []

    items.push(...newItems)

    if (newItems.length === 0) {
      // No new items, probably reached end of list
      break
    }

    previousContent = newItems.join(', ')

    // Scroll down for next items
    await client.scrollDown(deviceId, 400, 300)
    await new Promise((r) => setTimeout(r, 500))
  }

  return items
}

// Usage
const allItems = await listAllItems(devices[0].id)
console.log('Found items:', allItems)
```

## Example 5: Screenshot Comparison

Compare before/after screenshots:

```typescript
async function tapAndCompare(
  deviceId: string,
  x: number,
  y: number,
): Promise<{ changed: boolean; description: string }> {
  const before = await client.screenshot(deviceId)

  await client.tap(deviceId, x, y)
  await new Promise((r) => setTimeout(r, 1000))

  const after = await client.screenshot(deviceId)

  // Use Claude to compare
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'I have two screenshots - BEFORE and AFTER a tap action. Identify what changed.',
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: before.data,
            },
          },
          {
            type: 'text',
            text: 'BEFORE (above)',
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: after.data,
            },
          },
          {
            type: 'text',
            text: 'AFTER (above). What changed? Did the UI respond to the tap?',
          },
        ],
      },
    ],
  })

  const description = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as any).text)
    .join('\n')

  return {
    changed: !description.includes('no change') && !description.includes('No change'),
    description,
  }
}

// Usage
const result = await tapAndCompare(devices[0].id, 540, 960)
console.log('Tap result:', result)
```

## Example 6: Multi-Device Synchronization

Control multiple devices simultaneously:

```typescript
async function testOnAllDevices(
  testFn: (deviceId: string) => Promise<boolean>,
): Promise<Map<string, boolean>> {
  const devices = await client.getDevices()
  const results = new Map<string, boolean>()

  // Run tests in parallel
  await Promise.all(
    devices.map(async (device) => {
      try {
        const passed = await testFn(device.id)
        results.set(device.id, passed)
      } catch (error) {
        console.error(`Test on ${device.id} failed:`, error)
        results.set(device.id, false)
      }
    }),
  )

  return results
}

// Usage
const testResults = await testOnAllDevices(async (deviceId) => {
  await client.pressHome(deviceId)
  const screenshot = await client.screenshot(deviceId)
  return screenshot.data.length > 0
})

console.log('Test results:')
testResults.forEach((passed, deviceId) => {
  console.log(`  ${deviceId}: ${passed ? 'PASS' : 'FAIL'}`)
})
```

## Example 7: Gesture Automation

Perform complex gestures:

```typescript
async function gestureExamples(deviceId: string) {
  // Double tap to zoom
  await client.doubleTap(deviceId, 540, 960, 100)

  // Long press for context menu
  await client.longPress(deviceId, 540, 960, 1500)

  // Pinch zoom (two-finger swipe - simulate by two separate swipes)
  // Note: Real pinch would need more sophisticated simulation
  const centerX = 540
  const centerY = 960

  // Pinch out (move fingers apart)
  await client.swipe(deviceId, centerX - 200, centerY, centerX - 100, centerY, 300)

  // Fling/flick (fast swipe)
  await client.swipe(deviceId, centerX, centerY + 400, centerX, centerY - 400, 200)
}

// Usage
await gestureExamples(devices[0].id)
```

## Example 8: Integration with Claude Agent

Full agent loop for device automation:

```typescript
async function automationAgent(
  deviceId: string,
  goal: string,
  maxIterations = 10,
): Promise<string> {
  let iteration = 0
  let lastAction = 'Started automation'

  while (iteration < maxIterations) {
    iteration++

    // Take screenshot to see current state
    const screenshot = await client.screenshot(deviceId)

    // Ask Claude what to do next
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system:
        'You are an expert at testing Android apps. You can see the current screen and need to complete a task.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshot.data,
              },
            },
            {
              type: 'text',
              text: `Goal: ${goal}\n\nLast action: ${lastAction}\n\nWhat should I do next? Respond with one action in this format:\nACTION: [tap|swipe|type|press_back|press_home|scroll_down|screenshot]\nCOORDINATES: [x,y] (if applicable)\nDETAILS: [additional info]\nREASON: [why this action]`,
            },
          ],
        },
      ],
    })

    const actionText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n')

    console.log(`Iteration ${iteration}:`, actionText)

    // Parse and execute action
    const actionMatch = actionText.match(/ACTION:\s*(\w+)/i)
    if (!actionMatch) {
      return 'Agent completed or unable to continue'
    }

    const action = actionMatch[1].toLowerCase()
    lastAction = action

    if (action === 'screenshot') {
      return 'Goal achieved - final screenshot taken'
    } else if (action === 'tap') {
      const coordMatch = actionText.match(/COORDINATES:\s*(\d+),(\d+)/)
      if (coordMatch) {
        await client.tap(deviceId, parseInt(coordMatch[1]), parseInt(coordMatch[2]))
      }
    } else if (action === 'type') {
      const textMatch = actionText.match(/DETAILS:\s*(.+?)(?:\nREASON|$)/s)
      if (textMatch) {
        await client.type(deviceId, textMatch[1].trim())
      }
    } else if (action === 'press_back') {
      await client.pressBack(deviceId)
    } else if (action === 'press_home') {
      await client.pressHome(deviceId)
    } else if (action === 'scroll_down') {
      await client.scrollDown(deviceId)
    }

    await new Promise((r) => setTimeout(r, 500))
  }

  return `Completed ${maxIterations} iterations`
}

// Usage
const result = await automationAgent(
  devices[0].id,
  'Navigate to settings and verify version number',
)
console.log('Automation result:', result)
```

## Best Practices

1. **Always wait for state changes** - Add delays after tap/type actions
2. **Use vision for verification** - Let Claude analyze screenshots
3. **Handle errors gracefully** - Wrap in try-catch, add recovery logic
4. **Cache device info** - Reuse `getDevice()` results for resolution
5. **Test sequentially first** - Get one flow working before parallelizing
6. **Use percentages** - Makes tests work across device resolutions
7. **Log decisions** - Keep track of what Claude decided to do
8. **Take frequent screenshots** - Helps debug when things go wrong

## Common Pitfalls

- ❌ Not waiting long enough for UI animations
- ❌ Using hardcoded coordinates that don't work on different devices
- ❌ Trying to tap invisible or off-screen elements
- ❌ Not handling "app crashed" or "permission" dialogs
- ❌ Assuming elements are always in the same location
- ✅ Use percentage-based taps
- ✅ Use vision to verify element presence
- ✅ Add defensive waits and checks
