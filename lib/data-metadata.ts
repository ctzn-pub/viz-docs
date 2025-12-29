/**
 * Data Registry
 * Centralizes all data file metadata including schemas, sources, and usage
 */

export interface DataFieldSchema {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object' | 'array';
  description?: string;
  required?: boolean;
}

export interface DataMetadata {
  id: string;                    // Filename
  path: string;                  // Full URL to data
  type: 'json' | 'csv';
  description: string;
  source: string;                // Original data source (CDC, GSS, FRED, etc.)
  schema: {
    format: 'array' | 'object' | 'nested';
    fields: DataFieldSchema[];
  };
  usedBy: string[];             // Component paths that use this data
  notes?: string;
}

const SAMPLE_DATA_BASE = 'https://ontopic-public-data.t3.storage.dev/sample-data';

export const DATA_REGISTRY: Record<string, DataMetadata> = {
  // =======================
  // TIME SERIES DATA
  // =======================

  'housing.json': {
    id: 'housing.json',
    path: `${SAMPLE_DATA_BASE}/housing.json`,
    type: 'json',
    description: 'Housing market time series data with multiple indicators',
    source: 'U.S. Federal Reserve Economic Data (FRED)',
    schema: {
      format: 'object',
      fields: [
        { name: 'category', type: 'string', description: 'Data category' },
        { name: 'series', type: 'array', description: 'Array of time series' },
        { name: 'series[].id', type: 'string', description: 'Series identifier' },
        { name: 'series[].title', type: 'string', description: 'Series title' },
        { name: 'series[].observations', type: 'array', description: 'Time series observations' },
        { name: 'observations[].date', type: 'date', description: 'Observation date' },
        { name: 'observations[].value', type: 'string', description: 'Observation value' }
      ]
    },
    usedBy: ['recharts/generic/timeseries-basic-v1', 'recharts/generic/timeseries-dual-axis-v1', 'recharts/generic/timeseries-index-v1'],
    notes: 'Multiple housing market indicators with monthly observations'
  },

  'zillowmultiline.json': {
    id: 'zillowmultiline.json',
    path: `${SAMPLE_DATA_BASE}/zillowmultiline.json`,
    type: 'json',
    description: 'Multi-state housing price trends from Zillow',
    source: 'Zillow Housing Data',
    schema: {
      format: 'object',
      fields: [
        { name: 'category', type: 'string', description: 'Data category' },
        { name: 'series', type: 'array', description: 'State-level time series' },
        { name: 'series[].name', type: 'string', description: 'State name' },
        { name: 'series[].observations', type: 'array', description: 'Monthly observations' }
      ]
    },
    usedBy: ['plot/timeseries/multiline-v1'],
    notes: 'Multi-line comparison of housing trends across states'
  },

  'timetrend-demo-data.json': {
    id: 'timetrend-demo-data.json',
    path: `${SAMPLE_DATA_BASE}/timetrend-demo-data.json`,
    type: 'json',
    description: 'GSS political party affiliation trends over time',
    source: 'General Social Survey (GSS)',
    schema: {
      format: 'object',
      fields: [
        { name: 'metadata', type: 'object', description: 'Survey metadata' },
        { name: 'dataPoints', type: 'array', description: 'Time series data points' },
        { name: 'dataPoints[].year', type: 'number', description: 'Survey year' },
        { name: 'dataPoints[].value', type: 'number', description: 'Percentage value' },
        { name: 'dataPointMetadata', type: 'array', description: 'Demographic categories' }
      ]
    },
    usedBy: ['recharts/gss/timetrend-demo-v1', 'plot/gss/timetrend-demo-v1'],
    notes: 'Grouped time trend with demographic breakdowns'
  },

  // =======================
  // HEALTH DATA
  // =======================

  'health-obesity-diabetes.json': {
    id: 'health-obesity-diabetes.json',
    path: `${SAMPLE_DATA_BASE}/health-obesity-diabetes.json`,
    type: 'json',
    description: 'County-level obesity and diabetes prevalence with demographic groupings',
    source: 'CDC PLACES',
    schema: {
      format: 'array',
      fields: [
        { name: 'OBESITY_AdjPrev', type: 'number', description: 'Obesity prevalence (%)' },
        { name: 'DIABETES_AdjPrev', type: 'number', description: 'Diabetes prevalence (%)' },
        { name: 'population', type: 'number', description: 'County population' },
        { name: 'dir2020', type: 'string', description: 'Demographic grouping' }
      ]
    },
    usedBy: ['plot/health/health-scatter-basic-v1', 'plot/health/health-scatter-regression-v1', 'plot/health/health-scatter-faceted-v1', 'plot/stats/density-overlay-v1'],
    notes: 'Bivariate health data for scatterplots and density plots'
  },

  'obesity.json': {
    id: 'obesity.json',
    path: `${SAMPLE_DATA_BASE}/obesity.json`,
    type: 'json',
    description: 'Obesity rates by demographic breakdown categories',
    source: 'CDC BRFSS',
    schema: {
      format: 'object',
      fields: [
        { name: 'demographics', type: 'array', description: 'Demographic data points' },
        { name: 'demographics[].break_out_category', type: 'string', description: 'Category (Age, Education, etc.)' },
        { name: 'demographics[].break_out', type: 'string', description: 'Specific group' },
        { name: 'demographics[].value', type: 'number', description: 'Obesity rate' },
        { name: 'demographics[].confidence_limit_low', type: 'number', description: 'Lower CI' },
        { name: 'demographics[].confidence_limit_high', type: 'number', description: 'Upper CI' }
      ]
    },
    usedBy: ['recharts/generic/demographic-breakdown-v1'],
    notes: 'Demographic breakdown with confidence intervals'
  },

  // =======================
  // STATE-LEVEL DATA
  // =======================

  'state-visualization-data.json': {
    id: 'state-visualization-data.json',
    path: `${SAMPLE_DATA_BASE}/state-visualization-data.json`,
    type: 'json',
    description: 'State-level health indicator data with demographic breakdowns',
    source: 'CDC BRFSS',
    schema: {
      format: 'nested',
      fields: [
        { name: 'data', type: 'array', description: 'State data records' },
        { name: 'data[].locationabbr', type: 'string', description: 'State abbreviation' },
        { name: 'data[].locationdesc', type: 'string', description: 'State name' },
        { name: 'data[].data_value', type: 'number', description: 'Indicator value' },
        { name: 'data[].break_out', type: 'string', description: 'Demographic group' }
      ]
    },
    usedBy: ['recharts/brfss/state-bar-sortable-v1'],
    notes: 'Sortable state bar chart data'
  },

  // =======================
  // GEOGRAPHIC DATA
  // =======================

  'county_sample.json': {
    id: 'county_sample.json',
    path: `${SAMPLE_DATA_BASE}/county_sample.json`,
    type: 'json',
    description: 'Sample county-level health and geographic data',
    source: 'CDC PLACES',
    schema: {
      format: 'array',
      fields: [
        { name: 'fips', type: 'string', description: 'County FIPS code' },
        { name: 'county', type: 'string', description: 'County name' },
        { name: 'state', type: 'string', description: 'State name' },
        { name: 'MHLTH_AdjPrev', type: 'number', description: 'Mental health prevalence' },
        { name: 'lat', type: 'number', description: 'Latitude' },
        { name: 'lon', type: 'number', description: 'Longitude' }
      ]
    },
    usedBy: ['plot/geo/choropleth-v1', 'plot/geo/bubble-map-v1', 'plot/geo/state-map-v1', 'plot/stats/density-basic-v1'],
    notes: 'Sample subset for geographic visualizations'
  },

  // =======================
  // STATISTICAL DATA
  // =======================

  'odds-ratio-data.json': {
    id: 'odds-ratio-data.json',
    path: `${SAMPLE_DATA_BASE}/odds-ratio-data.json`,
    type: 'json',
    description: 'Odds ratios with confidence intervals for statistical visualization',
    source: 'General Social Survey (GSS) Regression Analysis',
    schema: {
      format: 'object',
      fields: [
        { name: 'odds_ratios', type: 'object', description: 'Variable to odds ratio mapping' },
        { name: 'conf_int_lower', type: 'object', description: 'Lower CI bounds' },
        { name: 'conf_int_upper', type: 'object', description: 'Upper CI bounds' }
      ]
    },
    usedBy: ['plot/stats/odds-ratio-basic-v1', 'plot/stats/odds-ratio-forest-v1', 'plot/stats/odds-ratio-dotplot-v1'],
    notes: 'Forest plot / dot plot data with statistical significance indicators'
  },

  'correlation-data.json': {
    id: 'correlation-data.json',
    path: `${SAMPLE_DATA_BASE}/correlation-data.json`,
    type: 'json',
    description: 'Correlation matrix for health outcome variables',
    source: 'CDC PLACES',
    schema: {
      format: 'array',
      fields: [
        { name: 'x', type: 'string', description: 'Variable name (x-axis)', required: true },
        { name: 'y', type: 'string', description: 'Variable name (y-axis)', required: true },
        { name: 'value', type: 'number', description: 'Correlation coefficient (-1 to 1)', required: true }
      ]
    },
    usedBy: ['plot/stats/correlation-heatmap-v1'],
    notes: 'Lower-triangle correlation matrix with health variables'
  },

  // =======================
  // SURVEY DATA
  // =======================

  'ess_country_data.csv': {
    id: 'ess_country_data.csv',
    path: `${SAMPLE_DATA_BASE}/ess_country_data.csv`,
    type: 'csv',
    description: 'European Social Survey country-level aggregated data',
    source: 'European Social Survey (ESS)',
    schema: {
      format: 'array',
      fields: [
        { name: 'cntry', type: 'string', description: 'Country name' },
        { name: 'religion', type: 'string', description: 'Dominant religion' },
        { name: 'population', type: 'number', description: 'Population (millions)' },
        { name: 'hdi', type: 'number', description: 'Human Development Index' },
        { name: 'gdp', type: 'number', description: 'GDP per capita (PPP)' },
        { name: 'education', type: 'number', description: 'Mean years of schooling' }
      ]
    },
    usedBy: ['recharts/ess/scatter-regression-v1'],
    notes: 'Country-level data for scatter regression analysis'
  },

  // =======================
  // EXTERNAL CDC DATA
  // =======================

  'DRNKANY5_us_median.json': {
    id: 'DRNKANY5_us_median.json',
    path: 'https://ontopic-public-data.t3.storage.dev/cdc-data/brfss_state/examples/DRNKANY5_us_median.json',
    type: 'json',
    description: 'National median alcohol consumption with demographic breakdowns',
    source: 'CDC BRFSS',
    schema: {
      format: 'object',
      fields: [
        { name: 'clean_title', type: 'string', description: 'Display title' },
        { name: 'overall', type: 'object', description: 'Overall statistics' },
        { name: 'by_demographic', type: 'object', description: 'Demographic category breakdowns' }
      ]
    },
    usedBy: ['plot/stats/demographic-panel-v1'],
    notes: 'Multi-panel demographic visualization data'
  },

  'DRNKANY5_income.json': {
    id: 'DRNKANY5_income.json',
    path: 'https://ontopic-public-data.t3.storage.dev/cdc-data/brfss_state/examples/DRNKANY5_income.json',
    type: 'json',
    description: 'Alcohol consumption by income level',
    source: 'CDC BRFSS',
    schema: {
      format: 'object',
      fields: [
        { name: 'data', type: 'array', description: 'Income group data' },
        { name: 'data[].income_level', type: 'string', description: 'Income bracket' },
        { name: 'data[].value', type: 'number', description: 'Percentage' }
      ]
    },
    usedBy: ['plot/stats/split-bar-v1'],
    notes: 'Split bar chart demographic comparison'
  },

  'DRNKANY5_state_map.json': {
    id: 'DRNKANY5_state_map.json',
    path: 'https://ontopic-public-data.t3.storage.dev/cdc-data/brfss_state/examples/DRNKANY5_state_map.json',
    type: 'json',
    description: 'State-level alcohol consumption for bar chart visualization',
    source: 'CDC BRFSS',
    schema: {
      format: 'object',
      fields: [
        { name: 'data', type: 'array', description: 'State data records' },
        { name: 'data[].state', type: 'string', description: 'State name' },
        { name: 'data[].value', type: 'number', description: 'Indicator value' }
      ]
    },
    usedBy: ['plot/brfss/state-bar-v1'],
    notes: 'Observable Plot state bar chart data'
  }
};

/**
 * Get metadata for a data file by ID
 */
export function getDataMetadata(dataId: string): DataMetadata | undefined {
  return DATA_REGISTRY[dataId];
}

/**
 * Get all data files
 */
export function getAllDataFiles(): DataMetadata[] {
  return Object.values(DATA_REGISTRY);
}

/**
 * Get data files by source
 */
export function getDataBySource(source: string): DataMetadata[] {
  return getAllDataFiles().filter(d =>
    d.source.toLowerCase().includes(source.toLowerCase())
  );
}

/**
 * Get all unique data sources
 */
export function getAllDataSources(): string[] {
  const sources = new Set<string>();
  getAllDataFiles().forEach(data => sources.add(data.source));
  return Array.from(sources).sort();
}

/**
 * Search data files by description or id
 */
export function searchDataFiles(query: string): DataMetadata[] {
  const lowerQuery = query.toLowerCase();
  return getAllDataFiles().filter(d =>
    d.id.toLowerCase().includes(lowerQuery) ||
    d.description.toLowerCase().includes(lowerQuery) ||
    d.source.toLowerCase().includes(lowerQuery)
  );
}
