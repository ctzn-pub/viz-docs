'use client';

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
import { useTheme } from 'next-themes';

interface DataPoint {
  date: string;
  value: number;
}

interface RecessionPeriod {
  start: string;
  end: string;
}

type TimeRangeType = '1Y' | '2Y' | '5Y' | 'MAX';

export interface DualAxisChartProps {
  /** First data series */
  series1Data: DataPoint[];
  /** Second data series */
  series2Data: DataPoint[];
  /** Name/label for series 1 */
  series1Name: string;
  /** Name/label for series 2 */
  series2Name: string;
  /** Unit label for series 1 (shown on left Y-axis) */
  series1Unit?: string;
  /** Unit label for series 2 (shown on right Y-axis) */
  series2Unit?: string;
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Show recession shading */
  showRecessions?: boolean;
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

const DualAxisChart: React.FC<DualAxisChartProps> = ({
  series1Data,
  series2Data,
  series1Name,
  series2Name,
  series1Unit = '',
  series2Unit = '',
  title = "Dual Axis Chart",
  description,
  showRecessions = true
}) => {
  const [timeRange, setTimeRange] = useState<TimeRangeType>('MAX');
  const { theme } = useTheme();

  const colors = {
    series1: '#4299e1',
    series2: '#f59e0b',
  };

  const filteredData = useMemo(() => {
    if (!series1Data?.length || !series2Data?.length) return [];

    // Use the latest data point as reference (not today's date)
    const latestDate1 = new Date(series1Data[series1Data.length - 1].date);
    const latestDate2 = new Date(series2Data[series2Data.length - 1].date);
    const now = new Date(Math.min(+latestDate1, +latestDate2));

    const ranges: Record<TimeRangeType, () => Date> = {
      '1Y': () => new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      '2Y': () => new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()),
      '5Y': () => new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()),
      'MAX': () => new Date(Math.min(+new Date(series1Data[0].date), +new Date(series2Data[0].date)))
    };
    const startDate = ranges[timeRange]();

    const filteredSeries1 = series1Data.filter(item => new Date(item.date) >= startDate);
    const filteredSeries2 = series2Data.filter(item => new Date(item.date) >= startDate);

    // Merge by matching dates
    const mergedData: Record<string, number | string>[] = [];
    let i = 0, j = 0;

    while (i < filteredSeries1.length && j < filteredSeries2.length) {
      const date1 = new Date(filteredSeries1[i].date);
      const date2 = new Date(filteredSeries2[j].date);

      if (date1.getTime() === date2.getTime()) {
        mergedData.push({
          date: filteredSeries1[i].date,
          [series1Name]: filteredSeries1[i].value,
          [series2Name]: filteredSeries2[j].value,
        });
        i++;
        j++;
      } else if (date1 < date2) {
        i++;
      } else {
        j++;
      }
    }

    return mergedData;
  }, [series1Data, series2Data, series1Name, series2Name, timeRange]);

  const timeRanges: TimeRangeType[] = ['1Y', '2Y', '5Y', 'MAX'];

  const formatDate = (str: string): string => {
    const date = new Date(str);
    if (timeRange === 'MAX') {
      return date.getFullYear().toString();
    }
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const yAxis1Domain = useMemo(() => {
    if (!filteredData.length) return [0, 0];
    const values = filteredData
      .map(item => Number(item[series1Name]))
      .filter((v): v is number => !isNaN(v));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const margin = (max - min) * 0.1;
    return [min - margin, max + margin];
  }, [filteredData, series1Name]);

  const yAxis2Domain = useMemo(() => {
    if (!filteredData.length) return [0, 0];
    const values = filteredData
      .map(item => Number(item[series2Name]))
      .filter((v): v is number => !isNaN(v));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const margin = (max - min) * 0.1;
    return [min - margin, max + margin];
  }, [filteredData, series2Name]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-4 rounded-lg shadow-lg border border-border">
          <p className="font-bold text-foreground">{formatDate(label || '')}</p>
          {payload.map((entry: any) => (
            <p key={entry.dataKey} className="text-sm text-muted-foreground flex items-center">
              <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
              <span className="ml-1 font-medium" style={{ color: entry.color }}>
                {typeof entry.value === 'number'
                  ? `${entry.value.toFixed(1)} ${entry.name === series1Name ? series1Unit : series2Unit}`
                  : 'N/A'}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-background rounded-lg border">
      <div className="flex flex-row items-center justify-between p-6 pb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center space-x-2">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded transition-all ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 pt-0">
        {description && (
          <p className="text-sm text-muted-foreground mb-6">{description}</p>
        )}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 20, right: 60, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <Legend
                verticalAlign="top"
                align="left"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
              />
              <Brush
                dataKey="date"
                height={30}
                stroke="#8884d8"
                tickFormatter={formatDate}
              >
                <LineChart>
                  <Line dataKey={series1Name} stroke={colors.series1} dot={false} />
                  <Line dataKey={series2Name} stroke={colors.series2} dot={false} />
                </LineChart>
              </Brush>
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
                yAxisId="left"
                domain={yAxis1Domain}
                orientation="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
                width={60}
                label={{
                  value: series1Unit,
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: colors.series1, fontSize: 12 }
                }}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <YAxis
                yAxisId="right"
                domain={yAxis2Domain}
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
                width={60}
                label={{
                  value: series2Unit,
                  angle: 90,
                  position: 'insideRight',
                  style: { fill: colors.series2, fontSize: 12 }
                }}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip content={<CustomTooltip />} />
              {showRecessions && recessionPeriods.map((period, index) => (
                <ReferenceArea
                  key={index}
                  x1={period.start}
                  x2={period.end}
                  className="fill-muted"
                  fillOpacity={0.4}
                  ifOverflow="visible"
                />
              ))}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey={series1Name}
                stroke={colors.series1}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: colors.series1 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey={series2Name}
                stroke={colors.series2}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: colors.series2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DualAxisChart;
