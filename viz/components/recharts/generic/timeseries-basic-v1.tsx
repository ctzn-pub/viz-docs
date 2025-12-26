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
  Brush
} from 'recharts';
import { Button } from "@/viz/ui/button";
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

type TimeRange = '1Y' | '2Y' | '5Y' | 'MAX';

interface DataPoint {
  date: string;
  value: number;
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

interface TimeSeriesBasicProps {
  data: DataPoint[];
  seriesName: string;
  unit?: string;
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

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  seriesName: string;
  unit?: string;
  formatDateFn: (str: string) => string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = React.memo(({
  active,
  payload,
  label,
  seriesName,
  unit,
  formatDateFn
}) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-4 min-w-[200px]">
        <p className="font-bold text-foreground mb-3 pb-2 border-b border-border">{formatDateFn(label || '')}</p>
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--chart-1)]"></span>
            <span className="text-muted-foreground text-sm font-medium">{seriesName}:</span>
          </div>
          <span className="font-mono font-bold text-sm text-[var(--chart-1)]">
            {typeof value === 'number' ? `${value.toLocaleString()}${unit || ''}` : 'N/A'}
          </span>
        </div>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

const TimeSeriesBasic: React.FC<TimeSeriesBasicProps> = ({
  data,
  seriesName,
  unit,
  title = "Time Series",
  description
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('MAX');
  const [showRecessions] = useState(true);

  const filteredData = useMemo(() => {
    if (!data?.length) return [];

    const latestDate = new Date(data[data.length - 1].date);
    let startDate: Date;

    const ranges: Record<TimeRange, () => Date> = {
      '1Y': () => new Date(latestDate.getFullYear() - 1, latestDate.getMonth(), latestDate.getDate()),
      '2Y': () => new Date(latestDate.getFullYear() - 2, latestDate.getMonth(), latestDate.getDate()),
      '5Y': () => new Date(latestDate.getFullYear() - 5, latestDate.getMonth(), latestDate.getDate()),
      'MAX': () => new Date(data[0].date)
    };

    startDate = ranges[timeRange]();

    return data
      .filter(item => new Date(item.date) >= startDate)
      .map(item => ({
        date: item.date,
        [seriesName]: item.value
      }));
  }, [data, seriesName, timeRange]);

  const yAxisDomain = useMemo(() => {
    if (!filteredData.length) return [0, 0];
    const values = filteredData.map(item => Number(item[seriesName])).filter((value): value is number =>
      value !== undefined && !isNaN(value)
    );
    const min = Math.min(...values);
    const max = Math.max(...values);
    const margin = (max - min) * 0.15;
    return [Math.max(0, min - margin), max + margin];
  }, [filteredData, seriesName]);

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

  const tooltipContent = useCallback((props: TooltipProps<ValueType, NameType>) => (
    <CustomTooltip {...props} seriesName={seriesName} unit={unit} formatDateFn={formatDate} />
  ), [seriesName, unit, formatDate]);

  return (
    <div className="w-full bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 mb-6">
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
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

      <div className="h-[450px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickFormatter={formatDate}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              dy={10}
              minTickGap={30}
            />

            <YAxis
              domain={yAxisDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }}
              width={60}
              tickFormatter={(value) => {
                if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
                if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
                if (value >= 1_000) return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
                return value.toFixed(0);
              }}
            />

            <Tooltip content={tooltipContent} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />

            {showRecessions && recessionPeriods.map((period, index) => (
              <ReferenceArea
                key={index}
                x1={period.start}
                x2={period.end}
                fill="var(--muted)"
                fillOpacity={0.15}
                ifOverflow="visible"
              />
            ))}

            <Line
              type="linear"
              dataKey={seriesName}
              stroke="var(--chart-1)"
              strokeWidth={1}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: 'var(--chart-1)' }}
              isAnimationActive={false}
            />

            <Brush
              dataKey="date"
              height={30}
              stroke="var(--border)"
              fill="var(--background)"
              tickFormatter={formatDate}
              travellerWidth={8}
            >
              <LineChart>
                <Line type="linear" dataKey={seriesName} stroke="var(--chart-1)" strokeWidth={1} dot={false} />
              </LineChart>
            </Brush>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-muted/40 rounded-sm" />
          <span>Gray shaded areas represent US recessions</span>
        </div>
      </div>
    </div>
  );
};

export default TimeSeriesBasic;
