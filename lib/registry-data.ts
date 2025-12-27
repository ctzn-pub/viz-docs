export const SAMPLE_DATA_BASE = 'https://ontopic-public-data.t3.storage.dev/sample-data';
export const GITHUB_BASE = 'https://github.com/ctzn-pub/ontopic-viz-components/blob/main/registry/components';

export interface ComponentMeta {
  id: string;
  name: string;
  description: string;
  sampleData: string;
}

export interface FamilyMeta {
  id: string;
  name: string;
  description: string;
  variants: ComponentMeta[];
}

export interface CategoryMeta {
  title: string;
  description: string;
  domain: 'Generic' | 'Health' | 'Survey' | 'Geographic' | 'Statistical' | 'Dashboards';
  families?: FamilyMeta[];
  components?: ComponentMeta[];
}

export const REGISTRY: Record<string, CategoryMeta> = {
  'recharts/generic': {
    title: 'Generic Charts',
    description: 'Reusable chart components for any dataset',
    domain: 'Generic',
    families: [
      {
        id: 'timeseries',
        name: 'Time Series',
        description: 'Line charts for temporal data with recession overlays and time range controls',
        variants: [
          {
            id: 'basic',
            name: 'Basic',
            description: 'Simple time series line chart',
            sampleData: 'housing.json',
          },
          {
            id: 'dual-axis',
            name: 'Dual Axis',
            description: 'Time series with two Y-axes for different scales',
            sampleData: 'housing.json',
          },
          {
            id: 'index',
            name: 'Index Comparison',
            description: 'Normalized index comparison (rebased to 100)',
            sampleData: 'housing.json',
          },
        ],
      },
      {
        id: 'demographic',
        name: 'Demographic Charts',
        description: 'Visualizations for demographic breakdowns across age, income, education, and other groups',
        variants: [
          {
            id: 'breakdown',
            name: 'Switchable Chart',
            description: 'Switchable chart (scatter/line/bar) with confidence intervals',
            sampleData: 'obesity.json',
          },
          {
            id: 'panel',
            name: 'Multi-Panel',
            description: 'Side-by-side panel layout for each demographic category',
            sampleData: 'https://ontopic-public-data.t3.storage.dev/cdc-data/brfss_state/examples/DRNKANY5_us_median.json',
          },
        ],
      },
    ],
  },
  'recharts/brfss': {
    title: 'BRFSS (Health Surveillance)',
    description: 'Components for CDC BRFSS health survey data',
    domain: 'Health',
    families: [
      {
        id: 'state-bar',
        name: 'State Bar Chart',
        description: 'Horizontal bar charts for state-level health indicator comparisons',
        variants: [
          {
            id: 'sortable',
            name: 'Sortable (Recharts)',
            description: 'Interactive sortable horizontal bar chart',
            sampleData: 'state-visualization-data.json',
          },
          {
            id: 'plot',
            name: 'Ordered (Observable Plot)',
            description: 'Clean ordered horizontal bar chart',
            sampleData: 'https://ontopic-public-data.t3.storage.dev/cdc-data/brfss_state/examples/DRNKANY5_state_map.json',
          },
        ],
      },
    ],
  },
  'recharts/gss': {
    title: 'GSS (General Social Survey)',
    description: 'Components for GSS polling and opinion data',
    domain: 'Survey',
    components: [
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
    domain: 'Survey',
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
    domain: 'Survey',
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
    domain: 'Geographic',
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
    domain: 'Health',
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
  'plot/stats': {
    title: 'Statistical Visualizations',
    description: 'Statistical analysis charts using Observable Plot',
    domain: 'Statistical',
    families: [
      {
        id: 'odds-ratio',
        name: 'Odds Ratio Charts',
        description: 'Statistical visualizations for odds ratios with confidence intervals',
        variants: [
          {
            id: 'basic',
            name: 'Basic',
            description: 'Standard odds ratio visualization with confidence intervals',
            sampleData: 'odds-ratio-data.json',
          },
          {
            id: 'forest',
            name: 'Forest Plot',
            description: 'Advanced forest plot with enhanced statistical features',
            sampleData: 'odds-ratio-data.json',
          },
          {
            id: 'dotplot',
            name: 'Precision-Weighted',
            description: 'Dot plot where marker size reflects statistical precision',
            sampleData: 'odds-ratio-data.json',
          },
        ],
      },
      {
        id: 'density',
        name: 'Density Plots',
        description: 'Distribution visualizations for continuous variables',
        variants: [
          {
            id: 'basic',
            name: 'Basic',
            description: 'Single variable density distribution curve',
            sampleData: 'county_sample.json',
          },
          {
            id: 'overlay',
            name: 'Overlay',
            description: 'Overlaid density curves comparing distributions by group',
            sampleData: 'health-obesity-diabetes.json',
          },
        ],
      },
    ],
    components: [
      {
        id: 'correlation-heatmap-v1',
        name: 'Correlation Heatmap',
        description: 'Lower-triangle correlation matrix with color coding',
        sampleData: 'correlation-data.json',
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
    domain: 'Dashboards',
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

// Helper to get all components as flat array (includes family variants)
export function getAllComponents() {
  const all: (ComponentMeta & { category: string; path: string })[] = [];
  for (const [category, meta] of Object.entries(REGISTRY)) {
    // Add standalone components
    if (meta.components) {
      for (const component of meta.components) {
        all.push({
          ...component,
          category,
          path: `${category}/${component.id}`,
        });
      }
    }
    // Add family variants
    if (meta.families) {
      for (const family of meta.families) {
        for (const variant of family.variants) {
          all.push({
            ...variant,
            category,
            path: `${category}/${family.id}-${variant.id}-v1`,
          });
        }
      }
    }
  }
  return all;
}

// Helper to find component by path
export function getComponentByPath(path: string) {
  for (const [category, meta] of Object.entries(REGISTRY)) {
    // Check standalone components
    if (meta.components) {
      for (const component of meta.components) {
        if (`${category}/${component.id}` === path) {
          return { ...component, category, categoryMeta: meta };
        }
      }
    }
    // Check family variants
    if (meta.families) {
      for (const family of meta.families) {
        for (const variant of family.variants) {
          if (`${category}/${family.id}-${variant.id}-v1` === path) {
            return { ...variant, category, categoryMeta: meta, family };
          }
        }
      }
    }
  }
  return null;
}

// Helper to find family by path
export function getFamilyByPath(path: string) {
  for (const [category, meta] of Object.entries(REGISTRY)) {
    if (meta.families) {
      for (const family of meta.families) {
        if (`${category}/${family.id}` === path) {
          return { ...family, category, categoryMeta: meta };
        }
      }
    }
  }
  return null;
}

// Get sample data URL (original external URL - for display)
export function getSampleDataUrl(filename: string) {
  // Handle absolute URLs
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  return `${SAMPLE_DATA_BASE}/${filename}`;
}

// Get API route URL for data fetching (cached, server-side)
export function getApiDataUrl(filename: string) {
  // Handle absolute URLs from ontopic-public-data.t3.storage.dev
  if (filename.startsWith('https://ontopic-public-data.t3.storage.dev/')) {
    // Extract the path after the domain
    const path = filename.replace('https://ontopic-public-data.t3.storage.dev/', '');
    return `/api/sample-data/${path}`;
  }
  // Handle other absolute URLs - use them directly (can't proxy)
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  // Default: use the API route
  return `/api/sample-data/${filename}`;
}

// Get GitHub source URL
export function getGitHubUrl(path: string) {
  return `${GITHUB_BASE}/${path}.tsx`;
}
