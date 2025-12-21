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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface DataPoint {
  year: string;
  value: number;
  ci_lower?: number;
  ci_upper?: number;
  n_actual?: number;
  standard_error?: number;
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


  // Convert year to a numerical value
  const numericData = data.map((d) => ({
    ...d,
    year: parseInt(d.year, 10), // Convert year to number
  }));

  // Extract metadata for "value" field
  const valueMetadata = dataPointMetadata.find((d) => d.id === 'value');

  // Check for duplicate years
  const dataYears = numericData.map((d) => d.year);
  const uniqueYears = new Set(dataYears);

  if (dataYears.length !== uniqueYears.size) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-6 text-center text-destructive font-medium">
          Error: Duplicate years detected in the dataset.
        </CardContent>
      </Card>
    );
  }

  // Determine min and max years for the domain
  const minYear = Math.min(...numericData.map((d) => d.year));
  const maxYear = Math.max(...numericData.map((d) => d.year));


  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0].payload;
    const suffix = valueMetadata?.value_suffix || '';

    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-4 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 pb-2 border-b border-border">Year {label}</div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground text-sm font-medium">{valueMetadata?.name || 'Value'}:</span>
            <span className="text-lg font-mono font-black text-primary tracking-tighter">{dataPoint.value.toFixed(1)}{suffix}</span>
          </div>
          {dataPoint.ci_lower && dataPoint.ci_upper && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground text-xs font-medium">95% CI:</span>
              <span className="text-xs font-mono font-bold text-foreground">[{dataPoint.ci_lower.toFixed(1)}, {dataPoint.ci_upper.toFixed(1)}]{suffix}</span>
            </div>
          )}
          {dataPoint.n_actual && (
            <div className="flex justify-between items-center gap-4 border-t border-border mt-2 pt-2">
              <span className="text-muted-foreground text-xs font-medium">Sample Size:</span>
              <span className="text-xs font-mono font-bold text-foreground">{dataPoint.n_actual.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
      <CardHeader className="p-0 mb-6 border-b border-border pb-6">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">{metadata.title}</CardTitle>
          <CardDescription className="text-base">{metadata.subtitle}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-[400px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={numericData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />

            <XAxis
              dataKey="year"
              type="number"
              domain={[minYear, maxYear]}
              tickCount={Math.min(maxYear - minYear + 1, 10)}
              tickFormatter={(value) => value.toString()}
              padding={{ left: 20, right: 20 }}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tickFormatter={(value) => {
                const metadata = dataPointMetadata.find(d => d.id === 'value');
                const prefix = (typeof metadata?.value_prefix === 'string') ? metadata.value_prefix : '';
                const suffix = (typeof metadata?.value_suffix === 'string') ? metadata.value_suffix : '';
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
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />

            <Line
              key="value-line"
              type="monotone"
              dataKey="value"
              stroke="var(--chart-1)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--chart-1)", strokeWidth: 2, stroke: 'var(--background)' }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "var(--chart-1)" }}
              isAnimationActive={true}
              animationDuration={1500}
            >
              <ErrorBar
                dataKey={(d: DataPoint) =>
                  d.standard_error ? (1.96 * d.standard_error) : 0
                }
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
                strokeOpacity={0.6}
                width={6}
                name="confidence-intervals"
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </CardContent>

      <CardFooter className="p-0 flex flex-col items-start gap-4 border-t border-border mt-6 pt-6 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
        <div className="flex items-center gap-2">
          <span>SOURCE: {metadata.source.name}</span>
          {metadata.note && (
            <>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span className="normal-case font-medium italic opacity-80">{metadata.note}</span>
            </>
          )}
        </div>
        {metadata.question && (
          <div className="flex items-start gap-2 max-w-2xl text-[9px] leading-relaxed opacity-60 normal-case font-medium">
            <span className="flex-shrink-0">QUESTION:</span>
            <span>{metadata.question}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
