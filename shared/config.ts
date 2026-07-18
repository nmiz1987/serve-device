export interface StreamConfig {
  targetFps: number
  qualityLevel: 'low' | 'medium' | 'high'
  scaleResolution: boolean
  maxWidth?: number
  maxHeight?: number
}

export const DEFAULT_CONFIG: StreamConfig = {
  targetFps: 30,
  qualityLevel: 'high',
  scaleResolution: false,
}

export function getQualityLabel(quality: 'low' | 'medium' | 'high'): string {
  switch (quality) {
    case 'low':
      return 'Low (50%)'
    case 'medium':
      return 'Medium (75%)'
    case 'high':
      return 'High (100%)'
  }
}
