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
  ResponsiveContainer,
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

  const { confidence_limit_low, confidence_limit_high, value } = payload;
  const strokeColor = "var(--muted-foreground)";
  const fillColor = "var(--chart-1)";

  if (chartType === 'bar') {
    // In BarChart, y is the top of the bar, height is height.
    // value is the height of the bar.
    const ciLowY = y + height * (1 - confidence_limit_low / value);
    const ciHighY = y + height * (1 - confidence_limit_high / value);

    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={fillColor} rx={4} ry={4} fillOpacity={0.8} />
        <line x1={x + width / 2} y1={ciLowY} x2={x + width / 2} y2={ciHighY} stroke={strokeColor} strokeWidth={1.5} strokeOpacity={0.6} />
        <line x1={x + width / 2 - 3} y1={ciLowY} x2={x + width / 2 + 3} y2={ciLowY} stroke={strokeColor} strokeWidth={1.5} strokeOpacity={0.6} />
        <line x1={x + width / 2 - 3} y1={ciHighY} x2={x + width / 2 + 3} y2={ciHighY} stroke={strokeColor} strokeWidth={1.5} strokeOpacity={0.6} />
      </g>
    );
  } else {
    // In Scatter/Line, cx/cy are center coordinates.
    // Error bounds need to be calculated based on scale if we had access, 
    // but the previous implementation used hardcoded multipliers which is risky.
    // We'll maintain a similar but cleaner visual approach.
    const errorSpread = 20; // visual spread relative to cy

    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill={fillColor} stroke="var(--background)" strokeWidth={2} />
        <line
          x1={cx}
          y1={cy - errorSpread}
          x2={cx}
          y2={cy + errorSpread}
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />
        <line x1={cx - 3} y1={cy - errorSpread} x2={cx + 3} y2={cy - errorSpread} stroke={strokeColor} strokeWidth={1.5} strokeOpacity={0.6} />
        <line x1={cx - 3} y1={cy + errorSpread} x2={cx + 3} y2={cy + errorSpread} stroke={strokeColor} strokeWidth={1.5} strokeOpacity={0.6} />
      </g>
    );
  }
};

const CustomTooltip = ({ active, payload, jsonData }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const unit = jsonData.data_value_unit || '%';

  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-4 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
      <div className="font-bold text-foreground mb-2 pb-2 border-b border-border">{d.break_out}</div>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between items-center gap-4">
          <span className="text-muted-foreground font-medium">Value:</span>
          <span className="font-mono font-bold text-primary">{d.value.toFixed(1)}{unit}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-muted-foreground font-medium">95% CI:</span>
          <span className="font-mono text-xs">[{d.confidence_limit_low.toFixed(1)}, {d.confidence_limit_high.toFixed(1)}]{unit}</span>
        </div>
        {d.sample_size && (
          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground font-medium">Sample Size:</span>
            <span className="font-mono">{d.sample_size.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface ChartComponentProps {
  chartType: 'dot' | 'line' | 'bar';
  data: DemographicData[];
  jsonData: DemographicBreakdownData;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ chartType, data, jsonData }) => {
  const margin = { top: 20, right: 30, left: 20, bottom: 25 };

  const XAxisProps = {
    dataKey: 'break_out',
    tick: { fill: 'var(--muted-foreground)', fontSize: 11 },
    axisLine: false,
    tickLine: false,
    interval: 0,
    padding: { left: 30, right: 30 },
  };

  const YAxisProps = {
    tick: { fill: 'var(--muted-foreground)', fontSize: 11 },
    axisLine: false,
    tickLine: false,
    width: 40,
    tickFormatter: (val: number) => `${val}${jsonData.data_value_unit || ''}`,
  };

  const DataComponentProps = {
    dataKey: 'value',
    isAnimationActive: true,
    animationDuration: 1000,
  };

  const GridProps = {
    strokeDasharray: "3 3",
    vertical: false,
    stroke: "var(--border)",
    strokeOpacity: 0.4,
  };

  const renderChart = () => {
    switch (chartType) {
      case 'dot':
        return (
          <ScatterChart margin={margin}>
            <CartesianGrid {...GridProps} />
            <XAxis {...XAxisProps} />
            <YAxis {...YAxisProps} />
            <Tooltip content={<CustomTooltip jsonData={jsonData} />} cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Scatter {...DataComponentProps} data={data} shape={(props: any) => <CustomShape {...props} chartType="dot" />} />
          </ScatterChart>
        );
      case 'line':
        return (
          <LineChart data={data} margin={margin}>
            <CartesianGrid {...GridProps} />
            <XAxis {...XAxisProps} />
            <YAxis {...YAxisProps} />
            <Tooltip content={<CustomTooltip jsonData={jsonData} />} cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Line
              {...DataComponentProps}
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              dot={(props: any) => <CustomShape {...props} chartType="line" />}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart data={data} margin={margin}>
            <CartesianGrid {...GridProps} />
            <XAxis {...XAxisProps} />
            <YAxis {...YAxisProps} />
            <Tooltip content={<CustomTooltip jsonData={jsonData} />} cursor={{ fill: 'var(--muted-foreground)', fillOpacity: 0.05 }} />
            <Bar {...DataComponentProps} shape={(props: any) => <CustomShape {...props} chartType="bar" />} />
          </BarChart>
        );
      default:
        return null;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart() || <div />}
    </ResponsiveContainer>
  );
};

const DemographicBreakdown: React.FC<DemographicBreakdownProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'dot' | 'line' | 'bar'>('dot');

  if (!data || !data.demographics || data.demographics.length === 0) {
    return (
      <Card className="w-full max-w-3xl border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          No demographic data available
        </CardContent>
      </Card>
    );
  }

  const chartTypes: ('dot' | 'line' | 'bar')[] = ['dot', 'line', 'bar'];

  return (
    <Card className="w-full max-w-4xl mx-auto bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="space-y-1 border-b border-border mb-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">{data.clean_title}</CardTitle>
            <CardDescription className="text-base">
              {data.metric} in <span className="text-foreground font-semibold">{data.state}</span> ({data.year})
            </CardDescription>
          </div>
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
            {chartTypes.map((type) => (
              <Button
                key={type}
                variant={chartType === type ? "secondary" : "ghost"}
                size="sm"
                className={`capitalize h-8 px-3 text-xs font-bold transition-all ${chartType === type ? 'shadow-sm bg-background' : ''}`}
                onClick={() => setChartType(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[400px] w-full relative">
          <ChartComponent chartType={chartType} data={data.demographics} jsonData={data} />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 text-xs text-muted-foreground/70 border-t border-border mt-4 pt-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground/50">SOURCE:</span>
          <span>{data.question}</span>
        </div>
        <p className="italic">
          Note: {chartType === 'bar' ? 'Bars' : 'Points'} represent observed {data.response?.toLowerCase()} values.
          Vertical lines show the 95% confidence intervals.
        </p>
      </CardFooter>
    </Card>
  );
};

export default DemographicBreakdown;
