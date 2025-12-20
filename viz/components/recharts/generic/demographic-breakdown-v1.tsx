'use client';

import React, { useState } from 'react';
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DemographicData {
  break_out_category: string;
  break_out: string;
  value: number;
  confidence_limit_low: number;
  confidence_limit_high: number;
  sample_size: number;
  year: number;
  us_median: number;
}

interface CustomShapeProps {
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  width?: number;
  height?: number;
  payload: {
    value: number;
    confidence_limit_low: number;
    confidence_limit_high: number;
  };
  chartType: 'dot' | 'line' | 'bar';
}

export interface DemographicBreakdownData {
  metric?: string;
  clean_title?: string;
  topic?: string;
  question?: string;
  response?: string;
  data_value_type?: string;
  data_value_unit?: string;
  year?: number;
  state?: string;
  demographics: DemographicData[];
}

export interface DemographicBreakdownProps {
  data: DemographicBreakdownData;
}

const CustomShape: React.FC<CustomShapeProps> = ({
  x = 0,
  y = 0,
  cx = 0,
  cy = 0,
  width = 0,
  height = 0,
  payload,
  chartType,
}) => {
  if (!payload) return null;

  const { confidence_limit_low, confidence_limit_high } = payload;

  if (chartType === 'bar') {
    const ciLowY = y + height * (1 - confidence_limit_low / payload.value);
    const ciHighY = y + height * (1 - confidence_limit_high / payload.value);

    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill="currentColor" />
        <line x1={x + width / 2} y1={ciLowY} x2={x + width / 2} y2={ciHighY} stroke="grey" strokeWidth={2} />
        <line x1={x + width / 2 - 4} y1={ciLowY} x2={x + width / 2 + 4} y2={ciLowY} stroke="grey" strokeWidth={2} />
        <line x1={x + width / 2 - 4} y1={ciHighY} x2={x + width / 2 + 4} y2={ciHighY} stroke="grey" strokeWidth={2} />
      </g>
    );
  } else {
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill="currentColor" />
        <line
          x1={cx}
          y1={cy - (payload.value - confidence_limit_low) * 4}
          x2={cx}
          y2={cy + (confidence_limit_high - payload.value) * 4}
          stroke="grey"
          strokeWidth={2}
        />
        <line
          x1={cx - 4}
          y1={cy - (payload.value - confidence_limit_low) * 4}
          x2={cx + 4}
          y2={cy - (payload.value - confidence_limit_low) * 4}
          stroke="grey"
          strokeWidth={2}
        />
        <line
          x1={cx - 4}
          y1={cy + (confidence_limit_high - payload.value) * 4}
          x2={cx + 4}
          y2={cy + (confidence_limit_high - payload.value) * 4}
          stroke="grey"
          strokeWidth={2}
        />
      </g>
    );
  }
};

interface ChartComponentProps {
  chartType: 'dot' | 'line' | 'bar';
  data: DemographicData[];
  jsonData: DemographicBreakdownData;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ chartType, data, jsonData }) => {
  const CommonProps = {
    width: 600,
    height: 400,
    data: data,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    className: 'w-full h-full',
  };

  const XAxisProps = {
    dataKey: 'break_out',
    label: { value: data[0]?.break_out_category || '', position: 'insideBottom' as const, offset: -5 },
    tick: { fill: 'currentColor' },
    padding: { left: 30, right: 30 },
  };

  const YAxisProps = {
    label: {
      value: `${jsonData.clean_title || 'Value'} (${jsonData.data_value_unit || '%'})`,
      angle: -90,
      position: 'insideLeft' as const,
    },
    tick: { fill: 'currentColor' },
  };

  const TooltipProps = {
    contentStyle: {
      backgroundColor: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
    },
  };

  const DataComponentProps = {
    type: 'monotone' as const,
    dataKey: 'value',
    stroke: 'currentColor',
    fill: 'currentColor',
    isAnimationActive: false,
  };

  switch (chartType) {
    case 'dot':
      return (
        <ScatterChart {...CommonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis {...XAxisProps} />
          <YAxis {...YAxisProps} />
          <Tooltip {...TooltipProps} />
          <Scatter {...DataComponentProps} shape={({ key, ...props }: any) => <CustomShape key={key} {...props} chartType="dot" />} />
        </ScatterChart>
      );
    case 'line':
      return (
        <LineChart {...CommonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis {...XAxisProps} />
          <YAxis {...YAxisProps} />
          <Tooltip {...TooltipProps} />
          <Line {...DataComponentProps} dot={({ key, ...props }: any) => <CustomShape key={key} {...props} chartType="line" />} />
        </LineChart>
      );
    case 'bar':
      return (
        <BarChart {...CommonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis {...XAxisProps} />
          <YAxis {...YAxisProps} />
          <Tooltip {...TooltipProps} />
          <Bar {...DataComponentProps} shape={({ key, ...props }: any) => <CustomShape key={key} {...props} chartType="bar" />} />
        </BarChart>
      );
    default:
      return null;
  }
};

const DemographicBreakdown: React.FC<DemographicBreakdownProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'dot' | 'line' | 'bar'>('dot');

  if (!data || !data.demographics || data.demographics.length === 0) {
    return <div className="text-muted-foreground">No demographic data available</div>;
  }

  const toggleChartType = () => {
    const types: ('dot' | 'line' | 'bar')[] = ['dot', 'line', 'bar'];
    const currentIndex = types.indexOf(chartType);
    setChartType(types[(currentIndex + 1) % types.length]);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{data.clean_title}</CardTitle>
        <CardDescription>
          {data.metric} for {data.state} ({data.year})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button onClick={toggleChartType}>
            Switch to {chartType === 'dot' ? 'Line' : chartType === 'line' ? 'Bar' : 'Dot'} Chart
          </Button>
        </div>
        <div className="h-[400px] w-full">
          <ChartComponent chartType={chartType} data={data.demographics} jsonData={data} />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start text-sm text-muted-foreground">
        <p>Data source: {data.question}</p>
        <p>
          Note: {chartType === 'bar' ? 'Bars' : 'Points'} represent {data.response?.toLowerCase()} with 95% confidence
          intervals.
        </p>
      </CardFooter>
    </Card>
  );
};

export default DemographicBreakdown;
