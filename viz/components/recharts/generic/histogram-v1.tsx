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
  color = 'hsl(var(--primary))',
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
        <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
          <p className="font-semibold">{d.bin}</p>
          <p className="text-sm">Count: {d.count}</p>
          <p className="text-xs text-muted-foreground">
            Range: [{d.binStart.toFixed(2)}, {d.binEnd.toFixed(2)})
          </p>
        </div>
      );
    }
    return null;
  };

  if (numericData.length === 0) {
    return (
      <div className="w-full p-4 text-center text-muted-foreground">
        No valid numeric data found for field: {valueField}
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width={width || '100%'} height={height}>
        <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="bin"
            label={{ value: xlabel, position: 'insideBottom', offset: -10 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis label={{ value: ylabel, angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="count" fill={color} name="Frequency" />

          {showMean && (
            <ReferenceLine
              x={histogramData.find(d =>
                d.binStart <= statistics.mean && d.binEnd > statistics.mean
              )?.bin}
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: `Mean: ${statistics.mean.toFixed(2)}`, position: 'top', fill: 'hsl(var(--destructive))' }}
            />
          )}

          {showMedian && (
            <ReferenceLine
              x={histogramData.find(d =>
                d.binStart <= statistics.median && d.binEnd > statistics.median
              )?.bin}
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: `Median: ${statistics.median.toFixed(2)}`, position: 'bottom', fill: 'hsl(var(--chart-2))' }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Total observations: {numericData.length} • Bins: {histogramData.length} • Mean: {statistics.mean.toFixed(2)} • Median: {statistics.median.toFixed(2)}</p>
      </div>
    </div>
  );
}
