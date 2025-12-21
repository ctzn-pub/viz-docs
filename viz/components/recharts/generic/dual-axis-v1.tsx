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
import { Button } from "@/viz/ui/button";
import { Grid3X3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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
  title = "Dual Axis Analysis",
  description,
  showRecessions = true
}) => {
  const [timeRange, setTimeRange] = useState<TimeRangeType>('MAX');
  const { theme } = useTheme();

  const colors = {
    series1: 'var(--chart-1)',
    series2: 'var(--chart-2)',
  };

  const filteredData = useMemo(() => {
    if (!series1Data?.length || !series2Data?.length) return [];

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
    const margin = (max - min) * 0.15;
    return [Math.max(0, min - margin), max + margin];
  }, [filteredData, series1Name]);

  const yAxis2Domain = useMemo(() => {
    if (!filteredData.length) return [0, 0];
    const values = filteredData
      .map(item => Number(item[series2Name]))
      .filter((v): v is number => !isNaN(v));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const margin = (max - min) * 0.15;
    return [Math.max(0, min - margin), max + margin];
  }, [filteredData, series2Name]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-4 min-w-[220px] animate-in fade-in zoom-in-95 duration-200">
          <p className="font-bold text-foreground mb-3 pb-2 border-b border-border">{formatDate(label || '')}</p>
          <div className="space-y-2">
            {payload.map((entry: any) => (
              <div key={entry.dataKey} className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground text-sm font-medium truncate max-w-[120px]">{entry.name}:</span>
                </div>
                <span className="font-mono font-bold text-sm" style={{ color: entry.color }}>
                  {entry.value.toFixed(1)} <span className="text-[10px] opacity-70">{entry.name === series1Name ? series1Unit : series2Unit}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const TimeRangeButtonComponent = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      className={`h-8 px-3 text-xs font-bold transition-all ${active ? 'shadow-sm bg-background border border-border' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {children}
    </Button>
  );

  return (
    <Card className="w-full bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
      <CardHeader className="p-0 mb-6 border-b border-border pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight inline-flex items-center gap-2">
              <Grid3X3 className="text-primary w-5 h-5" /> {title}
            </CardTitle>
            <CardDescription className="text-base">{description || "Comparison of two distinct data series over time."}</CardDescription>
          </div>
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border self-start">
            {timeRanges.map((range) => (
              <TimeRangeButtonComponent
                key={range}
                active={timeRange === range}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </TimeRangeButtonComponent>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="h-[450px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
              <Legend
                verticalAlign="top"
                align="center"
                height={40}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs font-bold text-foreground/80 lowercase tracking-wider ml-1">{value}</span>}
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
                yAxisId="left"
                domain={yAxis1Domain}
                orientation="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: colors.series1, fontSize: 11, fontWeight: 600 }}
                width={50}
                tickFormatter={(value) => value.toFixed(0)}
              />

              <YAxis
                yAxisId="right"
                domain={yAxis2Domain}
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: colors.series2, fontSize: 11, fontWeight: 600 }}
                width={50}
                tickFormatter={(value) => value.toFixed(0)}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />

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
                yAxisId="left"
                type="monotone"
                dataKey={series1Name}
                stroke={colors.series1}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: colors.series1 }}
                isAnimationActive={true}
                animationDuration={1500}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey={series2Name}
                stroke={colors.series2}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: colors.series2 }}
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
              >
                <LineChart>
                  <Line dataKey={series1Name} stroke={colors.series1} strokeWidth={1} dot={false} />
                  <Line dataKey={series2Name} stroke={colors.series2} strokeWidth={1} dot={false} />
                </LineChart>
              </Brush>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>

      <CardFooter className="p-0 flex items-center gap-4 border-t border-border mt-6 pt-6 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-muted/40 rounded-sm" />
          <span>Shaded areas indicate US recessions</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span style={{ color: colors.series1 }}>Axis Left: {series1Unit || 'Units'}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span style={{ color: colors.series2 }}>Axis Right: {series2Unit || 'Units'}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DualAxisChart;
