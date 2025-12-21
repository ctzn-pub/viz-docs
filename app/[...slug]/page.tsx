'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, ExternalLink, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  getComponentByPath,
  getSampleDataUrl,
  getApiDataUrl,
  getGitHubUrl,
  SAMPLE_DATA_BASE,
} from '@/lib/registry-data';
import usTopoJSON from '@/app/data/geo/us_counties_10m.json';
// Type for ESS row data
type EssRow = {
  cntry: string;
  iso3?: string;
  religion?: string;
  population?: number;
  hdi?: number;
  gdp?: number;
  education?: number;
  happiness?: number;
  [k: string]: unknown;
};

type RegionKey = "Catholic" | "Protestant" | "Orthodox" | "Muslim" | "Other";

// Normalize religion to region key
function normalizeReligion(s: string | undefined): RegionKey {
  const v = (s || "").toLowerCase();
  if (v.includes("catholic")) return "Catholic";
  if (v.includes("protestant")) return "Protestant";
  if (v.includes("orthodox")) return "Orthodox";
  if (v.includes("muslim") || v.includes("islam")) return "Muslim";
  return "Other";
}

// Prepare ESS rows for the scatter-regression component
function prepareEssRows(
  rows: EssRow[],
  opts: { happinessKey?: string } = {}
) {
  const { happinessKey = "happiness" } = opts;
  return rows.map((r) => {
    const region = normalizeReligion(r.religion);
    const happiness = Number(r[happinessKey]);
    return {
      name: r.cntry,
      religion: r.religion || region,
      region,
      population_m: Number(r.population ?? 0),
      happiness: isFinite(happiness) ? happiness : NaN,
      hdi: Number(r.hdi),
      gdp: Number(r.gdp),
      education: Number(r.education),
    };
  });
}

// Dynamic component imports - mapped by path
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
  'plot/health/health-scatter-basic-v1': dynamic(() => import('@/viz/components/plot/health/health-scatter-basic-v1')),
  'plot/health/health-scatter-regression-v1': dynamic(() => import('@/viz/components/plot/health/health-scatter-regression-v1')),
  'plot/health/health-scatter-faceted-v1': dynamic(() => import('@/viz/components/plot/health/health-scatter-faceted-v1')),
  'plot/stats/odds-ratio-basic-v1': dynamic(() => import('@/viz/components/plot/stats/odds-ratio-basic-v1')),
  'plot/stats/odds-ratio-forest-v1': dynamic(() => import('@/viz/components/plot/stats/odds-ratio-forest-v1')),
  'plot/stats/odds-ratio-dotplot-v1': dynamic(() => import('@/viz/components/plot/stats/odds-ratio-dotplot-v1')),
  'plot/stats/correlation-heatmap-v1': dynamic(() => import('@/viz/components/plot/stats/correlation-heatmap-v1')),
  'plot/stats/density-overlay-v1': dynamic(() => import('@/viz/components/plot/stats/density-overlay-v1')),
  'plot/stats/density-basic-v1': dynamic(() => import('@/viz/components/plot/stats/density-basic-v1')),
  'plot/stats/demographic-panel-v1': dynamic(() => import('@/viz/components/plot/stats/demographic-panel-v1')),
  'plot/stats/split-bar-v1': dynamic(() => import('@/viz/components/plot/stats/split-bar-v1')),
  'plot/brfss/state-bar-v1': dynamic(() => import('@/viz/components/plot/brfss/state-bar-v1')),
  'plot/timeseries/multiline-v1': dynamic(() => import('@/viz/components/plot/timeseries/multiline-v1')),
  'plot/gss/timetrend-demo-v1': dynamic(() => import('@/viz/components/plot/gss/timetrend-demo-v1')),
  'composite/dashboards/brfss-dashboard-v1': dynamic(() => import('@/viz/components/composite/brfss-dashboard-v1')),
};

