import { healthMetrics, demographicMetrics, type MetricConfig } from "./metrics"
import { regions, type RegionConfig } from "./regions"

export interface DatasetConfig {
  id: string
  name: string
  description: string
  pmtilesUrl: string
  sourceLayer: string
  metrics: Record<string, MetricConfig>
  availableRegions: string[]
  defaultMetric: string
  defaultRegion: string
}

export const datasets: Record<string, DatasetConfig> = {
  health: {
    id: "health",
    name: "Health Data",
    description: "CDC health metrics by zip code",
    pmtilesUrl: "https://temp-data-mapping.fly.storage.tigris.dev/processed/Health_Zip_converted.pmtiles",
    sourceLayer: "zipcode_demographics",
    metrics: healthMetrics,
    availableRegions: ["nyc", "la"],
    defaultMetric: "DIABETES_zip",
    defaultRegion: "nyc",
  },
  demographics: {
    id: "demographics",
    name: "Demographics",
    description: "US Census demographic data by zip code",
    pmtilesUrl: "https://temp-data-mapping.fly.storage.tigris.dev/processed/demographics.pmtiles",
    sourceLayer: "zipcode_demographics",
    metrics: demographicMetrics,
    availableRegions: ["usa", "nyc", "la"],
    defaultMetric: "median_income",
    defaultRegion: "usa",
  },
}

export function getDataset(datasetId: string): DatasetConfig | undefined {
  return datasets[datasetId]
}

export function getDatasetMetrics(datasetId: string): Record<string, MetricConfig> {
  return datasets[datasetId]?.metrics ?? {}
}

export function getDatasetRegions(datasetId: string): RegionConfig[] {
  const dataset = datasets[datasetId]
  if (!dataset) return []
  return dataset.availableRegions
    .map((regionId) => regions[regionId])
    .filter((r): r is RegionConfig => r !== undefined)
}

export const datasetList = Object.values(datasets)
