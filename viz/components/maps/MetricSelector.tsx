"use client"

import { type MetricConfig } from "./config/metrics"

interface MetricSelectorProps {
  metrics: Record<string, MetricConfig>
  selectedMetric: string
  onMetricChange: (metricId: string) => void
  disabled?: boolean
}

export function MetricSelector({
  metrics,
  selectedMetric,
  onMetricChange,
  disabled = false,
}: MetricSelectorProps) {
  const metricList = Object.values(metrics)

  return (
    <div className="absolute top-24 left-4 bg-black/70 rounded-md p-2 text-white z-10">
      <label htmlFor="metric-select" className="text-xs block mb-1">
        Select Metric:
      </label>
      <select
        id="metric-select"
        className="bg-gray-800 text-white text-sm p-1 rounded w-full disabled:opacity-50"
        value={selectedMetric}
        onChange={(e) => onMetricChange(e.target.value)}
        disabled={disabled}
      >
        {metricList.map((metric) => (
          <option key={metric.id} value={metric.id}>
            {metric.title}
          </option>
        ))}
      </select>
    </div>
  )
}
