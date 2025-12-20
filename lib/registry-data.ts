export const SAMPLE_DATA_BASE = 'https://ontopic-public-data.t3.storage.dev/sample-data';
export const GITHUB_BASE = 'https://github.com/ctzn-pub/ontopic-viz-components/blob/main/registry/components';

export interface ComponentMeta {
  id: string;
  name: string;
  description: string;
  sampleData: string;
}

export interface CategoryMeta {
  title: string;
  description: string;
  components: ComponentMeta[];
}

export const REGISTRY: Record<string, CategoryMeta> = {
  'recharts/generic': {
    title: 'Generic Charts',
    description: 'Reusable chart components for any dataset',
    components: [
      {
        id: 'demographic-bar-v1',
        name: 'Demographic Bar Chart',
        description: 'Horizontal bar chart with confidence intervals for demographic comparisons',
        sampleData: 'brfss-demographic-data.json',
      },
      {
        id: 'demographic-dot-v1',
        name: 'Demographic Dot Plot',
        description: 'Dot plot for comparing values across demographic groups',
        sampleData: 'brfss-demographic-data.json',
      },
      {
        id: 'demographic-line-v1',
        name: 'Demographic Line Chart',
        description: 'Line chart for demographic trend comparisons',
        sampleData: 'brfss-demographic-data.json',
      },
      {
        id: 'histogram-v1',
        name: 'Histogram',
        description: 'Frequency distribution histogram',
        sampleData: 'county_sample.json',
      },
      {
        id: 'violin-v1',
        name: 'Violin Plot',
        description: 'Distribution visualization combining box plot and density',
        sampleData: 'county_sample.json',
      },
      {
        id: 'timeseries-basic-v1',
        name: 'Time Series (Basic)',
        description: 'Simple time series line chart',
        sampleData: 'housing.json',
      },
      {
        id: 'timeseries-dual-axis-v1',
        name: 'Dual Axis Chart',
        description: 'Time series with two Y-axes for different scales',
        sampleData: 'housing.json',
      },
      {
        id: 'timeseries-economic-v1',
        name: 'Economic Time Series',
        description: 'Time series optimized for economic indicators',
        sampleData: 'housing.json',
      },
      {
        id: 'timeseries-index-v1',
        name: 'Index Comparison',
        description: 'Normalized index comparison (rebased to 100)',
        sampleData: 'housing.json',
      },
      {
        id: 'timeseries-metadata-v1',
        name: 'Time Series with Metadata',
        description: 'Time series with rich metadata display',
        sampleData: 'housing.json',
      },
      {
        id: 'demographic-breakdown-v1',
        name: 'Demographic Breakdown',
        description: 'Switchable chart (scatter/line/bar) with confidence intervals for demographic data',
        sampleData: 'obesity.json',
      },
    ],
  },
  'recharts/brfss': {
    title: 'BRFSS (Health Surveillance)',
    description: 'Components for CDC BRFSS health survey data',
    components: [
      {
        id: 'state-bar-v1',
        name: 'State Bar Chart',
        description: 'Horizontal bar chart for state-level comparisons',
        sampleData: 'state-visualization-data.json',
      },
      {
        id: 'state-bar-sortable-v1',
        name: 'State Bar Chart (Sortable)',
        description: 'Interactive sortable state bar chart',
        sampleData: 'state-visualization-data.json',
      },
    ],
  },
  'recharts/gss': {
    title: 'GSS (General Social Survey)',
    description: 'Components for GSS polling and opinion data',
    components: [
      {
        id: 'timeseries-line-v1',
        name: 'Time Series Line',
        description: 'Multi-series line chart with error bars',
        sampleData: 'abany_timetrend_overall.json',
      },
      {
        id: 'abortion-opinion-v1',
        name: 'Abortion Opinion Chart',
        description: 'Specialized chart for abortion opinion trends',
        sampleData: 'abany_timetrend_overall.json',
      },
      {
        id: 'timetrend-demo-v1',
        name: 'Time Trend Demo',
        description: 'Multi-series time trend with presidential term backgrounds and confidence intervals',
        sampleData: 'timetrend-demo-data.json',
      },
    ],
  },
  'recharts/ess': {
    title: 'ESS (European Social Survey)',
    description: 'Components for European survey data',
    components: [
      {
        id: 'scatter-regression-v1',
        name: 'Scatter Plot with Regression',
        description: 'Scatter plot with OLS regression line',
        sampleData: 'ess_country_data.csv',
      },
    ],
  },
  'plot/gss': {
    title: 'GSS (Observable Plot)',
    description: 'General Social Survey visualizations using Observable Plot',
    components: [
      {
        id: 'timetrend-demo-v1',
        name: 'Time Trend Demo',
        description: 'Multi-series time trend with presidential term backgrounds and confidence intervals',
        sampleData: 'timetrend-demo-data.json',
      },
    ],
  },
  'plot/geo': {
    title: 'Geographic Maps',
    description: 'Map visualizations using Observable Plot',
    components: [
      {
        id: 'state-map-v1',
        name: 'US State Map',
        description: 'Choropleth map of US states',
        sampleData: 'state-visualization-data.json',
      },
      {
        id: 'bubble-map-v1',
        name: 'Bubble Map',
        description: 'Geographic bubble map',
        sampleData: 'county_sample.json',
      },
      {
        id: 'choropleth-v1',
        name: 'Choropleth Map',
        description: 'County-level choropleth map',
        sampleData: 'county_sample.json',
      },
    ],
  },
  'plot/health': {
    title: 'Health Visualizations',
    description: 'Health data analysis using Observable Plot',
    components: [
      {
        id: 'health-scatter-basic-v1',
        name: 'Health Scatterplot (Basic)',
        description: 'Basic scatter plot showing obesity vs diabetes correlation',
        sampleData: 'health-obesity-diabetes.json',
      },
      {
        id: 'health-scatter-regression-v1',
        name: 'Health Scatterplot (Regression)',
        description: 'Scatter plot with linear regression trend line',
        sampleData: 'health-obesity-diabetes.json',
      },
      {
        id: 'health-scatter-faceted-v1',
        name: 'Health Scatterplot (Faceted)',
        description: 'Faceted scatter plot by demographic category',
        sampleData: 'health-obesity-diabetes.json',
      },
    ],
  },
  'plot/brfss': {
    title: 'BRFSS (Observable Plot)',
    description: 'CDC BRFSS health survey visualizations using Observable Plot',
    components: [
      {
        id: 'state-bar-v1',
        name: 'State Bar Chart',
        description: 'Ordered horizontal bar chart for state-level health indicators',
        sampleData: 'https://ontopic-public-data.t3.storage.dev/cdc-data/brfss_state/examples/DRNKANY5_state_map.json',
      },
    ],
  },
  'plot/timeseries': {
    title: 'Time Series (Observable Plot)',
    description: 'Time series visualizations using Observable Plot',
    components: [
      {
        id: 'multiline-v1',
        name: 'Multi-Line Chart',
        description: 'Multi-series line chart for comparing trends across categories',
        sampleData: 'zillowmultiline.json',
      },
    ],
  },
  'plot/stats': {
    title: 'Statistical Visualizations',
    description: 'Statistical analysis charts using Observable Plot',
    components: [
      {
        id: 'odds-ratio-basic-v1',
        name: 'Odds Ratio (Basic)',
        description: 'Standard odds ratio visualization with confidence intervals',
        sampleData: 'odds-ratio-data.json',
      },
      {
        id: 'odds-ratio-forest-v1',
        name: 'Odds Ratio (Forest Plot)',
        description: 'Advanced forest plot with enhanced statistical features',
        sampleData: 'odds-ratio-data.json',
      },
      {
        id: 'odds-ratio-dotplot-v1',
        name: 'Odds Ratio (Precision-Weighted)',
        description: 'Dot plot where marker size reflects statistical precision',
        sampleData: 'odds-ratio-data.json',
      },
      {
        id: 'correlation-heatmap-v1',
        name: 'Correlation Heatmap',
        description: 'Lower-triangle correlation matrix with color coding',
        sampleData: 'correlation-data.json',
      },
      {
        id: 'density-overlay-v1',
        name: 'Density Overlay Plot',
        description: 'Overlaid density curves comparing distributions by group',
        sampleData: 'health-obesity-diabetes.json',
      },
      {
        id: 'density-basic-v1',
        name: 'Density Plot (Basic)',
        description: 'Single variable density distribution curve',
        sampleData: 'county_sample.json',
      },
      {
        id: 'demographic-panel-v1',
        name: 'Demographic Panel',
        description: 'Multi-panel bar charts showing demographic breakdowns',
        sampleData: 'https://ontopic-public-data.t3.storage.dev/cdc-data/brfss_state/examples/DRNKANY5_us_median.json',
      },
      {
        id: 'split-bar-v1',
        name: 'Split Bar Chart',
        description: 'Horizontal bars with contrasting subgroup dots for demographic comparison',
        sampleData: 'https://ontopic-public-data.t3.storage.dev/cdc-data/brfss_state/examples/DRNKANY5_income.json',
      },
    ],
  },
  'composite/dashboards': {
    title: 'Dashboards',
    description: 'Interactive multi-view dashboards',
    components: [
      {
        id: 'brfss-dashboard-v1',
        name: 'BRFSS Dashboard',
        description: 'Demographic breakdown dashboard for CDC health indicators',
        sampleData: 'https://ontopic-public-data.t3.storage.dev/cdc-data/brfss_state/examples/DRNKANY5_us_median.json',
      },
    ],
  },
};

// Helper to get all components as flat array
export function getAllComponents() {
  const all: (ComponentMeta & { category: string; path: string })[] = [];
  for (const [category, meta] of Object.entries(REGISTRY)) {
    for (const component of meta.components) {
      all.push({
        ...component,
        category,
        path: `${category}/${component.id}`,
      });
    }
  }
  return all;
}

// Helper to find component by path
export function getComponentByPath(path: string) {
  for (const [category, meta] of Object.entries(REGISTRY)) {
    for (const component of meta.components) {
      if (`${category}/${component.id}` === path) {
        return { ...component, category, categoryMeta: meta };
      }
    }
  }
  return null;
}

// Get sample data URL
export function getSampleDataUrl(filename: string) {
  // Handle absolute URLs
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  return `${SAMPLE_DATA_BASE}/${filename}`;
}

// Get GitHub source URL
export function getGitHubUrl(path: string) {
  return `${GITHUB_BASE}/${path}.tsx`;
}
