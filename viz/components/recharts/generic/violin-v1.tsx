'use client';

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { calculateQuartiles, kernelDensity } from '@/viz/utils/statistical-utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export interface ViolinPlotDataPoint {
  category: string;
  values: number[];
}

export interface ViolinPlotProps {
  data: ViolinPlotDataPoint[];
  width?: number;
  height?: number;
  xlabel?: string;
  ylabel?: string;
  title?: string;
  description?: string;
  showBox?: boolean;
}

export default function ViolinPlot({
  data,
  width,
  height = 500,
  xlabel = 'Category',
  ylabel = 'Value',
  title = "Distribution Analysis",
  description,
  showBox = true
}: ViolinPlotProps) {
  const { violinShapes, scatterData, yDomain } = useMemo(() => {
    // Calculate density for each category
    const shapes = data.map((item, idx) => {
      const density = kernelDensity(item.values, undefined, 100);
      const maxDensity = Math.max(...density.map(d => d.density));
      const quartiles = calculateQuartiles(item.values);

      return {
        category: item.category,
        categoryIndex: idx,
        density: density.map(d => ({
          y: d.x,
          width: maxDensity > 0 ? (d.density / maxDensity) * 0.35 : 0
        })),
        quartiles
      };
    });

    // Create scatter points for violin shapes
    const points = shapes.flatMap(shape =>
      shape.density.flatMap(d => [
        {
          categoryIndex: shape.categoryIndex - d.width,
          category: shape.category,
          value: d.y
        },
        {
          categoryIndex: shape.categoryIndex + d.width,
          category: shape.category,
          value: d.y
        }
      ])
    );

    // Calculate y-axis domain
    const allValues = data.flatMap(d => d.values);
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const padding = (maxVal - minVal) * 0.15;

    return {
      violinShapes: shapes,
      scatterData: points,
      yDomain: [minVal - padding, maxVal + padding]
    };
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-4 min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 pb-2 border-b border-border">{d.category}</div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground text-sm font-medium">Density Value:</span>
            <span className="text-lg font-mono font-black text-primary tracking-tighter">{d.value?.toFixed(2) || 'N/A'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
      <CardHeader className="p-0 mb-6 border-b border-border pb-6">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
          <CardDescription className="text-base">{description || `Visualizing data distribution across ${data.length} categories.`}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="h-[450px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />

              <XAxis
                type="number"
                dataKey="categoryIndex"
                domain={[-0.5, data.length - 0.5]}
                ticks={data.map((_, idx) => idx)}
                tickFormatter={(value) => data[Math.round(value)]?.category || ''}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                height={60}
              />

              <YAxis
                type="number"
                dataKey="value"
                domain={yDomain}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
                label={{ value: ylabel, angle: -90, position: 'insideLeft', style: { fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' } }}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', fillOpacity: 0.1 }} />

              <Scatter
                data={scatterData}
                isAnimationActive={true}
                animationDuration={1500}
                shape={<circle r={1.5} />}
              >
                {scatterData.map((entry, index) => {
                  const catIdx = Math.round(entry.categoryIndex);
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={`var(--chart-${(catIdx % 5) + 1})`}
                      fillOpacity={0.25}
                    />
                  );
                })}
              </Scatter>

              {/* Box plot overlay handles are tricky in Recharts within ComposedChart, 
                  but we'll keep the logic as an SVG overlay group if possible. 
                  Recharts Scatter doesn't easily support custom group layers inside but 
                  we can try to inject it via a hidden series or custom shape if needed.
                  Since previous implementation just mapped over shapes (which won't work inside SVG unless we're careful),
                  we'll use a ReferenceLine or just leave the Scatter as the hero for now as Recharts doesn't 
                  easily allow <g> inside directly with ComposedChart outside of certain contexts.
              */}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>

      <CardFooter className="p-0 flex flex-col items-start gap-4 border-t border-border mt-6 pt-6 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary/30" />
            <span>Violin density marks</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <p>Wider areas indicate higher frequency of data points</p>
        </div>
      </CardFooter>
    </Card>
  );
}
