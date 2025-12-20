'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as Plot from '@observablehq/plot';

// Format functions moved outside component to prevent recreation
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
};

const createValueFormatter = (yFormat: string) => (value: number): string => {
  if (yFormat === 'currency') {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value.toFixed(0)}`;
  }
  if (yFormat === 'percent') {
    return `${value.toFixed(1)}%`;
  }
  if (yFormat === 'index') {
    return value.toFixed(0);
  }
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toFixed(1);
};

export interface MultiLineDataPoint {
  [key: string]: string | number | Date;
}

export interface MultiLineProps {
  /** Array of data points */
  data: MultiLineDataPoint[];
  /** Key for x-axis (date field) */
  xKey: string;
  /** Key for y-axis (value field) */
  yKey: string;
  /** Key for grouping/coloring lines */
  groupKey: string;
  /** Optional filter to show only specific groups */
  selectedGroups?: string[];
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Chart caption */
  caption?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Y-axis label */
  yLabel?: string;
  /** Color scheme name */
  colorScheme?: string;
  /** Format function for y-axis values */
  yFormat?: 'currency' | 'percent' | 'number' | 'index';
  /** Show index slider for rebasing values */
  showIndexSlider?: boolean;
}

/**
 * MultiLine - Multi-series line chart for time series data
 *
 * Displays multiple series as colored lines with interactive tooltips.
 * Optional index slider allows rebasing all values to a selected date = 100.
 */
const MultiLine: React.FC<MultiLineProps> = ({
  data,
  xKey,
  yKey,
  groupKey,
  selectedGroups,
  title = 'Time Series',
  subtitle,
  caption,
  width = 800,
  height = 500,
  yLabel = 'Value',
  colorScheme = 'tableau10',
  yFormat = 'number',
  showIndexSlider = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderIndex, setSliderIndex] = useState<number | null>(null);

  // Format data - ensure dates are Date objects and values are numbers
  const formattedData = useMemo(() => {
    let filtered = data;
    if (selectedGroups && selectedGroups.length > 0) {
      filtered = data.filter(d => selectedGroups.includes(String(d[groupKey])));
    }
    return filtered.map(d => ({
      ...d,
      [xKey]: d[xKey] instanceof Date ? d[xKey] : new Date(String(d[xKey])),
      [yKey]: Number(d[yKey]),
    }));
  }, [data, xKey, yKey, groupKey, selectedGroups]);

  // Get unique sorted dates for the slider
  const uniqueDates = useMemo(() => {
    const dates = [...new Set(formattedData.map(d => (d[xKey] as Date).getTime()))];
    return dates.sort((a, b) => a - b).map(t => new Date(t));
  }, [formattedData, xKey]);

  // Find a good initial slider position - use a date near the end where most states have data
  // Simple heuristic: use the last date (most recent data point)
  const defaultIndex = useMemo(() => {
    return Math.max(0, uniqueDates.length - 1);
  }, [uniqueDates.length]);

  // Initialize slider to end position on first render
  useEffect(() => {
    if (sliderIndex === null && uniqueDates.length > 0) {
      setSliderIndex(defaultIndex);
    }
  }, [sliderIndex, uniqueDates.length, defaultIndex]);

  // Get the selected base date for indexing
  const actualSliderIndex = sliderIndex ?? defaultIndex;
  const baseDate = uniqueDates[actualSliderIndex] || uniqueDates[uniqueDates.length - 1];

  // Pre-compute a lookup map for base values by date
  const baseValuesByDate = useMemo(() => {
    const map = new Map<number, Map<string, number>>();
    formattedData.forEach(d => {
      const dateTime = (d[xKey] as Date).getTime();
      const group = String(d[groupKey]);
      const val = d[yKey] as number;
      if (!map.has(dateTime)) {
        map.set(dateTime, new Map());
      }
      if (val && val !== 0) {
        map.get(dateTime)!.set(group, val);
      }
    });
    return map;
  }, [formattedData, xKey, yKey, groupKey]);

  // Calculate indexed data (rebase to selected date = 100)
  const indexedData = useMemo(() => {
    if (!baseDate || yFormat !== 'index') return formattedData;

    const baseDateMs = baseDate.getTime();
    const baseValuesForDate = baseValuesByDate.get(baseDateMs);
    if (!baseValuesForDate || baseValuesForDate.size === 0) return formattedData;

    // Pre-allocate result array
    const result: typeof formattedData = [];
    for (const d of formattedData) {
      const group = String(d[groupKey]);
      const baseValue = baseValuesForDate.get(group);
      if (baseValue) {
        const currentValue = d[yKey] as number;
        result.push({
          ...d,
          [yKey]: (currentValue / baseValue) * 100,
        });
      }
    }
    return result;
  }, [formattedData, baseDate, baseValuesByDate, yKey, groupKey, yFormat]);

  // Memoize the value formatter
  const formatValue = useMemo(() => createValueFormatter(yFormat), [yFormat]);

  useEffect(() => {
    if (!containerRef.current || indexedData.length === 0) return;

    // Get unique groups for display
    const uniqueGroups = [...new Set(indexedData.map(d => String(d[groupKey])))];
    const displayTitle = selectedGroups && selectedGroups.length > 0 && selectedGroups.length <= 5
      ? `${title}: ${selectedGroups.join(', ')}`
      : title;

    const chart = Plot.plot({
      title: displayTitle,
      subtitle: yFormat === 'index' && baseDate
        ? `Indexed to ${formatDate(baseDate)} = 100`
        : subtitle,
      caption,
      width,
      height: height - (showIndexSlider ? 80 : 0),
      marginLeft: 70,
      marginRight: 20,
      marginBottom: 50,
      color: {
        scheme: colorScheme,
        legend: uniqueGroups.length <= 10,
        domain: uniqueGroups,
      },
      x: {
        label: null,
        grid: false,
      },
      y: {
        grid: true,
        label: yFormat === 'index' ? 'Index (base = 100)' : yLabel,
        tickFormat: (x) => formatValue(x as number),
      },
      style: {
        background: 'transparent',
        color: 'currentColor',
        fontSize: '12px',
        fontFamily: 'sans-serif',
      },
      marks: [
        // Reference line at 100 for index charts
        ...(yFormat === 'index' ? [Plot.ruleY([100], { stroke: 'currentColor', strokeOpacity: 0.3, strokeDasharray: '4,4' })] : []),
        // Vertical line at the selected base date
        ...(yFormat === 'index' && baseDate ? [Plot.ruleX([baseDate], { stroke: 'currentColor', strokeOpacity: 0.5, strokeWidth: 2 })] : []),
        Plot.ruleY([0]),
        Plot.lineY(indexedData, {
          x: xKey,
          y: yKey,
          stroke: groupKey,
          strokeWidth: 2,
          curve: 'monotone-x',
        }),
        Plot.dot(indexedData, Plot.pointerX({
          x: xKey,
          y: yKey,
          stroke: groupKey,
          fill: 'white',
          r: 4,
        })),
        Plot.tip(indexedData, Plot.pointerX({
          x: xKey,
          y: yKey,
          stroke: groupKey,
          channels: {
            [groupKey]: groupKey,
            Value: (d) => formatValue(d[yKey] as number),
          },
        })),
      ],
    });

    containerRef.current.innerHTML = '';
    containerRef.current.append(chart);

    return () => {
      chart.remove();
    };
  }, [indexedData, xKey, yKey, groupKey, selectedGroups, title, subtitle, caption, width, height, yLabel, colorScheme, yFormat, showIndexSlider, baseDate]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setSliderIndex(newValue);
  };

  return (
    <div>
      <div ref={containerRef} />
      {showIndexSlider && uniqueDates.length > 0 && (
        <div className="mt-4 px-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDate(uniqueDates[0])}</span>
            <span className="font-medium text-foreground">
              {yFormat === 'index' ? 'Index Base Date: ' : 'Selected: '}
              {baseDate ? formatDate(baseDate) : ''}
            </span>
            <span>{formatDate(uniqueDates[uniqueDates.length - 1])}</span>
          </div>
          <input
            type="range"
            min="0"
            max={uniqueDates.length - 1}
            value={actualSliderIndex}
            onChange={handleSliderChange}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      )}
    </div>
  );
};

export default MultiLine;
