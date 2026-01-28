"use client"

import { type RegionConfig } from "./config/regions"

interface RegionSelectorProps {
  regions: RegionConfig[]
  selectedRegion: string
  onRegionChange: (regionId: string) => void
  disabled?: boolean
}

export function RegionSelector({
  regions,
  selectedRegion,
  onRegionChange,
  disabled = false,
}: RegionSelectorProps) {
  return (
    <div className="absolute top-4 left-4 bg-black/70 rounded-md p-2 text-white z-10">
      <label htmlFor="region-select" className="text-xs block mb-1">
        Select Region:
      </label>
      <select
        id="region-select"
        className="bg-gray-800 text-white text-sm p-1 rounded w-full disabled:opacity-50"
        value={selectedRegion}
        onChange={(e) => onRegionChange(e.target.value)}
        disabled={disabled}
      >
        {regions.map((region) => (
          <option key={region.id} value={region.id}>
            {region.name}
          </option>
        ))}
      </select>
    </div>
  )
}
