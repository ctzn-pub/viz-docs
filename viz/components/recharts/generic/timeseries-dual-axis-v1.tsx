'use client'

import React, { useState } from 'react';
import { Button } from "@/viz/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Legend, Brush } from 'recharts';
import { useTheme } from 'next-themes';
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

const TimeRangeButton: React.FC<TimeRangeButtonProps> = ({ active, onClick, children }) => (
  <Button
    variant={active ? "default" : "ghost"}
    size="sm"
    onClick={onClick}
    className={`transition-all ${active ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-muted'}`}
  >
    {children}
  </Button>
);

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
  series1Unit,
  series2Unit,
  title = "Housing Market Indicators",
  description
}) => {
  const [timeRange, setTimeRange] = useState<TimeRangeType>('MAX');
  const [showRecessions, setShowRecessions] = useState(true); // Added showRecessions state
  const { theme } = useTheme();

  const colors = {
    series1: '#4299e1',
    series2: '#f59e0b',
    recession: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  };

  const filteredData = React.useMemo(() => {
    if (!series1Data?.length || !series2Data?.length) return [];

    // Use the latest data point as reference (not today's date)
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

  const formatDate = (str: string): string => {
    const date = new Date(str);
    if (timeRange === 'MAX') {
      return date.getFullYear().toString();
    }
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const CustomTooltip = ({
    active,
    payload,
    label
  }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-4 rounded-lg shadow-lg border border-border">
          <p className="font-bold text-foreground">{formatDate(label || '')}</p>
          {payload.map((entry) => (
            <p
              key={entry.dataKey}
              className="text-sm text-muted-foreground flex items-center"
            >
              <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
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

  const yAxis1Domain = React.useMemo(() => {
    if (!filteredData.length) return [0, 0];
    const values = filteredData.map(item => Number(item[series1Name])).filter((value): value is number =>
      value !== undefined && !isNaN(value)
    );
    const min = Math.min(...values);
    const max = Math.max(...values);
    const margin = (max - min) * 0.1;
    return [min - margin, max + margin];
  }, [filteredData, series1Name]);

  const yAxis2Domain = React.useMemo(() => {
    if (!filteredData.length) return [0, 0];
    const values = filteredData.map(item => Number(item[series2Name])).filter((value): value is number =>
      value !== undefined && !isNaN(value)
    );
    const min = Math.min(...values);
    const max = Math.max(...values);
    const margin = (max - min) * 0.1;
    return [min - margin, max + margin];
  }, [filteredData, series2Name]);


  return (
    <div className="w-full bg-background shadow-lg rounded-lg border">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
        <h3 className="text-base font-medium">
          {title}
        </h3>
        <div className="flex items-center space-x-2">
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

      <div className="p-6 pt-0">
        {description && (
          <p className="text-sm text-gray-600 mb-6">{description}</p>
        )}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 50, right: 60, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                vertical={false}
              />
              <Legend
                verticalAlign="top"
                align="left"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  paddingBottom: '20px'
                }}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
              <Brush
                dataKey="date"
                height={30}
                stroke="#8884d8"
                fill="#fff"
                tickFormatter={formatDate}
                travellerWidth={10}
                startIndex={0}
                endIndex={filteredData.length - 1}
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
                dx={-10}
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
                dx={10}
                label={{
                  value: series2Unit,
                  angle: 90,
                  position: 'insideRight',
                  style: { fill: colors.series2, fontSize: 12 }
                }}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip
                content={(props: TooltipProps<ValueType, NameType>) => <CustomTooltip {...props} />}
              />
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
