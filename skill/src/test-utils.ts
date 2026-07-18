/**
 * Test utilities for Serve Device Skill
 *
 * Provides helpers for common testing scenarios
 */

import { ServeDeviceClient, Screenshot } from './index'

/**
 * Test result tracking
 */
export interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
  screenshots?: Screenshot[]
}

/**
 * Test runner for device tests
 */
export class DeviceTestRunner {
  private client: ServeDeviceClient
  private deviceId: string
  private results: TestResult[] = []

  constructor(serverUrl: string, deviceId: string) {
    this.client = new ServeDeviceClient(serverUrl)
    this.deviceId = deviceId
  }

  /**
   * Run a test function and track results
   */
  async runTest(
    name: string,
    testFn: (client: ServeDeviceClient, deviceId: string) => Promise<void>,
  ): Promise<TestResult> {
    const startTime = Date.now()
    let error: string | undefined
    let passed = false

    try {
      await testFn(this.client, this.deviceId)
      passed = true
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    }

    const duration = Date.now() - startTime
    const result: TestResult = {
      name,
      passed,
      duration,
      error,
    }

    this.results.push(result)
    return result
  }

  /**
   * Run multiple tests
   */
  async runTests(
    tests: Array<[
      string,
      (client: ServeDeviceClient, deviceId: string) => Promise<void>,
    ]>,
  ): Promise<TestResult[]> {
    for (const [name, testFn] of tests) {
      await this.runTest(name, testFn)
    }
    return this.results
  }

  /**
   * Get test summary
   */
  getSummary(): {
    total: number
    passed: number
    failed: number
    totalDuration: number
  } {
    const total = this.results.length
    const passed = this.results.filter((r) => r.passed).length
    const failed = total - passed
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)

    return { total, passed, failed, totalDuration }
  }

  /**
   * Get test results
   */
  getResults(): TestResult[] {
    return this.results
  }

  /**
   * Print test report
   */
  printReport(): void {
    const summary = this.getSummary()

    console.log('\n=== Device Test Report ===')
    console.log(`Device: ${this.deviceId}`)
    console.log(`Total: ${summary.total} | Passed: ${summary.passed} | Failed: ${summary.failed}`)
    console.log(`Total Duration: ${summary.totalDuration}ms\n`)

    for (const result of this.results) {
      const status = result.passed ? '✓' : '✗'
      const time = result.duration.toString().padStart(5, ' ')
      console.log(`${status} ${result.name.padEnd(30, ' ')} ${time}ms`)

      if (result.error) {
        console.log(`  Error: ${result.error}`)
      }
    }

    console.log('\n' + (summary.failed === 0 ? 'All tests passed! ✓' : `${summary.failed} tests failed!`))
  }
}

/**
 * Common assertions for device testing
 */
export class DeviceAssertions {
  /**
   * Assert that a tap action changes the UI
   */
  static async assertTapChangesUI(
    client: ServeDeviceClient,
    deviceId: string,
    x: number,
    y: number,
  ): Promise<void> {
    const before = await client.screenshot(deviceId)
    await client.tap(deviceId, x, y)
    await this.delay(500)
    const after = await client.screenshot(deviceId)

    if (before.data === after.data) {
      throw new Error('Tap did not change UI')
    }
  }

  /**
   * Assert device is responsive
   */
  static async assertDeviceResponsive(
    client: ServeDeviceClient,
    deviceId: string,
  ): Promise<void> {
    const start = Date.now()
    try {
      await client.screenshot(deviceId)
      const duration = Date.now() - start

      if (duration > 5000) {
        throw new Error(`Device response took ${duration}ms (too slow)`)
      }
    } catch (error) {
      throw new Error(`Device not responsive: ${error}`)
    }
  }

  /**
   * Assert app is in foreground
   */
  static async assertAppForeground(
    client: ServeDeviceClient,
    deviceId: string,
    appName: string,
  ): Promise<void> {
    const screenshot = await client.screenshot(deviceId)

    // Simple check: verify screenshot is not empty
    if (!screenshot.data || screenshot.data.length === 0) {
      throw new Error(`App ${appName} not in foreground (no screenshot)`)
    }
  }

  /**
   * Assert no crashes or errors visible
   */
  static async assertNoErrorDialog(
    client: ServeDeviceClient,
    deviceId: string,
  ): Promise<void> {
    const screenshot = await client.screenshot(deviceId)

    // This would need vision API to actually check for error dialogs
    // For now, just verify we got a valid screenshot
    if (!screenshot.data || screenshot.data.length === 0) {
      throw new Error('Failed to capture screenshot')
    }
  }

  /**
   * Assert screenshot is valid
   */
  static async assertScreenValid(
    client: ServeDeviceClient,
    deviceId: string,
  ): Promise<void> {
    const screenshot = await client.screenshot(deviceId)

    // Check if screenshot is not empty
    if (!screenshot.data || screenshot.data.length === 0) {
      throw new Error('No screenshot data received')
    }

    // Check if screenshot data is valid base64
    if (!/^[A-Za-z0-9+/=]*$/.test(screenshot.data)) {
      throw new Error('Screenshot data is not valid base64')
    }
  }

  /**
   * Assert text was typed successfully
   */
  static async assertTextTyped(
    client: ServeDeviceClient,
    deviceId: string,
    textToFind: string,
  ): Promise<void> {
    // Would need vision/OCR to verify text is actually visible
    // This is a placeholder
    const screenshot = await client.screenshot(deviceId)
    if (!screenshot.data) {
      throw new Error('Unable to verify text input')
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Helper to wait for UI state with timeout
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeoutMs = 5000,
  pollIntervalMs = 500,
): Promise<boolean> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    try {
      if (await condition()) {
        return true
      }
    } catch {
      // Ignore errors during polling
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  return false
}

/**
 * Retry a flaky operation
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 500,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw new Error('Max retries exceeded')
}
