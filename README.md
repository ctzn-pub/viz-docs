# @ontopic/viz Documentation

A curated registry of production-ready data visualization components built with **Recharts** and **Observable Plot**. Designed for health surveillance, survey analysis, and statistical reporting.

## Quick Start

### Install a Component

```bash
npx @ontopic/viz add <component-path>
```

Example:
```bash
npx @ontopic/viz add recharts/generic/timeseries-basic-v1
npx @ontopic/viz add plot/geo/state-map-v1
```

### Browse Components

Visit the [live documentation](https://viz.ontopic.io) to explore all available components with interactive previews.

## Available Components

### Generic Charts (`recharts/generic`)
| Component | Description |
|-----------|-------------|
| `timeseries-basic-v1` | Simple time series line chart |
| `timeseries-dual-axis-v1` | Time series with two Y-axes |
| `timeseries-index-v1` | Normalized index comparison (rebased to 100) |
| `demographic-breakdown-v1` | Switchable chart with confidence intervals |

### Health Surveillance (`recharts/brfss`, `plot/brfss`)
| Component | Description |
|-----------|-------------|
| `state-bar-v1` | Horizontal bar chart by state |
| `state-bar-sortable-v1` | Interactive sortable state comparison |

### Survey Data (`gss`, `recharts/ess`)
| Component | Description |
|-----------|-------------|
| `opinion-trends` | Time trends with presidential term backgrounds |
| `scatter-regression-v1` | Scatter plot with OLS regression |

### Geographic Maps (`plot/geo`)
| Component | Description |
|-----------|-------------|
| `state-map-v1` | US state choropleth map |
| `choropleth-v1` | County-level choropleth |
| `bubble-map-v1` | Geographic bubble map |
| `europe-map-v1` | European country choropleth |
| `zip-map-v1` | ZIP code dot density map |

### Statistical (`plot/stats`)
| Component | Description |
|-----------|-------------|
| `odds-ratio-basic-v1` | Odds ratio with confidence intervals |
| `odds-ratio-forest-v1` | Forest plot visualization |
| `density-basic-v1` | Distribution density curve |
| `correlation-heatmap-v1` | Correlation matrix heatmap |
| `split-bar-v1` | Demographic comparison bars |

### Dashboards (`composite/dashboards`)
| Component | Description |
|-----------|-------------|
| `brfss-dashboard-v1` | Full BRFSS health indicator dashboard |

## Data Contract

Components expect data in specific JSON formats. Each component's documentation page shows the expected schema and provides sample data URLs.

### Common Patterns

**Time Series Data**
```json
{
  "data": [
    { "date": "2020-01", "value": 42.5, "series": "A" },
    { "date": "2020-02", "value": 43.1, "series": "A" }
  ],
  "metadata": {
    "title": "Monthly Trends",
    "yLabel": "Percentage"
  }
}
```

**Geographic Data**
```json
{
  "data": [
    { "state": "CA", "value": 28.5, "name": "California" },
    { "state": "TX", "value": 31.2, "name": "Texas" }
  ],
  "metadata": {
    "title": "State Comparison",
    "metric": "Prevalence %"
  }
}
```

**Demographic Breakdown**
```json
{
  "categories": ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
  "data": [
    { "category": "18-24", "value": 22.1, "ci_low": 20.5, "ci_high": 23.7 }
  ]
}
```

## Architecture

This library bridges statistical computing (R/Python) with web visualization:

1. **Estimate** - Run models in Python or R
2. **Contract** - Serialize results to JSON matching component specs
3. **Dispatch** - Push to Tigris S3 or any CDN
4. **Render** - Next.js hydrates the component with live data

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Links

- [Component Registry](https://github.com/ctzn-pub/ontopic-viz-components) - Source code for all components
- [Sample Data CDN](https://ontopic-public-data.t3.storage.dev/sample-data/) - Example datasets

## License

MIT
