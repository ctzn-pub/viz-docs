'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export interface HistogramProps {
  data: Record<string, unknown>[];
  valueField?: string;
  bins?: number;
  width?: number;
  height?: number;
  xlabel?: string;
  ylabel?: string;
  title?: string;
  color?: string;
  showMean?: boolean;
  showMedian?: boolean;
}

function createHistogram(data: number[], numBins?: number) {
  if (data.length === 0) return [];

  const bins = numBins || Math.ceil(Math.sqrt(data.length));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins || 1;

  const histogram = Array.from({ length: bins }, (_, i) => {
    const binStart = min + i * binWidth;
    const binEnd = min + (i + 1) * binWidth;
    return {
      bin: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
      count: 0,
      binStart,
      binEnd,
      binMid: (binStart + binEnd) / 2
    };
  });

  data.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    if (binIndex >= 0 && binIndex < histogram.length) {
      histogram[binIndex].count++;
    }
  });

  return histogram;
}

export default function HistogramRecharts({
  data,
  valueField = 'MHLTH_AdjPrev',
  bins,
  width,
  height = 500,
  xlabel = 'Value',
  ylabel = 'Frequency',
  title,
  color = 'var(--chart-1)',
  showMean = true,
  showMedian = false
}: HistogramProps) {
  // Extract numeric values from data array
  const numericData = useMemo(() => {
    return data
      .map(d => Number(d[valueField]))
      .filter(v => !isNaN(v) && isFinite(v));
  }, [data, valueField]);

  const histogramData = useMemo(() => {
    return createHistogram(numericData, bins);
  }, [numericData, bins]);

  const statistics = useMemo(() => {
    if (numericData.length === 0) return { mean: 0, median: 0 };

    const mean = numericData.reduce((sum, val) => sum + val, 0) / numericData.length;
    const sorted = [...numericData].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return { mean, median };
  }, [numericData]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { bin: string; count: number; binStart: number; binEnd: number } }[] }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-4 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
          <p className="font-semibold text-foreground mb-2 text-sm">{d.bin}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground text-sm">Count</span>
            <span className="font-mono font-medium text-foreground">{d.count}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground/70 flex justify-between gap-2">
            <span>Range</span>
            <span className="font-mono">[{d.binStart.toFixed(2)}, {d.binEnd.toFixed(2)})</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (numericData.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-xl p-12 text-center bg-card/50">
        <p className="text-muted-foreground">No valid numeric data found for field: {valueField}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
      {title && (
        <div className="mb-6 border-b border-border pb-4">
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        </div>
      )}
      <div className="w-full h-[500px]">
        <ResponsiveContainer width={width || '100%'} height="100%">
          <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }} barSize={50}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
              strokeOpacity={0.4}
            />
            <XAxis
              dataKey="bin"
              label={{
                value: xlabel,
                position: 'insideBottom',
                offset: -15,
                fill: 'var(--muted-foreground)',
                fontSize: 12
              }}
              angle={-45}
              textAnchor="end"
              height={80}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            />
            <YAxis
              label={{
                value: ylabel,
                angle: -90,
                position: 'insideLeft',
                fill: 'var(--muted-foreground)',
                fontSize: 12,
                style: { textAnchor: 'middle' }
              }}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)/0.5' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar
              dataKey="count"
              fill={color}
              name="Frequency"
              radius={[6, 6, 0, 0]}
              isAnimationActive={true}
              animationDuration={1500}
            />

            {showMean && (
              <ReferenceLine
                x={histogramData.find(d =>
                  d.binStart <= statistics.mean && d.binEnd > statistics.mean
                )?.bin}
                stroke="var(--destructive)"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: `Mean: ${statistics.mean.toFixed(2)}`, position: 'top', fill: 'var(--destructive)', fontSize: 12, fontWeight: 500 }}
              />
            )}

            {showMedian && (
              <ReferenceLine
                x={histogramData.find(d =>
                  d.binStart <= statistics.median && d.binEnd > statistics.median
                )?.bin}
                stroke="var(--chart-2)"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: `Median: ${statistics.median.toFixed(2)}`, position: 'bottom', fill: 'var(--chart-2)', fontSize: 12, fontWeight: 500 }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg border border-border/50">
        <span>Total observations: <span className="font-mono text-foreground">{numericData.length}</span></span>
        <div className="flex gap-4">
          <span>Bins: <span className="font-mono text-foreground">{histogramData.length}</span></span>
          <span>Mean: <span className="font-mono text-foreground">{statistics.mean.toFixed(2)}</span></span>
          <span>Median: <span className="font-mono text-foreground">{statistics.median.toFixed(2)}</span></span>
        </div>
      </div>
    </div>
  );
}
