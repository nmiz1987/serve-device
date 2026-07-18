import { useCallback, useRef } from 'react'

const API_BASE = '/api'

export function useInputControl(deviceId: string) {
  const commandQueueRef = useRef<Promise<void>>(Promise.resolve())

  const executeCommand = useCallback(
    async (endpoint: string, body: any) => {
      commandQueueRef.current = commandQueueRef.current.then(async () => {
        try {
          const response = await fetch(`${API_BASE}/devices/${deviceId}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

          if (!response.ok) {
            const error = await response.json()
            console.error(`Command failed: ${error.error}`)
          }
        } catch (error) {
          console.error('Network error:', error)
        }
      })
    },
    [deviceId],
  )

  const tap = useCallback(
    (x: number, y: number) => {
      executeCommand('/input/tap', { x, y })
    },
    [executeCommand],
  )

  const swipe = useCallback(
    (x1: number, y1: number, x2: number, y2: number, duration = 300) => {
      executeCommand('/input/swipe', { x1, y1, x2, y2, duration })
    },
    [executeCommand],
  )

  const type = useCallback(
    (text: string) => {
      executeCommand('/input/type', { text })
    },
    [executeCommand],
  )

  const key = useCallback(
    (keyCode: string) => {
      executeCommand('/input/key', { keyCode })
    },
    [executeCommand],
  )

  return { tap, swipe, type, key }
}
