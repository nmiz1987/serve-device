import type { Device } from '../../../shared/types'

interface DeviceSelectorProps {
  devices: Device[]
  selectedDevice: string | null
  onSelect: (deviceId: string) => void
  loading: boolean
}

export default function DeviceSelector({
  devices,
  selectedDevice,
  onSelect,
  loading,
}: DeviceSelectorProps) {
  if (loading) {
    return <div className="device-selector loading">Loading...</div>
  }

  return (
    <div className="device-selector">
      <h3>Devices</h3>
      {devices.length === 0 ? (
        <p className="empty">No devices connected</p>
      ) : (
        <div className="device-list">
          {devices.map((device) => (
            <button
              key={device.id}
              className={`device-item ${selectedDevice === device.id ? 'active' : ''} ${device.state}`}
              onClick={() => onSelect(device.id)}
            >
              <div className="device-info">
                <strong>{device.model}</strong>
                <span className="device-id">{device.id}</span>
                <span className="device-state">{device.state}</span>
              </div>
              {device.resolution && (
                <div className="device-res">
                  {device.resolution.width}x{device.resolution.height}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
