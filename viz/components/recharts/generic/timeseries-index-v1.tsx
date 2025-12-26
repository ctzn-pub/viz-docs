'use client'

import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Legend,
  Brush
} from 'recharts';
import { Button } from "@/viz/ui/button";
import { Grid3X3 } from 'lucide-react';

type TimeRange = '1Y' | '2Y' | '5Y' | 'MAX';

interface DataSeries {
  id: string;
  title: string;
  observation_start: string;
  observation_end: string;
  frequency: string;
  units: string;
  seasonal_adjustment: string;
  observations: Array<{
    realtime_start: string;
    realtime_end: string;
    date: string;
    value: string;
  }>;
}

interface ChartDataPoint {
  date: string;
  [key: string]: number | string | null;
}

interface RecessionPeriod {
  start: string;
  end: string;
}

interface TimeRangeButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

interface IndexChartProps {
  series1: DataSeries;
  series2: DataSeries;
}

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  payload: ChartDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  series1Title: string;
  series2Title: string;
  colors: { series1: string; series2: string };
  formatDateFn: (str: string) => string;
}

interface SeriesComparisonProps {
  series1: DataSeries;
  series2: DataSeries;
  title?: string;
  description?: string;
}

const recessionPeriods: RecessionPeriod[] = [
  { start: "1960-04-01", end: "1961-02-01" },
  { start: "1969-12-01", end: "1970-11-01" },
  { start: "1973-11-01", end: "1975-03-01" },
  { start: "1980-01-01", end: "1980-07-01" },
  { start: "1981-07-01", end: "1982-11-01" },
  { start: "1990-07-01", end: "1991-03-01" },
  { start: "2001-03-01", end: "2001-11-01" },
  { start: "2007-12-01", end: "2009-06-01" },
  { start: "2020-02-01", end: "2020-04-01" }
];

const colors = {
  series1: 'var(--chart-1)',
  series2: 'var(--chart-2)',
};

const TimeRangeButton: React.FC<TimeRangeButtonProps> = ({ active, onClick, children }) => (
  <Button
    variant={active ? "secondary" : "ghost"}
    size="sm"
    onClick={onClick}
    className={`h-8 px-3 text-xs font-bold transition-all ${active ? 'shadow-sm bg-background border border-border' : 'text-muted-foreground hover:text-foreground'}`}
  >
    {children}
  </Button>
);

