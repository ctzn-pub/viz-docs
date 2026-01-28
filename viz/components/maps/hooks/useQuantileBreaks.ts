/**
 * Calculate evenly-spaced breaks for choropleth visualization
 */
export function calculateBreaks(values: number[]): {
  breaks: number[]
  min: number
  max: number
} | null {
  if (values.length === 0) {
    return null
  }

  const sortedValues = [...values].sort((a, b) => a - b)
  const min = sortedValues[0]
  const max = sortedValues[sortedValues.length - 1]

  // If all values are the same, return empty breaks
  if (min === max) {
    return { breaks: [], min, max }
  }

  // Create evenly spaced breaks (5 classes)
  const range = max - min
  const step = range / 5

  let breaks = [
    min + step,
    min + step * 2,
    min + step * 3,
    min + step * 4,
  ]

  // Round breaks to avoid floating point precision issues
  breaks = breaks.map((b) => Number.parseFloat(b.toFixed(6)))

  // Ensure breaks are unique and ascending
  const uniqueBreaks: number[] = []
  let lastBreak = min
  for (const b of breaks) {
    if (b > lastBreak) {
      uniqueBreaks.push(b)
      lastBreak = b
    }
  }

  // If we don't have enough unique breaks, create artificial ones
  if (uniqueBreaks.length < 4) {
    uniqueBreaks.length = 0
    const artificialStep = range / 5
    for (let i = 1; i < 5; i++) {
      uniqueBreaks.push(min + artificialStep * i)
    }
  }

  return { breaks: uniqueBreaks, min, max }
}

/**
 * Extract numeric values from features for a given property
 */
export function extractMetricValues(
  features: Array<{ properties: Record<string, unknown> }>,
  metricId: string
): number[] {
  return features
    .map((f) => Number.parseFloat(String(f.properties[metricId])))
    .filter((v) => !isNaN(v) && v !== undefined && v !== null)
}
