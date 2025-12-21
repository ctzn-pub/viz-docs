'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Brush } from 'recharts';
import { Button } from "@/viz/ui/button";
import { TrendingUp, TrendingDown, Grid3X3 } from 'lucide-react';
import { useTheme } from 'next-themes';

interface TimeRangeButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

interface DataPoint {
  date: string;
  value: number;
  percentChange: number;
}

interface TimeSeriesProps {
  data: {
    id: string;
    title: string;
    short_title?: string | null;
    units: string;
    observations: Array<{
      date: string;
      value: string;
    }>;
  };
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DataPoint }>;
  label?: string;
}

interface Stats {
  avg: string;
  max: string;
  min: string;
  trend: number;
}

type TimeRangeType = '1Y' | '2Y' | '5Y' | 'MAX';

const TimeRangeButton: React.FC<TimeRangeButtonProps> = ({ active, onClick, children }) => (
  <Button
    variant={active ? 'default' : 'outline'}
    size="sm"
    onClick={onClick}
  >
    {children}
  </Button>
);

const formatValue = (value: number): string => {
  return value.toLocaleString('en-US');
};

const calculatePercentChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

const calculateStats = (data: DataPoint[]): Stats => {
  if (!data.length) return { avg: '0', max: '0', min: '0', trend: 0 };

  const values = data.map((d) => d.value);
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const trend = calculatePercentChange(lastValue, firstValue);

  return {
    avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
    max: Math.max(...values).toFixed(1),
    min: Math.min(...values).toFixed(1),
    trend
  };
};

const recessionPeriods = [
  { start: '2020-02-01', end: '2020-04-01' },
  { start: '2007-12-01', end: '2009-06-01' },
  { start: '2001-03-01', end: '2001-11-01' },
  { start: '1990-07-01', end: '1991-03-01' },
  { start: '1981-07-01', end: '1982-11-01' },
  { start: '1980-01-01', end: '1980-07-01' },
  { start: '1973-11-01', end: '1975-03-01' },
  { start: '1969-12-01', end: '1970-11-01' },
  { start: '1960-04-01', end: '1961-02-01' },
  { start: '1957-08-01', end: '1958-04-01' },
  { start: '1953-07-01', end: '1954-05-01' },
  { start: '1948-11-01', end: '1949-10-01' },
  { start: '1945-02-01', end: '1945-10-01' },
];

const TimeSeries: React.FC<TimeSeriesProps> = ({ data }) => {
  const [showRecessions, setShowRecessions] = useState(true);
  const { theme } = useTheme();

  const processedData = useMemo(() => {
    return data.observations.map((item, index, arr) => {
      const value = parseFloat(item.value);
      const previousValue = index > 0 ? parseFloat(arr[index - 1].value) : value;
      return {
        date: item.date,
        value: value,
        percentChange: calculatePercentChange(value, previousValue)
      };
    });
  }, [data]);

  const filteredData = processedData;
  const stats = calculateStats(filteredData);
  const lastPoint = filteredData[filteredData.length - 1];
  const currentValue = lastPoint?.value || 0;
  const currentTrend = lastPoint?.percentChange || 0;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: '2-digit',
      month: 'short',
    });
  };

  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    const date = new Date(label || '').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
    const value = formatValue(data.value);
    const percentChange = data.percentChange.toFixed(1);
    const isUp = data.percentChange > 0;
    const isDown = data.percentChange < 0;

    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-4 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 pb-2 border-b border-border">{date}</div>
        <div className="space-y-1">
          <div className="text-2xl font-mono font-black text-foreground">{value}</div>
          <div className={`flex items-center gap-1.5 text-xs font-bold ${isUp ? 'text-emerald-500' : isDown ? 'text-red-500' : 'text-muted-foreground'}`}>
            {isUp ? <TrendingUp size={14} strokeWidth={2.5} /> : isDown ? <TrendingDown size={14} strokeWidth={2.5} /> : null}
            <span>{Math.abs(data.percentChange).toFixed(1)}% {isUp ? 'increase' : isDown ? 'decrease' : 'change'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-border pb-6 mb-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tighter uppercase italic text-foreground/90">
            {data.short_title || data.title.split(':')[0]}
          </h3>
          <p className="text-xs font-medium text-muted-foreground max-w-xl">
            {data.title}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 px-4 py-2 bg-muted/30 border border-border/50 rounded-xl">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Latest Value</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-black text-primary tracking-tighter">{formatValue(currentValue)}</span>
            <span className={`text-xs font-bold ${currentTrend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {currentTrend >= 0 ? '+' : ''}{currentTrend.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="h-[400px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 20, right: 10, left: 30, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickFormatter={formatDate}
              minTickGap={40}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            />

            <YAxis
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatValue}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              width={60}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }} />

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
              type="monotone"
              dataKey="value"
              dot={false}
              stroke="var(--chart-1)"
              strokeWidth={3}
              activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--chart-1)' }}
              isAnimationActive={true}
              animationDuration={1500}
            />

            <Brush
              dataKey="date"
              height={30}
              stroke="var(--border)"
              fill="var(--background)"
              tickFormatter={formatDate}
              travellerWidth={8}
              gap={5}
            >
              <LineChart>
                <Line dataKey="value" stroke="var(--chart-1)" strokeWidth={1} dot={false} />
              </LineChart>
            </Brush>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-6 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 border-t border-border pt-6">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-muted/40 rounded-sm" />
          <span>Shaded Areas: US Recessions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Grid3X3 size={12} className="opacity-50" />
          <span>Units: {data.units}</span>
        </div>
        <div className="ml-auto">
          SOURCE: FRED ST. LOUIS FED
        </div>
      </div>
    </div>
  );
};

export default TimeSeries;