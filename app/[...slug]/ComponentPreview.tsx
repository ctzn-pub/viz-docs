'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import usTopoJSON from '@/app/data/geo/us_counties_10m.json';

// Dynamic component imports
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const componentMap: Record<string, React.ComponentType<any>> = {
  'recharts/generic/timeseries-basic-v1': dynamic(() => import('@/viz/components/recharts/generic/timeseries-basic-v1')),
  'recharts/generic/timeseries-dual-axis-v1': dynamic(() => import('@/viz/components/recharts/generic/timeseries-dual-axis-v1')),
  'recharts/generic/timeseries-index-v1': dynamic(() => import('@/viz/components/recharts/generic/timeseries-index-v1')),
  'recharts/generic/demographic-breakdown-v1': dynamic(() => import('@/viz/components/recharts/generic/demographic-breakdown-v1')),
  'recharts/brfss/state-bar-v1': dynamic(() => import('@/viz/components/recharts/brfss/state-bar-v1')),
  'recharts/brfss/state-bar-sortable-v1': dynamic(() => import('@/viz/components/recharts/brfss/state-bar-sortable-v1')),
  'recharts/gss/timetrend-demo-v1': dynamic(() => import('@/viz/components/recharts/gss/timetrend-demo-v1')),
  'recharts/ess/scatter-regression-v1': dynamic(() => import('@/viz/components/recharts/ess/scatter-regression-v1')),
  'plot/geo/state-map-v1': dynamic(() => import('@/viz/components/plot/geo/state-map-v1')),
  'plot/geo/bubble-map-v1': dynamic(() => import('@/viz/components/plot/geo/bubble-map-v1')),
  'plot/geo/choropleth-v1': dynamic(() => import('@/viz/components/plot/geo/choropleth-v1')),
  'plot/geo/europe-map-v1': dynamic(() => import('@/viz/components/plot/geo/europe-map-v1')),
  'plot/geo/zip-map-v1': dynamic(() => import('@/viz/components/plot/geo/zip-map-v1')),
  'plot/geo/density-map-geo-v1': dynamic(() => import('@/viz/components/plot/geo/density-map-geo-v1')),
  'plot/health/health-scatter-basic-v1': dynamic(() => import('@/viz/components/plot/health/health-scatter-basic-v1')),
  'plot/health/health-scatter-regression-v1': dynamic(() => import('@/viz/components/plot/health/health-scatter-regression-v1')),
  'plot/health/health-scatter-faceted-v1': dynamic(() => import('@/viz/components/plot/health/health-scatter-faceted-v1')),
  'plot/stats/odds-ratio-basic-v1': dynamic(() => import('@/viz/components/plot/stats/odds-ratio-basic-v1')),
  'plot/stats/odds-ratio-forest-v1': dynamic(() => import('@/viz/components/plot/stats/odds-ratio-forest-v1')),
  'plot/stats/odds-ratio-dotplot-v1': dynamic(() => import('@/viz/components/plot/stats/odds-ratio-dotplot-v1')),
  'plot/stats/correlation-heatmap-v1': dynamic(() => import('@/viz/components/plot/stats/correlation-heatmap-v1')),
  'plot/stats/density-overlay-v1': dynamic(() => import('@/viz/components/plot/stats/density-overlay-v1')),
  'plot/stats/density-basic-v1': dynamic(() => import('@/viz/components/plot/stats/density-basic-v1')),
  'plot/stats/distribution-v1': dynamic(() => import('@/viz/components/plot/stats/distribution-v1')),
  'plot/stats/demographic-panel-v1': dynamic(() => import('@/viz/components/plot/stats/demographic-panel-v1')),
  'plot/stats/split-bar-v1': dynamic(() => import('@/viz/components/plot/stats/split-bar-v1')),
  'plot/brfss/state-bar-v1': dynamic(() => import('@/viz/components/plot/brfss/state-bar-v1')),
  'plot/timeseries/multiline-v1': dynamic(() => import('@/viz/components/plot/timeseries/multiline-v1')),
  'plot/gss/timetrend-demo-v1': dynamic(() => import('@/viz/components/plot/gss/timetrend-demo-v1')),
  'composite/dashboards/brfss-dashboard-v1': dynamic(() => import('@/viz/components/composite/brfss-dashboard-v1')),
};

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="icon" onClick={handleCopy} className={className}>
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

