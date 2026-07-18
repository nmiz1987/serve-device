import { useState, useEffect } from 'react'
import type { StreamConfig } from '@shared/index'
import { getQualityLabel } from '@shared/config'

interface StreamQualityProps {
  deviceId: string
  onConfigChange?: (config: StreamConfig) => void
}

export default function StreamQuality({
  deviceId,
  onConfigChange,
}: StreamQualityProps) {
  const [config, setConfig] = useState<StreamConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [deviceId])

  async function fetchConfig() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/devices/${deviceId}/streaming/config`,
      )
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch config:', err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function updateConfig(updates: Partial<StreamConfig>) {
    try {
      const response = await fetch(
        `/api/devices/${deviceId}/streaming/config`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        },
      )

      if (response.ok) {
        const newConfig = { ...config, ...updates } as StreamConfig
        setConfig(newConfig)
        onConfigChange?.(newConfig)
        setError(null)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update settings')
      }
    } catch (err) {
      console.error('Failed to update config:', err)
      setError('Failed to update settings')
    }
  }

  if (loading) {
    return <div className="stream-quality">Loading settings...</div>
  }

  if (!config) {
    return null
  }

  return (
    <div className="stream-quality">
      <h3>Stream Quality</h3>

      <div className="quality-group">
        <label htmlFor="quality">Quality Level</label>
        <select
          id="quality"
          value={config.qualityLevel}
          onChange={(e) =>
            updateConfig({
              qualityLevel: e.target.value as 'low' | 'medium' | 'high',
            })
          }
        >
          <option value="high">{getQualityLabel('high')}</option>
          <option value="medium">{getQualityLabel('medium')}</option>
          <option value="low">{getQualityLabel('low')}</option>
        </select>
      </div>

      <div className="quality-group">
        <label htmlFor="fps">Frame Rate (FPS)</label>
        <div className="fps-input">
          <input
            id="fps"
            type="range"
            min="1"
            max="60"
            value={config.targetFps}
            onChange={(e) =>
              updateConfig({ targetFps: parseInt(e.target.value) })
            }
          />
          <span className="fps-value">{config.targetFps}</span>
        </div>
      </div>

      {error && <div className="quality-error">{error}</div>}
    </div>
  )
}
