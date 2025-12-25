'use client';

import dynamic from 'next/dynamic';

export const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
    'recharts/generic/timeseries-basic-v1': dynamic(() => import('@/viz/components/recharts/generic/timeseries-basic-v1'), { ssr: false }),
    'recharts/generic/timeseries-dual-axis-v1': dynamic(() => import('@/viz/components/recharts/generic/timeseries-dual-axis-v1'), { ssr: false }),
    'recharts/generic/timeseries-index-v1': dynamic(() => import('@/viz/components/recharts/generic/timeseries-index-v1'), { ssr: false }),
    'recharts/generic/demographic-breakdown-v1': dynamic(() => import('@/viz/components/recharts/generic/demographic-breakdown-v1'), { ssr: false }),
    'recharts/brfss/state-bar-v1': dynamic(() => import('@/viz/components/recharts/brfss/state-bar-v1'), { ssr: false }),
    'recharts/brfss/state-bar-sortable-v1': dynamic(() => import('@/viz/components/recharts/brfss/state-bar-sortable-v1'), { ssr: false }),
    'recharts/gss/timetrend-demo-v1': dynamic(() => import('@/viz/components/recharts/gss/timetrend-demo-v1'), { ssr: false }),
    'recharts/ess/scatter-regression-v1': dynamic(() => import('@/viz/components/recharts/ess/scatter-regression-v1'), { ssr: false }),
    'plot/geo/state-map-v1': dynamic(() => import('@/viz/components/plot/geo/state-map-v1'), { ssr: false }),
    'plot/geo/bubble-map-v1': dynamic(() => import('@/viz/components/plot/geo/bubble-map-v1'), { ssr: false }),
    'plot/geo/choropleth-v1': dynamic(() => import('@/viz/components/plot/geo/choropleth-v1'), { ssr: false }),
    'plot/health/health-scatter-basic-v1': dynamic(() => import('@/viz/components/plot/health/health-scatter-basic-v1'), { ssr: false }),
    'plot/health/health-scatter-regression-v1': dynamic(() => import('@/viz/components/plot/health/health-scatter-regression-v1'), { ssr: false }),
    'plot/health/health-scatter-faceted-v1': dynamic(() => import('@/viz/components/plot/health/health-scatter-faceted-v1'), { ssr: false }),
    'plot/stats/odds-ratio-basic-v1': dynamic(() => import('@/viz/components/plot/stats/odds-ratio-basic-v1'), { ssr: false }),
    'plot/stats/odds-ratio-forest-v1': dynamic(() => import('@/viz/components/plot/stats/odds-ratio-forest-v1'), { ssr: false }),
    'plot/stats/odds-ratio-dotplot-v1': dynamic(() => import('@/viz/components/plot/stats/odds-ratio-dotplot-v1'), { ssr: false }),
    'plot/stats/correlation-heatmap-v1': dynamic(() => import('@/viz/components/plot/stats/correlation-heatmap-v1'), { ssr: false }),
    'plot/stats/density-overlay-v1': dynamic(() => import('@/viz/components/plot/stats/density-overlay-v1'), { ssr: false }),
    'plot/stats/density-basic-v1': dynamic(() => import('@/viz/components/plot/stats/density-basic-v1'), { ssr: false }),
    'plot/stats/demographic-panel-v1': dynamic(() => import('@/viz/components/plot/stats/demographic-panel-v1'), { ssr: false }),
    'plot/stats/split-bar-v1': dynamic(() => import('@/viz/components/plot/stats/split-bar-v1'), { ssr: false }),
    'plot/brfss/state-bar-v1': dynamic(() => import('@/viz/components/plot/brfss/state-bar-v1'), { ssr: false }),
    'plot/timeseries/multiline-v1': dynamic(() => import('@/viz/components/plot/timeseries/multiline-v1'), { ssr: false }),
    'plot/gss/timetrend-demo-v1': dynamic(() => import('@/viz/components/plot/gss/timetrend-demo-v1'), { ssr: false }),
    'composite/dashboards/brfss-dashboard-v1': dynamic(() => import('@/viz/components/composite/brfss-dashboard-v1'), { ssr: false }),
};
