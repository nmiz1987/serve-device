// Coordinate translation utilities
export function scaleCoordinates(
  x: number,
  y: number,
  fromWidth: number,
  fromHeight: number,
  toWidth: number,
  toHeight: number,
): [number, number] {
  const scaledX = Math.round((x / fromWidth) * toWidth)
  const scaledY = Math.round((y / fromHeight) * toHeight)
  return [scaledX, scaledY]
}

// Clamp coordinate to device bounds
export function clampCoordinates(
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
): [number, number] {
  return [Math.max(0, Math.min(x, maxWidth)), Math.max(0, Math.min(y, maxHeight))]
}

// Parse ADB output
export function parseAdbDevices(output: string): Array<{ id: string; state: string }> {
  const lines = output.split('\n').slice(1) // Skip header
  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const [id, state] = line.split(/\s+/)
      return { id, state }
    })
}
