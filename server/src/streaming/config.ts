export { getQualityLabel, DEFAULT_CONFIG, type StreamConfig } from '@shared/config'

export function getResolutionForQuality(
  width: number,
  height: number,
  quality: 'low' | 'medium' | 'high',
): [number, number] {
  switch (quality) {
    case 'low':
      return [Math.round(width * 0.5), Math.round(height * 0.5)]
    case 'medium':
      return [Math.round(width * 0.75), Math.round(height * 0.75)]
    case 'high':
      return [width, height]
  }
}
