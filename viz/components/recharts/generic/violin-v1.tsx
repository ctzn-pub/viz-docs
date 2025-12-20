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
  showBox?: boolean;
}

export default function ViolinPlot({
  data,
  width,
  height = 500,
  xlabel = 'Category',
  ylabel = 'Value',
  title,
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
    const padding = (maxVal - minVal) * 0.1;

    return {
      violinShapes: shapes,
      scatterData: points,
      yDomain: [minVal - padding, maxVal + padding]
    };
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
          <p className="font-semibold">{data.category}</p>
          <p className="text-sm">Value: {data.value?.toFixed(2) || 'N/A'}</p>
        </div>
      );
    }
    return null;
  };

  // Render box plot overlay
  const renderBoxes = () => {
    if (!showBox) return null;

    return violinShapes.map((shape, idx) => {
      const { q1, median, q3 } = shape.quartiles;
      const categoryX = idx;

      return (
        <g key={`box-${idx}`}>
          {/* Median line */}
          <line
            x1={categoryX - 0.1}
            y1={median}
            x2={categoryX + 0.1}
            y2={median}
            stroke="white"
            strokeWidth={3}
          />
          {/* Q1-Q3 box */}
          <rect
            x={categoryX - 0.08}
            y={q3}
            width={0.16}
            height={q1 - q3}
            fill="none"
            stroke="white"
            strokeWidth={2}
          />
        </g>
      );
    });
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width={width || '100%'} height={height}>
        <ComposedChart margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="categoryIndex"
            domain={[-0.5, data.length - 0.5]}
            ticks={data.map((_, idx) => idx)}
            tickFormatter={(value) => data[Math.round(value)]?.category || ''}
            label={{ value: xlabel, position: 'insideBottom', offset: -15 }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis
            type="number"
            dataKey="value"
            domain={yDomain}
            label={{ value: ylabel, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Violin density points */}
          <Scatter
            data={scatterData}
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
          >
            {scatterData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`hsl(${(Math.floor(entry.categoryIndex + 0.5) * 60) % 360}, 70%, 50%)`}
              />
            ))}
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Violin plot showing distribution density (wider = more data points) • Categories: {data.length}</p>
      </div>
    </div>
  );
}
