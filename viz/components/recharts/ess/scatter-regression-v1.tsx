import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Scatter,
  ZAxis,
  ReferenceLine,
  Area,
  Line,
} from "recharts";

/** -----------------------------------------------------------
 *  Stats helpers (OLS, Pearson r, band)
 *  --------------------------------------------------------- */
export type XY = { x: number; y: number };

export function pearsonR(points: XY[]) {
  const n = points.length;
  if (n < 2) return NaN;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (const { x, y } of points) {
    sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
  }
  const cov = sxy - (sx * sy) / n;
  const vx = sxx - (sx * sx) / n;
  const vy = syy - (sy * sy) / n;
  if (vx <= 0 || vy <= 0) return NaN;
  return cov / Math.sqrt(vx * vy);
}

export function ols(points: XY[]) {
  const n = points.length;
  if (n < 2) return { b0: 0, b1: 0, se: NaN, xbar: NaN, sxx: NaN };

  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const { x, y } of points) {
    sx += x; sy += y; sxx += x * x; sxy += x * y;
  }
  const denom = n * sxx - sx * sx;
  const b1 = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const b0 = (sy - b1 * sx) / n;

  // Residual standard error (unbiased, n-2 df)
  const sse = points.reduce((acc, p) => {
    const yhat = b0 + b1 * p.x;
    return acc + (p.y - yhat) ** 2;
  }, 0);
  const se = Math.sqrt(sse / Math.max(1, n - 2));

  const xbar = sx / n;
  const sxxCentered = points.reduce((a, p) => a + (p.x - xbar) ** 2, 0);

  return { b0, b1, se, xbar, sxx: sxxCentered };
}

/** Build regression line and a 95% confidence band for the fitted mean. */
function lineAndBand(points: XY[], xMin: number, xMax: number, steps = 120) {
  const { b0, b1, se, xbar, sxx } = ols(points);
  const xs: number[] = [];
  for (let i = 0; i <= steps; i++) xs.push(xMin + (i * (xMax - xMin)) / steps);

  // t* for ~95% CI with large-ish df (n-2). Keep it simple & robust.
  const t = 2.0;

  const rows = xs.map((x) => {
    const y = b0 + b1 * x;
    // SE of fitted mean ŷ(x):  se * sqrt( 1/n + (x - x̄)^2 / Sxx )
    const seFit =
      isFinite(se) && isFinite(sxx) && sxx > 0 && points.length > 0
        ? se * Math.sqrt(1 / points.length + ((x - xbar) ** 2) / sxx)
        : NaN;
    const yLow = isFinite(seFit) ? y - t * seFit : y;
    const yHigh = isFinite(seFit) ? y + t * seFit : y;
    return { x, y, band: [yLow, yHigh] as [number, number] };
  });

  return { line: rows.map(({ x, y }) => ({ x, y })), band: rows };
}

/** -----------------------------------------------------------
 *  Data prep
 *  --------------------------------------------------------- */

type RegionKey = "Catholic" | "Protestant" | "Orthodox" | "Muslim" | "Other";

const REGION_COLORS: Record<RegionKey, string> = {
  Catholic: "var(--chart-1)",
  Protestant: "var(--chart-2)",
  Orthodox: "var(--chart-3)",
  Muslim: "var(--chart-4)",
  Other: "var(--chart-5)",
};

function normalizeReligion(s: string | undefined): RegionKey {
  const v = (s || "").toLowerCase();
  if (v.includes("catholic")) return "Catholic";
  if (v.includes("protestant")) return "Protestant";
  if (v.includes("orthodox")) return "Orthodox";
  if (v.includes("muslim") || v.includes("islam")) return "Muslim";
  return "Other";
}

export type EssRow = {
  cntry: string;
  iso3?: string;
  religion?: string;            // e.g., "Roman Catholic"
  population?: number;          // millions
  hdi?: number;                 // 0–1
  gdp?: number;                 // PPP$ 2011
  education?: number;           // mean years
  [k: string]: any;             // possible "happiness" key
};

export type CountryDatum = {
  name: string;
  region: RegionKey;
  religion: string;
  population_m: number;
  happiness: number;            // 0–10
  hdi?: number;
  gdp?: number;
  education?: number;
};

