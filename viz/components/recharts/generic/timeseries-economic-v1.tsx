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
  return ((current - previous) / previous) * 100;
};

const calculateYearOverYear = (data: DataPoint[]): number | null => {
  if (data.length < 12) return null;
  const current = data[data.length - 1].value;
  const yearAgo = data[data.length - 12].value;
  return calculatePercentChange(current, yearAgo);
};

const calculate3MonthAverage = (data: DataPoint[]): string | null => {
  if (data.length < 3) return null;
  const last3Months = data.slice(-3);
  const average = last3Months.reduce((sum, point) => sum + point.value, 0) / 3;
  return average.toFixed(1);
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
  const currentValue = filteredData[filteredData.length - 1]?.value || 0;

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
    const color =
      data.percentChange > 0
        ? 'text-green-500'
        : data.percentChange < 0
        ? 'text-red-500'
        : 'text-gray-500';

    return (
      <div className="bg-popover/80 backdrop-blur p-2 rounded-lg border shadow-lg">
        <div className="text-sm font-medium">{date}</div>
        <div className="text-lg font-bold">{value}</div>
        <div className={`text-sm ${color}`}>
          {percentChange}% from previous
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-background shadow-lg rounded-lg border">
      <div className="pb-4 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start space-y-4 md:space-y-0 md:space-x-4">
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              {data.short_title || data.title.split(':')[0]}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {data.title}
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 50, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                minTickGap={30}
                tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={formatValue}
                tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                dot={false}
                stroke="#4299e1"
                strokeWidth={2}
              />
              <Brush
                dataKey="date"
                height={30}
                stroke={theme === 'dark' ? '#6366f1' : '#8884d8'}
                fill={theme === 'dark' ? '#1f2937' : '#f3f4f6'}
                tickFormatter={formatDate}
                travellerWidth={10}
              >
                <LineChart>
                  <Line dataKey="value" stroke="#4299e1" dot={false} />
                </LineChart>
              </Brush>
              {showRecessions && recessionPeriods.map((period, index) => (
                <ReferenceArea
                  key={index}
                  x1={period.start}
                  x2={period.end}
                  fill="currentColor"
                  fillOpacity={0.1}
                  strokeOpacity={0}
                />
              ))}
            </LineChart>

          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TimeSeries;