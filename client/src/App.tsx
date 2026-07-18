import { useEffect, useState } from 'react'
import type { Device } from '../../../shared/types'
import DeviceSelector from './components/DeviceSelector'
import StreamViewer from './components/StreamViewer'
import Controls from './components/Controls'

function App() {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDevices()
    const interval = setInterval(fetchDevices, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchDevices() {
    try {
      const response = await fetch('/api/devices')
      if (!response.ok) throw new Error('Failed to fetch devices')
      const data = await response.json()
      setDevices(data.devices)
      setError(null)

      // Auto-select first device if none selected
      if (!selectedDevice && data.devices.length > 0) {
        setSelectedDevice(data.devices[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎮 Serve Device</h1>
        <p>Android Device Control & Streaming</p>
      </header>

      <main className="main">
        <div className="sidebar">
          <DeviceSelector
            devices={devices}
            selectedDevice={selectedDevice}
            onSelect={setSelectedDevice}
            loading={loading}
          />
          {selectedDevice && <Controls deviceId={selectedDevice} />}
        </div>

        <div className="content">
          {error && <div className="error">{error}</div>}
          {loading && <div className="loading">Loading devices...</div>}
          {!loading && selectedDevice ? (
            <StreamViewer deviceId={selectedDevice} />
          ) : !loading && devices.length === 0 ? (
            <div className="empty-state">
              <p>No Android devices found</p>
              <p className="hint">Connect a device via USB or start an emulator</p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}

export default App
