// Chart configuration constants for weight trend visualization
export const CHART_COLORS = {
  primary: '#8884d8',
  target: '#ef4444',
  average: '#6b7280',
} as const

export const PERIOD_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last year' },
] as const

export const CHART_MARGIN = { 
  top: 10, 
  right: 10, 
  left: 0, 
  bottom: 0 
}

export const GRADIENT_CONFIG = {
  id: 'colorWeight',
  startOpacity: 0.3,
  endOpacity: 0,
  startOffset: '5%',
  endOffset: '95%',
}

export const LINE_CONFIG = {
  strokeWidth: 2,
  dotRadius: 3,
  activeDotRadius: 5,
}

export const REFERENCE_LINE_CONFIG = {
  target: {
    strokeDasharray: '5 5',
    label: 'Target',
  },
  average: {
    strokeDasharray: '3 3', 
    label: 'Avg',
  },
}