const CustomTooltip: React.FC<CustomTooltipProps> = React.memo(({
  active,
  payload,
  label,
  series1Title,
  series2Title,
  colors,
  formatDateFn
}) => {
  if (active && payload && payload.length && label) {
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-4 min-w-[220px]">
        <p className="font-bold text-foreground mb-3 pb-2 border-b border-border">{formatDateFn(label)}</p>
        <div className="space-y-2">
          {payload.map((entry) => {
            const color = entry.dataKey === series1Title ? colors.series1 : colors.series2;
            return (
              <div key={entry.dataKey} className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                  <span className="text-muted-foreground text-sm font-medium truncate max-w-[120px]">{entry.dataKey}:</span>
                </div>
                <span className="font-mono font-bold text-sm" style={{ color: color }}>
                  {entry.value >= 0 ? '+' : ''}{entry.value.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

const legendFormatter = (value: string) => (
  <span className="text-xs font-bold text-foreground/80 lowercase tracking-wider ml-1">{value}</span>
);

const IndexChart: React.FC<IndexChartProps> = ({ series1, series2 }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('MAX');
  const [showRecessions] = useState(true);
  const [brushDomain, setBrushDomain] = useState<{ start: number; end: number } | null>(null);

  const formatSeriesData = (series: DataSeries) => {
    return series.observations.map(obs => ({
      date: obs.date,
      value: parseFloat(obs.value)
    }));
  };

  const filteredData = useMemo(() => {
    const series1Data = formatSeriesData(series1);
    const series2Data = formatSeriesData(series2);

    if (!series1Data?.length || !series2Data?.length) return [];

    const latestDate1 = new Date(series1Data[series1Data.length - 1].date);
    const latestDate2 = new Date(series2Data[series2Data.length - 1].date);
    const now = new Date(Math.min(+latestDate1, +latestDate2));
    let startDate: Date;

    const ranges: Record<TimeRange, () => Date> = {
      '1Y': () => new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      '2Y': () => new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()),
      '5Y': () => new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()),
      'MAX': () => new Date(Math.max(+new Date(series1Data[0].date), +new Date(series2Data[0].date)))
    };

    startDate = ranges[timeRange]();

    const filteredSeries1 = series1Data.filter(item => new Date(item.date) >= startDate);
    const filteredSeries2 = series2Data.filter(item => new Date(item.date) >= startDate);

    if (!filteredSeries1.length || !filteredSeries2.length) return [];

    const baseValueSeries1 = filteredSeries1[0].value;
    const baseValueSeries2 = filteredSeries2[0].value;

    const indexedSeries1 = filteredSeries1.map(item => ({
      date: item.date,
      value: ((item.value - baseValueSeries1) / baseValueSeries1) * 100,
    }));

    const indexedSeries2 = filteredSeries2.map(item => ({
      date: item.date,
      value: ((item.value - baseValueSeries2) / baseValueSeries2) * 100,
    }));

    return indexedSeries1.map((item, index) => ({
      date: item.date,
      [series1.title]: item.value,
      [series2.title]: indexedSeries2[index] ? indexedSeries2[index].value : null,
    }));
  }, [series1, series2, timeRange]);

  const timeRanges: TimeRange[] = ['1Y', '2Y', '5Y', 'MAX'];

  const formatDate = useCallback((str: string): string => {
    const date = new Date(str);
    if (timeRange === 'MAX') {
      return date.getFullYear().toString();
    }
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  }, [timeRange]);

  const handleBrushChange = (domain: { startIndex?: number; endIndex?: number } | null) => {
    if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
      setBrushDomain({
        start: domain.startIndex,
        end: domain.endIndex
      });
    }
  };

  const tooltipContent = useCallback((props: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) => (
    <CustomTooltip
      {...props}
      series1Title={series1.title}
      series2Title={series2.title}
      colors={colors}
      formatDateFn={formatDate}
    />
  ), [series1.title, series2.title, formatDate]);

  return (
    <div className="w-full bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 mb-6">
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight inline-flex items-center gap-2">
            <Grid3X3 className="text-primary w-5 h-5" /> Relative Performance Index
          </h3>
          <p className="text-sm text-muted-foreground">Cumulative % change from period start</p>
        </div>
        <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border self-start">
          {timeRanges.map((range) => (
            <TimeRangeButton
              key={range}
              active={timeRange === range}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </TimeRangeButton>
          ))}
        </div>
      </div>

      <div className="h-[500px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />

            <Legend
              verticalAlign="top"
              align="center"
              height={40}
              iconType="circle"
              iconSize={8}
              formatter={legendFormatter}
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickFormatter={formatDate}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              dy={10}
              minTickGap={40}
            />

            <YAxis
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              width={60}
              tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }}
            />

            <Tooltip content={tooltipContent} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />

            {showRecessions && recessionPeriods.map((period, index) => (
              <ReferenceArea
                key={index}
                x1={period.start}
                x2={period.end}
                fill="var(--muted)"
                fillOpacity={0.12}
                ifOverflow="visible"
              />
            ))}

            <Line
              type="linear"
              dataKey={series1.title}
              stroke={colors.series1}
              strokeWidth={1}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: colors.series1 }}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey={series2.title}
              stroke={colors.series2}
              strokeWidth={1}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: colors.series2 }}
              isAnimationActive={false}
            />

            <Brush
              dataKey="date"
              height={30}
              stroke="var(--border)"
              fill="var(--background)"
              tickFormatter={formatDate}
              onChange={handleBrushChange}
              startIndex={brushDomain?.start}
              endIndex={brushDomain?.end}
              travellerWidth={8}
            >
              <LineChart>
                <Line type="linear" dataKey={series1.title} stroke={colors.series1} strokeWidth={1} dot={false} />
                <Line type="linear" dataKey={series2.title} stroke={colors.series2} strokeWidth={1} dot={false} />
              </LineChart>
            </Brush>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 border-t border-border pt-6">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-muted/40 rounded-sm" />
          <span>Shaded periods indicate US recessions</span>
        </div>
        <div className="ml-auto">
          Base period re-indexed to zero at start
        </div>
      </div>
    </div>
  );
};

const SeriesComparison: React.FC<SeriesComparisonProps> = ({
  series1,
  series2,
  description
}) => {
  return (
    <div className="w-full space-y-4">
      <IndexChart
        series1={series1}
        series2={series2}
      />
      {description && (
        <div className="px-4 py-3 bg-muted/20 border border-border/50 rounded-xl">
          <p className="text-sm text-muted-foreground leading-relaxed italic">{description}</p>
        </div>
      )}
    </div>
  );
};

export default SeriesComparison;
