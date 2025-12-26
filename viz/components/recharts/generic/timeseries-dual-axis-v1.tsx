'use client'

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from "@/viz/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Legend, Brush } from 'recharts';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface TimeRangeButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

interface DataPoint {
  date: string;
  value: number;
}

interface RecessionPeriod {
  start: string;
  end: string;
}

interface DualAxisChartProps {
  series1Data: DataPoint[];
  series2Data: DataPoint[];
  series1Name: string;
  series2Name: string;
  series1Unit?: string;
  series2Unit?: string;
  title?: string;
  description?: string;
}

type TimeRangeType = '1Y' | '2Y' | '5Y' | 'MAX';

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  series1Name: string;
  series2Name: string;
  series1Unit?: string;
  series2Unit?: string;
  formatDateFn: (str: string) => string;
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
  recession: 'var(--muted-foreground)'
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
  series1Name,
  series2Name,
  series1Unit,
  series2Unit,
  formatDateFn
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-4 min-w-[220px]">
        <p className="font-bold text-foreground mb-3 pb-2 border-b border-border">{formatDateFn(label || '')}</p>
        <div className="space-y-2">
          {payload.map((entry) => (
            <div key={entry.dataKey} className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span className="text-muted-foreground text-sm font-medium">{entry.name}:</span>
              </div>
              <span className="font-mono font-bold text-sm" style={{ color: entry.color }}>
                {typeof entry.value === 'number'
                  ? `${entry.value.toFixed(1)}${entry.name === series1Name ? (series1Unit || '') : (series2Unit || '')}`
                  : 'N/A'}
              </span>
            </div>
          ))}
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

const DualAxisChart: React.FC<DualAxisChartProps> = ({
  series1Data,
  series2Data,
  series1Name,
  series2Name,
  series1Unit,
  series2Unit,
  title = "Economic Indicators",
  description
}) => {
  const [timeRange, setTimeRange] = useState<TimeRangeType>('MAX');
  const [showRecessions] = useState(true);

  const filteredData = useMemo(() => {
    if (!series1Data?.length || !series2Data?.length) return [];

    const latestDate1 = new Date(series1Data[series1Data.length - 1].date);
    const latestDate2 = new Date(series2Data[series2Data.length - 1].date);
    const now = new Date(Math.min(+latestDate1, +latestDate2));
    let startDate;

    const ranges: { [key in TimeRangeType]: () => Date } = {
      '1Y': () => new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      '2Y': () => new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()),
      '5Y': () => new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()),
      'MAX': () => new Date(Math.min(+new Date(series1Data[0].date), +new Date(series2Data[0].date)))
    };

    startDate = ranges[timeRange]();

    const filteredSeries1 = series1Data.filter(item => new Date(item.date) >= startDate);
    const filteredSeries2 = series2Data.filter(item => new Date(item.date) >= startDate);

    const mergedData = [];
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

  const formatDate = useCallback((str: string): string => {
    const date = new Date(str);
    if (timeRange === 'MAX') {
      return date.getFullYear().toString();
    }
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  }, [timeRange]);

  const yAxis1Domain = useMemo(() => {
    if (!filteredData.length) return [0, 0];
    const values = filteredData.map(item => Number(item[series1Name])).filter((value): value is number =>
      value !== undefined && !isNaN(value)
    );
    const min = Math.min(...values);
    const max = Math.max(...values);
    const margin = (max - min) * 0.15;
    return [Math.max(0, min - margin), max + margin];
  }, [filteredData, series1Name]);

  const yAxis2Domain = useMemo(() => {
    if (!filteredData.length) return [0, 0];
    const values = filteredData.map(item => Number(item[series2Name])).filter((value): value is number =>
      value !== undefined && !isNaN(value)
    );
    const min = Math.min(...values);
    const max = Math.max(...values);
    const margin = (max - min) * 0.15;
    return [Math.max(0, min - margin), max + margin];
  }, [filteredData, series2Name]);

  const tooltipContent = useCallback((props: TooltipProps<ValueType, NameType>) => (
    <CustomTooltip
      {...props}
      series1Name={series1Name}
      series2Name={series2Name}
      series1Unit={series1Unit}
      series2Unit={series2Unit}
      formatDateFn={formatDate}
    />
  ), [series1Name, series2Name, series1Unit, series2Unit, formatDate]);

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
              minTickGap={30}
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
              label={{
                value: series1Unit,
                angle: -90,
                position: 'insideLeft',
                style: { fill: colors.series1, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }
              }}
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
              label={{
                value: series2Unit,
                angle: 90,
                position: 'insideRight',
                style: { fill: colors.series2, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }
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
              yAxisId="left"
              type="linear"
              dataKey={series1Name}
              stroke={colors.series1}
              strokeWidth={1}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: colors.series1 }}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="linear"
              dataKey={series2Name}
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

      <div className="mt-8 flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-muted/40 rounded-sm" />
          <span>Gray shaded areas represent US recessions</span>
        </div>
      </div>
    </div>
  );
};

export default DualAxisChart;