export function prepareEssRows(
  rows: EssRow[],
  opts: { happinessKey?: string } = {}
): CountryDatum[] {
  const { happinessKey = "happiness" } = opts;

  return rows.map((r) => {
    const region = normalizeReligion(r.religion);
    const happiness = Number(r[happinessKey]); // you control which column is passed in
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

/** -----------------------------------------------------------
 *  UI helpers
 *  --------------------------------------------------------- */

function fmtGDP(v: number) {
  if (!isFinite(v)) return "";
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return `${v}`;
}
function fmtMillions(v: number) {
  if (!isFinite(v)) return "";
  return v < 10 ? `${v.toFixed(1)}M` : `${Math.round(v)}M`;
}

const BubbleTooltip = ({ active, payload, xLabel, xFmt }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-4 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
      <div className="font-bold text-foreground mb-2 pb-2 border-b border-border">{d.name}</div>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between items-center gap-4">
          <span className="text-muted-foreground font-medium">{xLabel}:</span>
          <span className="font-mono font-semibold">{xFmt ? xFmt(d.x) : d.x}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-muted-foreground font-medium">Happiness:</span>
          <span className="font-mono font-semibold text-primary">
            {isFinite(d.y) ? Number(d.y).toFixed(2) : "—"}
          </span>
        </div>
        {isFinite(d.population_m) && (
          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground font-medium">Population:</span>
            <span className="font-mono font-semibold">{fmtMillions(d.population_m)}</span>
          </div>
        )}
        <div className="flex justify-between items-center gap-4 mt-2 pt-2 border-t border-border">
          <span className="text-muted-foreground font-medium">Religion:</span>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full shadow-sm"
              style={{ background: d.fill }}
            />
            <span className="font-medium">{d.religion}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/** -----------------------------------------------------------
 *  Section (single chart)
 *  --------------------------------------------------------- */

type SectionProps = {
  title: string;
  xKey: keyof CountryDatum;           // 'hdi' | 'gdp' | 'education'
  xLabel: string;
  xDomain: [number, number];
  xTickFmt?: (v: number) => string;
  data: CountryDatum[];
};

function Section({ title, xKey, xLabel, xDomain, xTickFmt, data }: SectionProps) {
  // Filter & project to points
  const points: XY[] = data
    .filter((d) => Number.isFinite(d[xKey] as number) && Number.isFinite(d.happiness))
    .map((d) => ({ x: Number(d[xKey] as number), y: Number(d.happiness) }));

  const r = pearsonR(points);
  const [xMin, xMax] = xDomain;
  const { line, band } = lineAndBand(points, xMin, xMax, 100);

  const scatterData = data.map((d) => {
    const x = Number(d[xKey] as number);
    const y = Number(d.happiness);
    return {
      ...d,
      x,
      y,
      z: isFinite(d.population_m) ? Math.max(30, Math.sqrt(d.population_m) * 5) : 30,
      fill: REGION_COLORS[d.region] || "var(--chart-5)",
    };
  });

  return (
    <div className="flex flex-col bg-card/40 backdrop-blur-[2px] border border-border/50 rounded-2xl p-5 hover:bg-card/60 transition-colors duration-300">
      <div className="mb-4 space-y-1">
        <h3 className="text-sm font-bold tracking-tight text-foreground uppercase ls-wide">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Correlation:</span>
          <span className={`text-xs font-mono font-bold ${Math.abs(r) > 0.5 ? 'text-primary' : 'text-muted-foreground'}`}>
            {isFinite(r) ? r.toFixed(2) : "—"}
          </span>
        </div>
      </div>

      <div className="h-[300px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
            <XAxis
              type="number"
              dataKey="x"
              domain={xDomain}
              tickFormatter={xTickFmt}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              label={{ value: xLabel, position: "insideBottom", offset: -5, fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 500 }}
            />
            <YAxis
              type="number"
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Happiness", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 500 }}
            />
            <ZAxis dataKey="z" range={[60, 400]} />

            <Area
              type="monotone"
              data={band}
              dataKey="band"
              stroke="none"
              fill="var(--foreground)"
              fillOpacity={0.05}
              isAnimationActive={true}
              animationDuration={2000}
            />

            <Line
              type="monotone"
              data={line}
              dataKey="y"
              dot={false}
              stroke="var(--foreground)"
              strokeWidth={1.5}
              strokeOpacity={0.6}
              strokeDasharray="4 4"
              isAnimationActive={true}
              animationDuration={2000}
            />

            <ReferenceLine y={7} stroke="var(--border)" strokeDasharray="3 3" />

            <Scatter
              data={scatterData}
              dataKey="y"
              isAnimationActive={true}
              animationDuration={1500}
              shape={(props: any) => {
                const { cx, cy, payload, size } = props;
                const r = Math.sqrt(Math.max(0, size) / Math.PI);
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={payload.fill}
                    fillOpacity={0.8}
                    stroke="var(--background)"
                    strokeWidth={1.5}
                    className="hover:opacity-100 transition-opacity drop-shadow-sm cursor-pointer"
                  />
                );
              }}
            />

            <Tooltip
              cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={<BubbleTooltip xLabel={xLabel} xFmt={xTickFmt} />}
              wrapperStyle={{ outline: "none" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** -----------------------------------------------------------
 *  Legend
 *  --------------------------------------------------------- */
function RegionLegend() {
  const items = (Object.keys(REGION_COLORS) as RegionKey[]).map((k) => [k, REGION_COLORS[k]] as const);
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 px-4 py-3 bg-muted/30 rounded-xl border border-border/50">
      {items.map(([label, color]) => (
        <div key={label} className="flex items-center gap-2 group cursor-default">
          <span className="inline-block h-3 w-3 rounded-full shadow-sm group-hover:scale-125 transition-transform" style={{ background: color }} />
          <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
        </div>
      ))}
    </div>
  );
}

/** -----------------------------------------------------------
 *  Main panel
 *  --------------------------------------------------------- */

type PanelProps = { data: CountryDatum[] };

export default function HappinessCorrelatesPanel({ data }: PanelProps) {
  const dataset = data ?? [];

  return (
    <div className="w-full bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
      <div className="mb-8 space-y-2 border-b border-border pb-6">
        <h2 className="text-2xl font-bold tracking-tight">Well-being Determinants</h2>
        <p className="text-muted-foreground max-w-2xl">
          Exploring the relationship between national happiness levels and key socio-economic indicators across different religious regions.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Section
          title="Human Development"
          xKey="hdi"
          xLabel="HDI Index"
          xDomain={[0.5, 1.0]}
          data={dataset}
        />
        <Section
          title="Economic Prosperity"
          xKey="gdp"
          xLabel="GDP per capita (PPP$)"
          xDomain={[3000, 55000]}
          xTickFmt={fmtGDP}
          data={dataset}
        />
        <Section
          title="Education Attainment"
          xKey="education"
          xLabel="Mean Years of Schooling"
          xDomain={[8, 14]}
          data={dataset}
        />
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <RegionLegend />
        <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">
          Bubble size represents population · Dashed line shows guide at happiness level 7.0
        </div>
      </div>
    </div>
  );
}
