'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as Plot from "@observablehq/plot";

export interface SubcategoryValue {
  value: number;
  confidence_limit_low?: number;
  confidence_limit_high?: number;
  sample_size?: number;
}

export interface SplitBarDataPoint {
  /** Category label (e.g., state name) */
  category: string;
  /** State abbreviation */
  state_abbr?: string;
  /** Overall value shown as bar */
  overall: number;
  /** Nested subcategory values */
  values: Record<string, SubcategoryValue>;
}

export interface SplitBarProps {
  /** Array of data points with category, overall, and nested subcategory values */
  data: SplitBarDataPoint[];
  /** Optional: manually specify which subcategories to display. If omitted, auto-selects the two with largest average difference */
  subcategories?: string[];
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Colors for the subcategories (cycles if fewer colors than subcategories) */
  colors?: string[];
  /** Label for the category axis */
  categoryLabel?: string;
  /** Label for the value axis */
  valueLabel?: string;
  /** Caption text */
  caption?: string;
  /** Sort order for categories */
  sortBy?: 'overall' | 'category' | 'none';
  /** Sort direction */
  sortDirection?: 'ascending' | 'descending';
  /** Left margin for category labels */
  marginLeft?: number;
  /** Show value labels on bars */
  showValueLabels?: boolean;
}

// Default color palette (Tableau 10)
const DEFAULT_COLORS = [
  '#e15759', '#59a14f', '#4e79a7', '#f28e2c', '#b07aa1',
  '#76b7b2', '#ff9da7', '#9c755f', '#bab0ab', '#edc949'
];

/**
 * Find the two subcategories with the largest average difference across all data points
 */
function findMostDivergentPair(data: SplitBarDataPoint[]): [string, string] | null {
  if (data.length === 0 || !data[0].values) return null;

  const subcategoryKeys = Object.keys(data[0].values);
  if (subcategoryKeys.length < 2) return null;

  // Calculate average for each subcategory
  const subcategoryAverages = new Map<string, number>();

  subcategoryKeys.forEach(key => {
    const values = data
      .map(d => d.values?.[key]?.value)
      .filter((v): v is number => v != null);

    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      subcategoryAverages.set(key, avg);
    }
  });

  // Find pair with largest difference
  let maxDiff = 0;
  let selectedPair: [string, string] = [subcategoryKeys[0], subcategoryKeys[1]];

  const keysWithAverages = Array.from(subcategoryAverages.keys());

  for (let i = 0; i < keysWithAverages.length; i++) {
    for (let j = i + 1; j < keysWithAverages.length; j++) {
      const avgI = subcategoryAverages.get(keysWithAverages[i])!;
      const avgJ = subcategoryAverages.get(keysWithAverages[j])!;
      const diff = Math.abs(avgI - avgJ);

      if (diff > maxDiff) {
        maxDiff = diff;
        selectedPair = [keysWithAverages[i], keysWithAverages[j]];
      }
    }
  }

  return selectedPair;
}

/**
 * SplitBar - Horizontal bars with contrasting subgroup dots
 *
 * Displays overall values as horizontal bars with subcategory values
 * overlaid as colored dots. Automatically selects the two subcategories
 * with the largest average difference if not specified.
 */
const SplitBar: React.FC<SplitBarProps> = ({
  data,
  subcategories: manualSubcategories,
  title,
  subtitle,
  width = 800,
  height = 750,
  colors = DEFAULT_COLORS,
  categoryLabel = '',
  valueLabel = '',
  caption = '',
  sortBy = 'overall',
  sortDirection = 'descending',
  marginLeft = 150,
  showValueLabels = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-select subcategories if not provided
  const subcategories = useMemo(() => {
    if (manualSubcategories && manualSubcategories.length > 0) {
      return manualSubcategories;
    }
    const autoSelected = findMostDivergentPair(data);
    return autoSelected || [];
  }, [data, manualSubcategories]);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    if (subcategories.length === 0) {
      console.error('SplitBar: No subcategories available');
      return;
    }

    containerRef.current.innerHTML = '';

    // Sort data
    let sortedData = [...data];
    if (sortBy === 'overall') {
      sortedData.sort((a, b) =>
        sortDirection === 'descending'
          ? b.overall - a.overall
          : a.overall - b.overall
      );
    } else if (sortBy === 'category') {
      sortedData.sort((a, b) =>
        sortDirection === 'descending'
          ? b.category.localeCompare(a.category)
          : a.category.localeCompare(b.category)
      );
    }

    // Prepare dot data from nested values structure
    const dotData = sortedData.flatMap((d) =>
      subcategories.map((subCat) => ({
        category: d.category,
        subcategory: subCat,
        value: d.values?.[subCat]?.value ?? null
      }))
    ).filter((d) => d.value !== null);

    // Calculate value range including all displayed subcategories
    const allValues = sortedData.flatMap((d) => [
      d.overall,
      ...subcategories
        .map((s) => d.values?.[s]?.value)
        .filter((v): v is number => v != null)
    ]);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    const formatValue = (v: number) => `${v.toFixed(1)}%`;

    const plot = Plot.plot({
      caption,
      style: {
        backgroundColor: 'white',
        fontFamily: 'sans-serif'
      },
      color: {
        legend: true,
        domain: subcategories,
        range: subcategories.map((_, i) => colors[i % colors.length])
      },
      marginLeft,
      marginRight: 40,
      marginBottom: 60,
      width,
      height,
      clip: true,
      y: {
        label: categoryLabel,
        domain: sortedData.map((d) => d.category)
      },
      x: {
        label: valueLabel,
        domain: [minValue, maxValue],
        grid: true
      },
      marks: [
        // Background bars for overall values
        Plot.barX(sortedData, {
          y: 'category',
          x: 'overall',
          fill: '#e4e4e4',
          title: (d) => `Overall: ${formatValue(d.overall)}`
        }),
        // Dots for subcategory values
        Plot.dot(dotData, {
          y: 'category',
          x: 'value',
          fill: 'subcategory',
          r: 5,
          tip: true,
          title: (d) => `${d.subcategory}: ${formatValue(d.value!)}`
        }),
        // Value labels on bars
        ...(showValueLabels
          ? [
              Plot.text(sortedData, {
                y: 'category',
                x: 'overall',
                text: (d) => formatValue(d.overall),
                dx: -25,
                fill: 'black',
                fontSize: 9,
                fontWeight: 'normal',
                textAnchor: 'start'
              })
            ]
          : []),
        // Zero reference line
        Plot.ruleX([minValue])
      ]
    });

    containerRef.current.appendChild(plot);

    return () => {
      plot.remove();
    };
  }, [data, subcategories, title, subtitle, width, height, colors, categoryLabel, valueLabel, caption, sortBy, sortDirection, marginLeft, showValueLabels]);

  return (
    <div className="w-full">
      {title && <div className="text-xl font-semibold mb-1">{title}</div>}
      {subtitle && <div className="text-md text-gray-600 mb-2">{subtitle}</div>}
      <div ref={containerRef} />
    </div>
  );
};

export default SplitBar;