function CopyButton({ text, className }: { text: string; className?: string }) {
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

export default function ComponentPage() {
  const params = useParams();
  const slug = params.slug as string[];
  const path = slug.join('/');

  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const componentMeta = getComponentByPath(path);
  const Component = componentMap[path];

  useEffect(() => {
    if (!componentMeta) return;

    const fetchData = async () => {
      try {
        const url = getApiDataUrl(componentMeta.sampleData);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');

        // Handle CSV vs JSON
        if (componentMeta.sampleData.endsWith('.csv')) {
          const text = await response.text();
          // Parse CSV to array of objects
          const lines = text.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim());

          // For ESS data, only convert specific numeric fields (matching data-visualization)
          const numericFields = ['population', 'hdi', 'gdp', 'education'];

          const rows = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',');
              const obj: Record<string, string | number> = {};
              headers.forEach((header, i) => {
                const val = values[i]?.trim() ?? '';
                if (val && val !== '') {
                  // Only convert specific numeric fields
                  if (numericFields.includes(header)) {
                    obj[header] = parseFloat(val);
                  } else {
                    obj[header] = val;
                  }
                }
              });
              return obj;
            });

          // Transform ESS data for scatter-regression using component's prepareEssRows
          if (path === 'recharts/ess/scatter-regression-v1') {
            // Deterministic hash for stable happiness values
            const hashStr = (s: string) => {
              let hash = 0;
              for (let i = 0; i < s.length; i++) {
                hash = ((hash << 5) - hash) + s.charCodeAt(i);
                hash |= 0;
              }
              return Math.abs(hash % 1000) / 1000;
            };

            // Add synthetic happiness field (CSV doesn't have actual happiness)
            const rawData: EssRow[] = rows.map((r: Record<string, string | number>) => {
              const hdi = Number(r.hdi);
              const countryHash = hashStr(String(r.cntry || ''));
              let happiness: number;
              if (hdi && isFinite(hdi)) {
                const normalizedHdi = Math.max(0.7, Math.min(0.95, hdi));
                const mappedHappiness = 4.5 + ((normalizedHdi - 0.7) / 0.25) * 3;
                happiness = Number((mappedHappiness + (countryHash - 0.5) * 1.5).toFixed(2));
              } else {
                happiness = 5 + (countryHash - 0.5) * 2;
              }
              return { ...r, happiness } as EssRow;
            });

            // Use the component's prepareEssRows function
            const processedData = prepareEssRows(rawData, { happinessKey: 'happiness' });
            setData(processedData);
          } else {
            setData(rows);
          }
        } else {
          const json = await response.json();
          // Handle wrapped data format for BRFSS state components
          if (path.includes('brfss/state-bar') && json.data) {
            setData(json.data);
          } else {
            setData(json);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [componentMeta]);

  if (!componentMeta || !Component) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          <h1 className="text-2xl font-bold mb-4">Component not found</h1>
          <p className="text-muted-foreground mb-4">
            The component at <code className="bg-muted px-2 py-1 rounded">{path}</code> does not exist.
          </p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to components
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const installCommand = `npx @ontopic/viz add ${path}`;
  const sampleDataUrl = getSampleDataUrl(componentMeta.sampleData);
  const githubUrl = getGitHubUrl(path);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Back link */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to components
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{componentMeta.name}</h1>
            <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
              v1
            </span>
          </div>
          <p className="text-muted-foreground">{componentMeta.description}</p>
        </div>

        {/* Install card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            {/* Path */}
            <div className="flex items-center justify-between mb-4">
              <code className="text-lg font-semibold font-mono">{path}</code>
            </div>

            {/* Install command */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-muted rounded-md px-4 py-2.5 font-mono text-sm">
                <span className="text-muted-foreground">$ </span>
                {installCommand}
              </div>
              <CopyButton text={installCommand} />
            </div>

            {/* GitHub link */}
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View source on GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {/* Sample data */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sample Data</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md overflow-x-auto font-mono">
                  {sampleDataUrl}
                </code>
                <CopyButton text={sampleDataUrl} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-8">
                  Error loading data: {error}
                </div>
              ) : (
                <div className="min-h-[300px]">
                  {path === 'plot/geo/state-map-v1' ? (
                    // StateMap needs usTopoJSON and formatted data
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
                    // SplitBar with auto-selection of most divergent demographic levels
                    (() => {
                      const rawData = data as any;
                      if (!rawData?.states) {
                        return <div className="text-muted-foreground">Invalid data format</div>;
                      }
                      // Transform states array - keep nested values structure
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
                    // StateBarChart needs states array and metadata from data
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
                    // TimeSeries economic needs a single series - use Case-Shiller
                    (() => {
                      const rawData = data as any;
                      if (!rawData?.series) {
                        return <div className="text-muted-foreground">No series data found</div>;
                      }
                      // Find Case-Shiller series by id
                      const caseShiller = rawData.series.find((s: any) => s.id === 'CSUSHPISA');
                      if (!caseShiller) {
                        return <div className="text-muted-foreground">Case-Shiller series not found</div>;
                      }
                      return <Component data={caseShiller} />;
                    })()
                  ) : path === 'recharts/generic/timeseries-index-v1' ? (
                    // IndexChart needs series1 and series2 props
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
                    // DualAxisChart needs transformed series data - using Housing Starts and Case-Shiller
                    (() => {
                      const rawData = data as any;
                      if (!rawData?.series || rawData.series.length < 2) {
                        return <div className="text-muted-foreground">Need at least 2 series for comparison</div>;
                      }
                      // Find specific series by id: HOUSTNSA (Housing Starts) and CSUSHPISA (Case-Shiller)
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
                    // MultiLine chart for Zillow housing data
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
                    // TimeSeriesChart needs transformed data from housing.json format
                    (() => {
                      const rawData = data as any;
                      if (!rawData?.series?.[0]?.observations) {
                        return <div className="text-muted-foreground">Invalid data format - no observations</div>;
                      }
                      const series = rawData.series[0];
                      const transformedData = series.observations.map((o: any) => ({
                        year: o.date?.substring(0, 4) || String(o.year),
                        value: parseFloat(o.value),
                      })).filter((d: any) => !isNaN(d.value));
                      return (
                        <Component
                          data={transformedData}
                          metadata={{
                            type: 'timeseries',
                            title: series.title || rawData.category,
                            subtitle: series.units || '',
                            source: { id: 'fred', name: 'Federal Reserve Economic Data' }
                          }}
                          dataPointMetadata={[{ id: 'value', name: 'Value', type: 'number' }]}
                        />
                      );
                    })()
                  ) : path === 'recharts/gss/timeseries-line-v1' || path === 'recharts/gss/abortion-opinion-v1' ? (
                    // GSS components need transformed data
                    (() => {
                      const rawData = data as any;
                      const dataPoints = rawData?.data || [];
                      // Add group field to each data point for demographic grouping
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
                    // Recharts Time Trend Demo with presidential backgrounds
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
                    // Observable Plot Time Trend Demo with presidential backgrounds
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
                  ) : (
                    <Component data={data} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
