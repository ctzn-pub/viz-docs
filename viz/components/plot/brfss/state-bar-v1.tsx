'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as Plot from '@observablehq/plot';

export interface StateDataPoint {
  state_abbr: string;
  state_name: string;
  value: number;
  confidence_limit_low?: number | null;
  confidence_limit_high?: number | null;
  sample_size?: number;
  year?: number;
}

export interface StateBarChartProps {
  /** Array of state data points */
  data: StateDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart subtitle/description */
  subtitle?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Bar color */
  color?: string;
  /** Value label (e.g., "Crude Prevalence") */
  valueLabel?: string;
  /** Value unit (e.g., "%") */
  valueUnit?: string;
  /** Caption text */
  caption?: string;
  /** Sort order */
  sortDirection?: 'ascending' | 'descending';
  /** Left margin for state names */
  marginLeft?: number;
  /** Show confidence intervals */
  showConfidenceIntervals?: boolean;
  /** Highlight specific states */
  highlightStates?: string[];
}

/**
 * StateBarChart - Horizontal bar chart for state-level BRFSS data
 *
 * Displays state values as horizontal bars with optional confidence intervals.
 * States are sorted by value for easy comparison.
 */
const StateBarChart: React.FC<StateBarChartProps> = ({
  data,
  title,
  subtitle,
  width = 800,
  height = 900,
  color = '#4299e1',
  valueLabel = 'Value',
  valueUnit = '%',
  caption,
  sortDirection = 'descending',
  marginLeft = 110,
  showConfidenceIntervals = true,
  highlightStates = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Filter out US/UW aggregates and sort
    const filteredData = data
      .filter(d => d.state_abbr !== 'US' && d.state_abbr !== 'UW' && d.value != null)
      .sort((a, b) =>
        sortDirection === 'descending'
          ? b.value - a.value
          : a.value - b.value
      );

    const formatValue = (v: number) => `${v.toFixed(1)}${valueUnit}`;

    const chart = Plot.plot({
      title,
      subtitle,
      caption,
      x: {
        label: `${valueLabel} (${valueUnit})`,
        grid: true,
      },
      y: {
        domain: filteredData.map((d) => d.state_name),
        padding: 0.1,
        label: null,
      },
      marks: [
        Plot.barX(filteredData, {
          y: 'state_name',
          x: 'value',
          sort: { y: '-x' },
          fill: (d) => hoveredState === d.state_name
            ? 'currentColor'
            : highlightStates.includes(d.state_abbr)
              ? '#f59e0b'
              : color,
          fillOpacity: (d) => hoveredState === d.state_name ? 1 : 0.7,
          inset: 0.5,
          title: (d) => `${d.state_name}: ${formatValue(d.value)}%`,
        }),
        // Interactive tooltip
        Plot.tip(filteredData, Plot.pointerY({
          y: 'state_name',
          x: 'value',
          title: (d) => {
            let tip = `${d.state_name}: ${formatValue(d.value)}`;
            if (d.confidence_limit_low != null && d.confidence_limit_high != null) {
              tip += `\n95% CI: ${formatValue(d.confidence_limit_low)} - ${formatValue(d.confidence_limit_high)}`;
            }
            if (d.sample_size) {
              tip += `\nSample: ${d.sample_size.toLocaleString()}`;
            }
            return tip;
          },
        })),
        ...(showConfidenceIntervals
          ? [
              Plot.ruleY(filteredData.filter(d => d.confidence_limit_low != null && d.confidence_limit_high != null), {
                x1: 'confidence_limit_low',
                x2: 'confidence_limit_high',
                y: 'state_name',
                stroke: 'currentColor',
                strokeOpacity: 0.5,
                strokeWidth: 2,
              }),
            ]
          : []),
        Plot.ruleX([0]),
        Plot.text(filteredData, {
          y: 'state_name',
          x: 'value',
          text: (d) => formatValue(d.value),
          dx: 5,
          fontSize: 10,
          fill: 'currentColor',
          textAnchor: 'start',
        }),
      ],
      width,
      height,
      marginLeft,
      marginBottom: 50,
      style: {
        background: 'transparent',
        color: 'currentColor',
        fontSize: '12px',
        fontFamily: 'sans-serif',
      },
    });

    containerRef.current.innerHTML = '';
    containerRef.current.append(chart);

    // Add hover interactions
    const bars = containerRef.current.querySelectorAll('rect');
    bars.forEach((bar) => {
      bar.style.cursor = 'pointer';
      bar.addEventListener('mouseenter', (e) => {
        const stateName = (e.target as SVGRectElement).getAttribute('aria-label')?.split(':')[0];
        setHoveredState(stateName || null);
      });
      bar.addEventListener('mouseleave', () => {
        setHoveredState(null);
      });
    });

    return () => {
      chart.remove();
    };
  }, [data, title, subtitle, width, height, color, valueLabel, valueUnit, caption, sortDirection, marginLeft, showConfidenceIntervals, highlightStates, hoveredState]);

  return <div ref={containerRef} />;
};

export default StateBarChart;
