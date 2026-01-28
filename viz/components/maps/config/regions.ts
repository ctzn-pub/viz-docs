export interface RegionConfig {
  id: string
  name: string
  center: [number, number] // [lng, lat]
  initialZoom: number
  minZoom: number
  maxZoom: number
}

export const regions: Record<string, RegionConfig> = {
  nyc: {
    id: "nyc",
    name: "New York City",
    center: [-74.006, 40.7128],
    initialZoom: 10,
    minZoom: 9,
    maxZoom: 16,
  },
  la: {
    id: "la",
    name: "Los Angeles",
    center: [-118.243, 34.052],
    initialZoom: 10,
    minZoom: 9,
    maxZoom: 16,
  },
  usa: {
    id: "usa",
    name: "United States",
    center: [-98.5795, 39.8283],
    initialZoom: 4,
    minZoom: 3,
    maxZoom: 16,
  },
}

export function getRegion(regionId: string): RegionConfig | undefined {
  return regions[regionId]
}

export function getDefaultRegion(): RegionConfig {
  return regions.nyc
}

export const regionList = Object.values(regions)
