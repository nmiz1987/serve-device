import { useInputControl } from '../hooks/useInputControl'

interface ControlsProps {
  deviceId: string
}

const keyCodeMap: { [key: string]: string } = {
  Back: 'KEYCODE_BACK',
  Home: 'KEYCODE_HOME',
  Recent: 'KEYCODE_APP_SWITCH',
  Power: 'KEYCODE_POWER',
  Volume_Up: 'KEYCODE_VOLUME_UP',
  Volume_Down: 'KEYCODE_VOLUME_DOWN',
}

export default function Controls({ deviceId }: ControlsProps) {
  const { key } = useInputControl(deviceId)

  return (
    <div className="controls">
      <h3>Controls</h3>
      <div className="control-buttons">
        {Object.entries(keyCodeMap).map(([label, keyCode]) => (
          <button
            key={keyCode}
            className="control-btn"
            onClick={() => key(keyCode)}
            title={keyCode}
          >
            {label.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  )
}
