// Components
export { MapViewer } from "./MapViewer"
export { Legend, CHOROPLETH_COLORS } from "./Legend"
export { MetricSelector } from "./MetricSelector"
export { RegionSelector } from "./RegionSelector"
export { DatasetSelector } from "./DatasetSelector"

// Config
export {
  datasets,
  datasetList,
  getDataset,
  getDatasetMetrics,
  getDatasetRegions,
  type DatasetConfig,
} from "./config/datasets"

export {
  healthMetrics,
  demographicMetrics,
  formatMetricValue,
  type MetricConfig,
  type MetricFormat,
} from "./config/metrics"

export {
  regions,
  regionList,
  getRegion,
  getDefaultRegion,
  type RegionConfig,
} from "./config/regions"

// Hooks
export { calculateBreaks, extractMetricValues } from "./hooks/useQuantileBreaks"
