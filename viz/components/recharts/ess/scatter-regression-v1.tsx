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
  Catholic: "#facc15",    // gold
  Protestant: "#52525b",  // zinc-600
  Orthodox: "#3b82f6",    // blue-500
  Muslim: "#ef4444",      // red-500
  Other: "#22c55e",       // green-500
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
  if (Math.abs(v) >= 1000) return `${Math.round(v / 1000)}k`;
  return `${v}`;
}
function fmtMillions(v: number) {
  if (!isFinite(v)) return "";
  // keep 1 decimal for < 10M else integer-ish
  return v < 10 ? `${v.toFixed(1)} Million` : `${Math.round(v)} Million`;
}

const BubbleTooltip = ({ active, payload, label, xLabel, xFmt }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;

  return (
    <div className="relative max-w-xs rounded-xl bg-white/95 p-3 shadow-xl ring-1 ring-black/5">
      {/* little pointer */}
      <div
        className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm bg-white ring-1 ring-black/5"
        aria-hidden
      />
      <div className="text-base font-semibold">{d.name}</div>
      <div className="mt-1 text-sm leading-5">
        <div>
          <span className="font-semibold">{xLabel}:</span>{" "}
          {xFmt ? xFmt(d.x) : d.x}
        </div>
        <div>
          <span className="font-semibold">Average Happiness:</span>{" "}
          {isFinite(d.y) ? Number(d.y).toFixed(2) : "—"}
        </div>
        {isFinite(d.population_m) && (
          <div>
            <span className="font-semibold">Population:</span>{" "}
            {fmtMillions(d.population_m)}
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="font-semibold">Religion:</span>
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: d.fill }}
          />
          <span>{d.religion}</span>
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
  // Debug happiness values
  if (title.includes("Human Development") && data.length > 0) {
    console.log(`${title} - Sample happiness values:`,
      data.slice(0, 5).map(d => `${d.name}: ${d.happiness}`)
    );
  }

  // Filter & project to points
  const points: XY[] = data
    .filter((d) => Number.isFinite(d[xKey] as number) && Number.isFinite(d.happiness))
    .map((d) => ({ x: Number(d[xKey] as number), y: Number(d.happiness) }));

  const r = pearsonR(points);
  const [xMin, xMax] = xDomain;
  const { line, band } = lineAndBand(points, xMin, xMax, 100);

  // Recharts expects each scatter row to carry x/y/z + your other fields
  const scatterData = data.map((d) => {
    const x = Number(d[xKey] as number);
    const y = Number(d.happiness);
    return {
      ...d,
      x,
      y,
      // bubble area ~ sqrt(pop) -> visually closer to population without extreme skew
      z: isFinite(d.population_m) ? Math.max(24, Math.sqrt(d.population_m) * 4) : 24,
      fill: REGION_COLORS[d.region] || "#8884d8",
    };
  });

  return (
    <div className="flex flex-col">
      <div className="mb-1 text-lg md:text-xl font-semibold">{title}</div>
      <div className="h-[340px] w-full">
        <ResponsiveContainer>
          <ComposedChart margin={{ top: 8, right: 18, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              domain={xDomain}
              tickFormatter={xTickFmt}
              label={{ value: xLabel, position: "insideBottom", offset: -2 }}
            />
            <YAxis
              type="number"
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              label={{ value: "Average Happiness", angle: -90, position: "insideLeft" }}
            />
            <ZAxis dataKey="z" range={[50, 240]} />

            {/* Confidence band (as in BandedChart) */}
            <Area
              type="monotone"
              data={band}
              dataKey="band"                                    // [low, high]
              stroke="none"
              fill="#94a3b8"                                   // slate-400
              fillOpacity={0.22}
              isAnimationActive={false}
            />

            {/* Line of best fit */}
            <Line
              type="monotone"
              data={line}
              dataKey="y"
              dot={false}
              stroke="#475569"                                  // slate-600
              strokeWidth={2}
              isAnimationActive={false}
            />

            {/* A light guide at 7 like the mock */}
            <ReferenceLine y={7} stroke="#cbd5e1" strokeDasharray="4 4" />

            {/* Bubbles */}
            <Scatter
              data={scatterData}
              dataKey="y"
              shape={(props: any) => {
                const { cx, cy, payload, size } = props;
                // Recharts passes 'size' scaled by <ZAxis range>; treat it as area.
                const r = Math.sqrt(Math.max(0, size) / Math.PI);
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={payload.fill}
                    fillOpacity={0.9}
                    stroke="#334155"
                    strokeOpacity={0.35}
                  />
                );
              }}
            />

            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={
                // We pass the axis label and formatter so the tooltip can render the x-value correctly.
                <BubbleTooltip xLabel={xLabel} xFmt={xTickFmt} /> as any
              }
              wrapperStyle={{ outline: "none" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 text-xs text-violet-700">
        Correlation: {isFinite(r) ? r.toFixed(2) : "—"}
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
    <div className="flex flex-wrap items-center gap-3 text-sm">
      {items.map(([label, color]) => (
        <div key={label} className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

/** -----------------------------------------------------------
 *  Main panel
 *  --------------------------------------------------------- */

type PanelProps = { data: CountryDatum[] };

/**
 * Expect `data` shaped like `CountryDatum[]`.
 * If you're piping raw rows from the attached Excel, call `prepareEssRows(rows, { happinessKey: 'happiness' })`
 * where `happiness` is the column in your prepared dataset that contains 0–10 averages.
 */
export default function HappinessCorrelatesPanel({ data }: PanelProps) {
  const dataset = data ?? [];

  return (
    <div className="w-full p-4 md:p-6">
      <div className="grid items-start gap-8 md:grid-cols-3">
        <Section
          title="Human Development Index"
          xKey="hdi"
          xLabel="HDI"
          xDomain={[0.5, 1.0]}
          data={dataset}
        />
        <Section
          title="GDP per capita (2011 PPP$)"
          xKey="gdp"
          xLabel="GDP per capita (2011 PPP$)"
          xDomain={[3000, 55000]}
          xTickFmt={fmtGDP}
          data={dataset}
        />
        <Section
          title="Mean Year of Schooling"
          xKey="education"
          xLabel="Mean Years of Schooling"
          xDomain={[8, 14]}
          data={dataset}
        />
      </div>

      <div className="mt-5">
        <RegionLegend />
      </div>
    </div>
  );
}
