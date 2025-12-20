'use client'

import React, { useState, useMemo } from 'react';
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
import { useTheme } from 'next-themes';

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

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    payload: ChartDataPoint;
  }>;
  label?: string;
}

interface SeriesComparisonProps {
  series1: DataSeries;
  series2: DataSeries;
  title?: string;
  description?: string;
}

const TimeRangeButton: React.FC<TimeRangeButtonProps> = ({ active, onClick, children }) => (
  <Button
    variant={active ? "default" : "ghost"}
    size="sm"
    onClick={onClick}
    className={`transition-all ${active ? 'bg-blue-500 text-white hover:bg-blue-600' : 'hover:bg-gray-100'}`}
  >
    {children}
  </Button>
);

const IndexChart: React.FC<IndexChartProps> = ({ series1, series2 }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('MAX');
  const [showRecessions, setShowRecessions] = useState(true);
  const [brushDomain, setBrushDomain] = useState<{ start: number; end: number } | null>(null);
  const { theme } = useTheme();

  const colors = {
    series1: '#4299e1', // original blue
    series2: '#f59e0b', // original amber
  };

  console.log('series1:', series1);
  console.log('series2:', series2);

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

    // Use the latest data point as reference (not today's date)
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

  const formatDate = (str: string): string => {
    const date = new Date(str);
    if (timeRange === 'MAX') {
      return date.getFullYear().toString();
    }
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const handleBrushChange = (domain: any) => {
    if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
      setBrushDomain({
        start: domain.startIndex,
        end: domain.endIndex
      });
    }
  };

  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length && label) {
      return (
        <div className="bg-background p-4 rounded-lg shadow-lg border border-border">
          <p className="font-bold text-foreground">{formatDate(label)}</p>
          {payload.map((entry) => {
            const color = entry.dataKey === series1.title ? colors.series1 : colors.series2;
            return (
              <div key={entry.dataKey} className="mt-1">
                <p className="text-sm text-muted-foreground flex items-center">
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color }}></span>
                  <span>{entry.dataKey}:</span>
                  <span className="ml-1 font-medium" style={{ color }}>
                    {entry.value.toFixed(2)}%
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-background shadow-lg rounded-lg border">
      <div className="pb-0 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start space-y-4 md:space-y-0 md:space-x-4">
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              Index Chart
            </h3>
            <div className="text-gray-600 text-sm mt-2">
              {series1.title} vs {series2.title}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex space-x-2">
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
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 30, right: 30, left: 0, bottom: 20 }}
            >
              <Legend 
                verticalAlign="top"
                align="left"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  paddingBottom: '60px'
                }}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tickFormatter={formatDate}
                tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
                dy={10}
                minTickGap={5}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
                width={60}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              {showRecessions && recessionPeriods.map((period, index) => (
                <ReferenceArea
                  key={index}
                  x1={period.start}
                  x2={period.end}
                  className="fill-muted"
                  fillOpacity={0.4}
                  alwaysShow={true}
                  ifOverflow="visible"
                />
              ))}
              <Line
                type="monotone"
                dataKey={series1.title}
                stroke={colors.series1}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: colors.series1 }}
              />
              <Line
                type="monotone"
                dataKey={series2.title}
                stroke={colors.series2}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: colors.series2 }}
              />
              <Brush
                dataKey="date"
                height={40}
                stroke="#8884d8"
                tickFormatter={formatDate}
                onChange={handleBrushChange}
                startIndex={brushDomain?.start}
                endIndex={brushDomain?.end}
              >
                <LineChart>
                  <Line
                    type="monotone"
                    dataKey={series1.title}
                    stroke={colors.series1}
                    strokeWidth={1}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={series2.title}
                    stroke={colors.series2}
                    strokeWidth={1}
                    dot={false}
                  />
                </LineChart>
              </Brush>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const SeriesComparison: React.FC<SeriesComparisonProps> = ({ 
  series1, 
  series2, 
  title = "Series Comparison",
  description 
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <IndexChart
        series1={series1}
        series2={series2}
      />
      {description && (
        <div className="mt-4 text-sm text-gray-600">
          <p>{description}</p>
        </div>
      )}
    </div>
  );
};

export default SeriesComparison;