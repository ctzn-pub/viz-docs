'use client';


import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ErrorBar,
  CartesianGrid,
} from 'recharts';

interface DataPoint {
  year: string;  // Can be "2023" or "2023-01-01" format
  value: number;
  ci_lower?: number;
  ci_upper?: number;
  n_actual?: number;
  standard_error?: number;
  date?: string;  // Original date string for display
}

interface DataPointMetadataItem {
  id: string;
  name: string;
  type: string;
  units?: string;
  value_prefix?: Record<string, string>;
  value_suffix?: string;
  categories?: string[];
  var_original?: string;
  label_original?: Record<string, string>;
}

interface TimeSeriesMetadata {
  note?: string;
  type: string;
  title: string;
  subtitle: string;
  source: {
    id: string;
    name: string;
  };
  question?: string;
  years_n?: number;
  year_min?: number;
  year_max?: number;
}

interface TimeSeriesChartProps {
  data: DataPoint[];
  metadata: TimeSeriesMetadata;
  dataPointMetadata: DataPointMetadataItem[];
}

export default function TimeSeriesChart({
  data,
  metadata,
  dataPointMetadata,
}: TimeSeriesChartProps) {
  
  // Extract metadata for "value" field
  const valueMetadata = dataPointMetadata.find((d) => d.id === 'value');

  // Convert date/year strings to timestamps for proper x-axis scaling
  const processedData = data.map((d) => {
    // Try to parse as full date first (e.g., "2023-01-01" or "2023-01")
    const dateAttempt = new Date(d.year);
    const timestamp = !isNaN(dateAttempt.getTime())
      ? dateAttempt.getTime()
      : new Date(`${d.year}-01-01`).getTime(); // Fallback for year-only strings

    return {
      ...d,
      timestamp,
      displayLabel: d.year, // Keep original string for display
    };
  });

  // Determine min and max timestamps for the domain
  const minTimestamp = Math.min(...processedData.map((d) => d.timestamp));
  const maxTimestamp = Math.max(...processedData.map((d) => d.timestamp));

  // Determine if data is yearly or more granular based on data range
  const rangeMs = maxTimestamp - minTimestamp;
  const dayMs = 24 * 60 * 60 * 1000;
  const yearMs = 365 * dayMs;
  const isYearlyData = processedData.length <= 2 || (rangeMs / processedData.length) > (yearMs * 0.5);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0].payload;
    const value = dataPoint.value;
    
    // Helper to format values in tooltip
    const formatValue = (val: number) => {
       if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + 'B';
       if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
       if (val >= 1_000) return (val / 1_000).toFixed(1) + 'k';
       return val.toLocaleString();
    };

    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-4 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
        <p className="font-semibold text-foreground mb-2">{dataPoint.displayLabel}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground text-sm">{valueMetadata?.name || 'Value'}</span>
          <span className="font-mono font-medium text-chart-1">
            {`${formatValue(value)}${valueMetadata?.value_suffix || ''}`}
          </span>
        </div>
        
        {dataPoint.ci_lower && dataPoint.ci_upper && (
          <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
             <div className="flex justify-between gap-2">
               <span>95% CI</span>
               <span className="font-mono">
                 [{formatValue(dataPoint.ci_lower)}, {formatValue(dataPoint.ci_upper)}]
               </span>
             </div>
          </div>
        )}
        
        {dataPoint.n_actual && (
           <div className="mt-1 flex justify-between gap-2 text-xs text-muted-foreground/70">
             <span>Sample Size</span>
             <span className="font-mono">{dataPoint.n_actual.toLocaleString()}</span>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full p-6 bg-card text-card-foreground border border-border rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="mb-6 space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">{metadata.title}</h2>
        <p className="text-sm text-muted-foreground font-medium">{metadata.subtitle}</p>
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="var(--border)" 
              strokeOpacity={0.4}
            />

            <XAxis
              dataKey="timestamp"
              type="number"
              domain={[minTimestamp, maxTimestamp]}
              tickFormatter={(value) => {
                const date = new Date(value);
                if (isYearlyData) {
                  return date.getFullYear().toString();
                }
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
              axisLine={false}
              tickLine={false}
              padding={{ left: 20, right: 20 }}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              dy={10}
            />

            <YAxis
              tickFormatter={(value) => {
                const metadata = dataPointMetadata.find(d => d.id === 'value');
                const prefix = metadata?.value_prefix ?? '';
                const suffix = metadata?.value_suffix ?? '';
                const num = Number(value);
                let formattedValue: string;

                if (num >= 1_000_000_000) formattedValue = (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
                else if (num >= 1_000_000) formattedValue = (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
                else if (num >= 1_000) formattedValue = (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
                else formattedValue = num.toLocaleString();

                return `${prefix}${formattedValue}${suffix}`;
              }}
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              width={45}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />

            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />

            <Line
              key="value-line"
              type="linear"
              dataKey="value"
              stroke="var(--chart-1)"
              strokeWidth={3}
              dot={false}
              activeDot={{ 
                r: 6, 
                fill: "var(--chart-1)", 
                stroke: "var(--background)", 
                strokeWidth: 2,
                className: "animate-pulse"
              }}
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-in-out"
            >
              <ErrorBar
                dataKey={(d: DataPoint) =>
                  d.standard_error ? (1.96 * d.standard_error) : 0
                }
                stroke="var(--foreground)" 
                strokeOpacity={0.3}
                strokeWidth={1}
                width={4}
                name="confidence-intervals"
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 flex items-center justify-end">
          <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
            Source: {metadata.source.name}
          </p>
        </div>
      </div>
    </div>
  );
}
