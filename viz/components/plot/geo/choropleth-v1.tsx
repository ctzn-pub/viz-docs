'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/viz/ui/tabs";
import { LayoutDashboard, Map as MapIcon, Target } from 'lucide-react';

const TOPOLOGY_BASE_URL = 'https://ontopic-public-data.t3.storage.dev/geo';

interface CountyDataPoint {
  FIPS: string;
  MHLTH_AdjPrev: number;
  population: number;
}

interface ChoroplethMapProps {
  data?: CountyDataPoint[];
  title?: string;
  subtitle?: string;
  valueLabel?: string;
  colorScheme?: string;
}

const ChoroplethMap: React.FC<ChoroplethMapProps> = ({
  data = [],
  title = "US County Health Prevalence",
  subtitle = "County-level health data from CDC Behavioral Risk Factor Surveillance System",
  valueLabel = "Health Metric (%)",
  colorScheme = "magma"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const highlightMapRef = useRef<HTMLDivElement>(null);
  const [countyData, setCountyData] = useState<CountyDataPoint[]>([]);
  const [us, setUs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("standard");
  const { theme } = useTheme();

  // Fetch topology data
  useEffect(() => {
    fetch(`${TOPOLOGY_BASE_URL}/us-albers-counties-10m.json`)
      .then(response => response.json())
      .then(topology => {
        setUs(topology);
      })
      .catch(error => {
        console.error('Error loading topology:', error);
      });
  }, []);

  // Load county data from JSON file
  useEffect(() => {
    if (data.length > 0) {
      setCountyData(data);
      setLoading(false);
    } else {
      fetch('/data/county_sample.json')
        .then(response => response.json())
        .then((data: CountyDataPoint[]) => {
          setCountyData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading county data:', error);
          setLoading(false);
        });
    }
  }, [data]);

  const thresholds = useMemo(() => {
    if (!countyData.length) return { p80: 0, p90: 0 };
    const values = countyData.map(d => d.MHLTH_AdjPrev).sort((a, b) => a - b);
    return {
      p80: values[Math.floor(values.length * 0.8)],
      p90: values[Math.floor(values.length * 0.9)]
    };
  }, [countyData]);

  const renderMap = (container: HTMLDivElement | null, type: 'standard' | 'highlight') => {
    if (loading || !countyData.length || !us || !container) return;

    container.innerHTML = '';

    try {
      const statemesh = topojson.mesh(us, us.objects.states, (a: any, b: any) => a !== b);
      const nation = topojson.feature(us, us.objects.nation);
      const counties = topojson.feature(us, us.objects.counties);

      const dataMap = new Map(countyData.map(d => [d.FIPS, d.MHLTH_AdjPrev]));
      const populationMap = new Map(countyData.map(d => [d.FIPS, d.population]));

      const isDark = theme === 'dark';

      const colorConfig: any = type === 'standard'
        ? {
          type: "quantile" as const,
          n: 8,
          scheme: colorScheme as any,
          reverse: true,
          legend: true,
          label: valueLabel,
          tickFormat: ".1f"
        }
        : {
          type: "threshold" as const,
          domain: [thresholds.p80, thresholds.p90],
          range: [
            isDark ? "#1e293b" : "#f1f5f9", // Bottom 80% (Neutral)
            isDark ? "#3b82f6" : "#93c5fd", // Top 20-10% (Lighter)
            isDark ? "#1d4ed8" : "#1e40af"  // Top 10% (Darker)
          ],
          legend: true,
          label: `Segment (Highlighting Top 20%)`,
          tickFormat: (d: number) => {
            if (d === thresholds.p80) return "Top 20%";
            if (d === thresholds.p90) return "Top 10%";
            return "";
          }
        };

      const plot = Plot.plot({
        width: 1000,
        height: 600,
        projection: "albers",
        style: {
          backgroundColor: "transparent",
          color: "currentColor",
          fontFamily: "Inter, sans-serif",
          padding: "20px"
        },
        color: colorConfig,
        marks: [
          // Background fill for areas without data
          Plot.geo((counties as any).features, {
            fill: isDark ? "#0f172a" : "#f8fafc",
            stroke: isDark ? "#1e293b" : "#e2e8f0",
            strokeWidth: 0.2
          }),

          // Main data layer
          Plot.geo((counties as any).features, {
            fill: (d: any) => {
              const val = dataMap.get(d.id);
              return val !== undefined ? val : null;
            },
            stroke: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            strokeWidth: 0.5,
            tip: true,
            title: (d: any) => {
              const name = d.properties?.name || `County ${d.id}`;
              const val = dataMap.get(d.id);
              const pop = populationMap.get(d.id);
              if (val === undefined) return `${name}\nNo data`;

              let segment = "";
              if (type === 'highlight') {
                if (val >= thresholds.p90) segment = " (Top 10% Overall)";
                else if (val >= thresholds.p80) segment = " (Top 20% Overall)";
              }

              return `${name}${segment}\n${valueLabel}: ${val.toFixed(1)}%\nPopulation: ${pop?.toLocaleString() || 'N/A'}`;
            }
          }),

          // State boundaries
          Plot.geo(statemesh, {
            stroke: isDark ? "white" : "black",
            strokeOpacity: 0.3,
            strokeWidth: 1
          }),

          // Outer boundary
          Plot.geo(nation, {
            stroke: isDark ? "white" : "black",
            strokeWidth: 1.5,
            fill: "none"
          })
        ],
        marginLeft: 0,
        marginRight: 0,
        marginTop: 20,
        marginBottom: 20
      });

      container.appendChild(plot);
      return () => plot.remove();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'standard') renderMap(mapRef.current, 'standard');
    else renderMap(highlightMapRef.current, 'highlight');
  }, [countyData, us, activeTab, theme, colorScheme]);

  if (loading || !us) {
    return (
      <Card className="w-full h-[700px] flex items-center justify-center border-dashed border-2">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Assembling geographic data...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-card text-card-foreground border border-border rounded-xl shadow-sm transition-all duration-300">
      <CardHeader className="border-b border-border pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight inline-flex items-center gap-2">
              <MapIcon className="text-primary w-6 h-6" /> {title}
            </CardTitle>
            <CardDescription className="text-base max-w-2xl">{subtitle}</CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/50">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-lg shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-xs font-bold uppercase tracking-widest">{countyData.length} Counties</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="standard" className="rounded-lg font-bold text-xs uppercase tracking-wider py-2">
              <LayoutDashboard className="w-4 h-4 mr-2 opacity-70" />
              Standard Heatmap
            </TabsTrigger>
            <TabsTrigger value="highlight" className="rounded-lg font-bold text-xs uppercase tracking-wider py-2">
              <Target className="w-4 h-4 mr-2 opacity-70" />
              Focus View (Top 20%)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="focus-visible:outline-none">
            <div className="rounded-xl bg-muted/20 border border-border/50 p-4 relative min-h-[600px] flex justify-center items-center overflow-hidden">
              <div ref={mapRef} className="w-full flex justify-center transition-opacity duration-500" />
            </div>
            <div className="mt-6 flex flex-wrap gap-6 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary/20 border border-primary/30" />
                <span>Quantile scale (8 steps)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-muted/40" />
                <span>Albers Equal-Area Projection</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="highlight" className="focus-visible:outline-none">
            <div className="rounded-xl bg-muted/20 border border-border/50 p-4 relative min-h-[600px] flex justify-center items-center overflow-hidden">
              <div ref={highlightMapRef} className="w-full flex justify-center transition-opacity duration-500" />
            </div>
            <div className="mt-8 grid md:grid-cols-3 gap-6 p-6 bg-muted/10 border border-border/40 rounded-2xl">
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-tighter text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-700" /> Top 10% Tier
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Counties with values above <strong>{thresholds.p90.toFixed(1)}%</strong>. These represent the highest prevalence areas in the nation.
                </p>
              </div>
              <div className="space-y-2 border-x border-border/50 px-6">
                <h4 className="text-sm font-black uppercase tracking-tighter text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-300" /> Next 10% Tier
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Values between <strong>{thresholds.p80.toFixed(1)}%</strong> and <strong>{thresholds.p90.toFixed(1)}%</strong>. At-risk counties moving toward peak levels.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-tighter text-muted-foreground flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted" /> Base 80%
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All other counties with relatively lower prevalence. Neutralized to emphasize geographic clusters of concern.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="border-t border-border bg-muted/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground italic">
          * Data filtered for statistical significance. Shading uses standardized regional boundary smoothing.
        </p>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg shadow-sm text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Source: CDC BRFSS Cumulative Dataset
        </div>
      </CardFooter>
    </Card>
  );
};

export default ChoroplethMap;