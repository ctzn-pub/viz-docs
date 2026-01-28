"use client"

import { type MetricConfig, formatMetricValue } from "./config/metrics"

// Color palette for choropleth (YlGnBu)
export const CHOROPLETH_COLORS = ["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"]

interface LegendProps {
  metric: MetricConfig
  breaks: number[] | null
  min: number | null
  max: number | null
}

export function Legend({ metric, breaks, min, max }: LegendProps) {
  // No data state
  if (breaks === null || min === null || max === null) {
    return (
      <div className="absolute bottom-6 right-4 bg-black/70 rounded-md p-3 text-white z-10">
        <h4 className="text-sm font-bold mb-2 text-center">
          {metric.title} by Zip Code
        </h4>
        <div className="flex items-center">
          <span className="text-xs">No data available</span>
        </div>
      </div>
    )
  }

  // Single value state (all values are the same)
  if (breaks.length === 0) {
    return (
      <div className="absolute bottom-6 right-4 bg-black/70 rounded-md p-3 text-white z-10">
        <h4 className="text-sm font-bold mb-2 text-center">
          {metric.title} by Zip Code
        </h4>
        <div className="flex items-center">
          <div
            className="w-5 h-5 mr-2 border border-gray-700"
            style={{ backgroundColor: CHOROPLETH_COLORS[2] }}
          />
          <span className="text-xs">
            All areas: {formatMetricValue(min, metric.format)}
          </span>
        </div>
      </div>
    )
  }

  // Normal state with breaks
  const ranges = [
    { color: CHOROPLETH_COLORS[0], from: min, to: breaks[0] },
    { color: CHOROPLETH_COLORS[1], from: breaks[0], to: breaks[1] },
    { color: CHOROPLETH_COLORS[2], from: breaks[1], to: breaks[2] },
    { color: CHOROPLETH_COLORS[3], from: breaks[2], to: breaks[3] },
    { color: CHOROPLETH_COLORS[4], from: breaks[3], to: max },
  ]

  return (
    <div className="absolute bottom-6 right-4 bg-black/70 rounded-md p-3 text-white z-10">
      <h4 className="text-sm font-bold mb-2 text-center">
        {metric.title} by Zip Code
      </h4>
      {ranges.map((range, index) => (
        <div key={index} className="flex items-center mb-1 last:mb-0">
          <div
            className="w-5 h-5 mr-2 border border-gray-700"
            style={{ backgroundColor: range.color }}
          />
          <span className="text-xs">
            {formatMetricValue(range.from, metric.format)} -{" "}
            {formatMetricValue(range.to, metric.format)}
          </span>
        </div>
      ))}
    </div>
  )
}
