"use client"

import { type DatasetConfig } from "./config/datasets"

interface DatasetSelectorProps {
  datasets: DatasetConfig[]
  selectedDataset: string
  onDatasetChange: (datasetId: string) => void
  disabled?: boolean
}

export function DatasetSelector({
  datasets,
  selectedDataset,
  onDatasetChange,
  disabled = false,
}: DatasetSelectorProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 rounded-md p-2 text-white z-10">
      <label htmlFor="dataset-select" className="text-xs block mb-1">
        Select Dataset:
      </label>
      <select
        id="dataset-select"
        className="bg-gray-800 text-white text-sm p-1 rounded w-full disabled:opacity-50"
        value={selectedDataset}
        onChange={(e) => onDatasetChange(e.target.value)}
        disabled={disabled}
      >
        {datasets.map((dataset) => (
          <option key={dataset.id} value={dataset.id}>
            {dataset.name}
          </option>
        ))}
      </select>
    </div>
  )
}