interface ComponentPreviewProps {
  path: string;
  data: unknown;
  error?: string | null;
}

export function ComponentPreview({ path, data, error }: ComponentPreviewProps) {
  const Component = componentMap[path];

  if (!Component) {
    return <div className="text-muted-foreground">Component not found</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        Error loading data: {error}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="min-h-[300px]">
          {path === 'plot/geo/state-map-v1' ? (
            (() => {
              const rawData = (data as any)?.data || data;
              const stateData = rawData?.state_data;
              const formattedData = stateData
                ? Object.keys(stateData).map((key) => ({
                    state: stateData[key].state_name,
                    value: stateData[key].overall
                  }))
                : [];
              return (
                <Component
                  usTopoJSON={usTopoJSON}
                  data={formattedData}
                  title={rawData?.clean_title}
                  year={rawData?.year}
                  description={rawData?.question}
                  source="CDC Behavioral Risk Factor Surveillance System"
                  labels={{ valueSuffix: '%' }}
                  width={800}
                  height={500}
                />
              );
            })()
          ) : path === 'plot/stats/split-bar-v1' ? (
            (() => {
              const rawData = data as any;
              if (!rawData?.states) {
                return <div className="text-muted-foreground">Invalid data format</div>;
              }
              const transformedData = rawData.states
                .filter((s: any) => s.state_abbr !== 'US' && s.state_abbr !== 'UW')
                .map((stateData: any) => ({
                  category: stateData.state_name,
                  state_abbr: stateData.state_abbr,
                  overall: stateData.overall,
                  values: stateData.values || {}
                }));
              return (
                <Component
                  data={transformedData}
                  title={rawData.clean_title}
                  subtitle={rawData.question}
                  valueLabel={`${rawData.data_value_type || 'Value'} (${rawData.data_value_unit || '%'})`}
                  caption={[rawData.class, rawData.year, rawData.demographic_category].filter(Boolean).join(' • ')}
                  height={750}
                  width={800}
                  marginLeft={150}
                />
              );
            })()
          ) : path === 'plot/brfss/state-bar-v1' ? (
            (() => {
              const rawData = data as any;
              if (!rawData?.states) {
                return <div className="text-muted-foreground">Invalid data format - no states array</div>;
              }
              return (
                <Component
                  data={rawData.states}
                  title={rawData.clean_title}
                  subtitle={rawData.question}
                  valueLabel={rawData.data_value_type || 'Value'}
                  valueUnit={rawData.data_value_unit || '%'}
                  caption={[rawData.class, rawData.year].filter(Boolean).join(' • ')}
                  height={900}
                  width={800}
                />
              );
            })()
          ) : path === 'recharts/generic/timeseries-economic-v1' ? (
            (() => {
              const rawData = data as any;
              if (!rawData?.series) {
                return <div className="text-muted-foreground">No series data found</div>;
              }
              const caseShiller = rawData.series.find((s: any) => s.id === 'CSUSHPISA');
              if (!caseShiller) {
                return <div className="text-muted-foreground">Case-Shiller series not found</div>;
              }
              return <Component data={caseShiller} />;
            })()
          ) : path === 'recharts/generic/timeseries-index-v1' ? (
            (() => {
              const rawData = data as any;
              if (!rawData?.series || rawData.series.length < 2) {
                return <div className="text-muted-foreground">Need at least 2 series for comparison</div>;
              }
              return (
                <Component
                  series1={rawData.series[0]}
                  series2={rawData.series[1]}
                  title={rawData.category}
                />
              );
            })()
          ) : path === 'recharts/generic/timeseries-dual-axis-v1' ? (
            (() => {
              const rawData = data as any;
              if (!rawData?.series || rawData.series.length < 2) {
                return <div className="text-muted-foreground">Need at least 2 series for comparison</div>;
              }
              const housingStarts = rawData.series.find((s: any) => s.id === 'HOUSTNSA');
              const caseShiller = rawData.series.find((s: any) => s.id === 'CSUSHPISA');
              if (!housingStarts || !caseShiller) {
                return <div className="text-muted-foreground">Required series not found</div>;
              }
              return (
                <Component
                  series1Data={housingStarts.observations.map((o: any) => ({ date: o.date, value: parseFloat(o.value) }))}
                  series2Data={caseShiller.observations.map((o: any) => ({ date: o.date, value: parseFloat(o.value) }))}
                  series1Name={housingStarts.title}
                  series2Name={caseShiller.title}
                  series1Unit={housingStarts.units}
                  series2Unit={caseShiller.units}
                  title={rawData.category}
                />
              );
            })()
          ) : path === 'plot/timeseries/multiline-v1' ? (
            (() => {
              const rawData = data as any[];
              if (!Array.isArray(rawData) || rawData.length === 0) {
                return <div className="text-muted-foreground">Invalid data format</div>;
              }
              return (
                <Component
                  data={rawData}
                  xKey="date"
                  yKey="homevalue"
                  groupKey="state"
                  title="Median Home Prices by State"
                  caption="Data Source: Zillow"
                  yLabel="Home Value"
                  yFormat="index"
                  width={800}
                  height={550}
                  showIndexSlider={true}
                />
              );
            })()
          ) : path === 'recharts/generic/timeseries-basic-v1' ? (
            (() => {
              const rawData = data as any;
              if (!rawData?.series?.[0]?.observations) {
                return <div className="text-muted-foreground">Invalid data format - no observations</div>;
              }
              const series = rawData.series[0];
              const transformedData = series.observations.map((o: any) => ({
                date: o.date,
                value: parseFloat(o.value),
              })).filter((d: any) => !isNaN(d.value));
              return (
                <Component
                  data={transformedData}
                  seriesName={series.title || 'Value'}
                  unit={series.units}
                  title={series.title || rawData.category}
                  description={series.units}
                />
              );
            })()
          ) : path === 'recharts/gss/timeseries-line-v1' || path === 'recharts/gss/abortion-opinion-v1' ? (
            (() => {
              const rawData = data as any;
              const dataPoints = rawData?.data || [];
              const processedDataPoints = dataPoints.map((d: any) => ({
                ...d,
                group: 'Overall'
              }));
              return (
                <Component
                  data={{
                    metadata: {
                      title: rawData?.metadata?.title || 'GSS Trend',
                      subtitle: rawData?.metadata?.subtitle || '',
                      source: { name: 'General Social Survey' },
                    },
                    dataPoints: processedDataPoints,
                    dataPointMetadata: [{ id: 'value', value_suffix: '%' }]
                  }}
                  demographicGroups={['Overall']}
                  demographic="group"
                  defaultVisibleGroups={['Overall']}
                />
              );
            })()
          ) : path === 'recharts/gss/timetrend-demo-v1' ? (
            (() => {
              const rawData = data as any;
              const dataPoints = rawData?.dataPoints || [];
              const demographicField = 'PolParty';
              const demographicGroups = rawData?.dataPointMetadata
                ?.find((item: any) => item.id === demographicField)
                ?.categories || [];
              return (
                <Component
                  data={{
                    metadata: rawData?.metadata || { title: 'Time Trend', source: { name: 'General Social Survey' } },
                    dataPoints: dataPoints,
                    dataPointMetadata: rawData?.dataPointMetadata || []
                  }}
                  demographicGroups={demographicGroups}
                  demographic={demographicField}
                />
              );
            })()
          ) : path === 'plot/gss/timetrend-demo-v1' ? (
            (() => {
              const rawData = data as any;
              const defaults = {
                x: "year",
                y: "value",
                color: "PolParty",
                errorbar: "ci",
                plotBands: "PrezEra"
              };
              const colors: Record<string, Record<string, string>> = {
                PolParty: {
                  Democrat: '#2196f3',
                  Republican: '#f44336',
                  Independent: '#4caf50',
                }
              };
              return (
                <Component
                  defaults={defaults}
                  data={rawData}
                  error="yes"
                  colors={colors}
                  label="Political Party:"
                />
              );
            })()
          ) : path === 'plot/geo/europe-map-v1' ? (
            <Component
              data={data as any[]}
              title="Income Inequality in Europe"
              subtitle="Gini coefficient by country"
              valueLabel="Gini Coefficient"
              width={800}
              height={550}
            />
          ) : (
            <Component data={data} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
