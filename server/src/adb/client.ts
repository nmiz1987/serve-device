import { spawn } from 'child_process'

export class AdbClient {
  private deviceId: string

  constructor(deviceId: string) {
    this.deviceId = deviceId
  }

  async executeCommand(args: string[]): Promise<string> {
    const fullArgs = ['-s', this.deviceId, ...args]
    return this.runAdb(fullArgs)
  }

  private runAdb(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn('adb', args)
      let stdout = ''
      let stderr = ''

      process.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      process.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new Error(`ADB error: ${stderr || stdout}`))
        }
      })

      process.on('error', (err) => {
        reject(err)
      })
    })
  }

  async shell(command: string): Promise<string> {
    return this.executeCommand(['shell', command])
  }

  async screencap(path: string = '/sdcard/screen.png'): Promise<Buffer> {
    await this.shell(`screencap -p ${path}`)
    return this.pullFile(path)
  }

  async pullFile(remotePath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const args = ['-s', this.deviceId, 'pull', remotePath, '-']
      const process = spawn('adb', args, { stdio: ['ignore', 'pipe', 'pipe'] })
      const chunks: Buffer[] = []
      let hasData = false

      process.stdout?.on('data', (data: Buffer) => {
        chunks.push(data)
        hasData = true
      })

      process.stderr?.on('data', (data) => {
        // Ignore stderr for pull command (contains progress info)
      })

      process.on('close', (code) => {
        // adb pull might exit with non-zero even when successful (progress goes to stderr)
        // Check if we actually got data
        if (hasData || chunks.length > 0) {
          resolve(Buffer.concat(chunks))
        } else if (code === 0) {
          resolve(Buffer.concat(chunks))
        } else {
          reject(new Error(`Failed to pull file ${remotePath}`))
        }
      })

      process.on('error', (err) => {
        reject(err)
      })
    })
  }

  async tap(x: number, y: number): Promise<void> {
    await this.shell(`input tap ${x} ${y}`)
  }

  async swipe(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    duration: number = 300,
  ): Promise<void> {
    await this.shell(`input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`)
  }

  async type(text: string): Promise<void> {
    const escaped = text.replace(/[&|;<>()$`"']/g, '\\$&')
    await this.shell(`input text "${escaped}"`)
  }

  async keyevent(keyCode: string): Promise<void> {
    await this.shell(`input keyevent ${keyCode}`)
  }

  async getResolution(): Promise<{ width: number; height: number } | null> {
    try {
      const output = await this.shell('wm size')
      const match = output.match(/(\d+)x(\d+)/)
      if (match) {
        return { width: parseInt(match[1]), height: parseInt(match[2]) }
      }
    } catch {
      return null
    }
    return null
  }
}
