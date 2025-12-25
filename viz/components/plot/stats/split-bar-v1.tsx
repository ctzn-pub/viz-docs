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
  colors = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
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
        value: d.values?.[subCat]?.value ?? null,
        overall: d.overall
      }))
    ).filter((d) => d.value !== null);

    // Calculate value range including all displayed subcategories
    const allValues = sortedData.flatMap((d) => [
      d.overall,
      ...subcategories
        .map((s) => d.values?.[s]?.value)
        .filter((v): v is number => v != null)
    ]);
    const maxValue = Math.max(...allValues);

    const formatValue = (v: number) => `${v.toFixed(1)}%`;

    const plot = Plot.plot({
      // caption, // Moved to React
      style: {
        backgroundColor: 'transparent',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: '#374151'
      },
      color: {
        legend: false, // Moved to React
        domain: subcategories,
        range: colors
      },
      marginLeft,
      marginRight: 60,
      marginBottom: 50, // Increased to prevent label cutoff
      width,
      height,
      clip: false,
      y: {
        label: categoryLabel,
        domain: sortedData.map((d) => d.category),
        tickSize: 0,
        padding: 0.4
      },
      x: {
        label: valueLabel,
        domain: [0, Math.max(maxValue, 100)],
        grid: true,
        nice: true,
        labelOffset: 45
      },
      marks: [
        // Grid lines
        Plot.gridX({ stroke: '#e5e7eb', strokeOpacity: 0.5 }),

        // Background bars for overall values
        Plot.barX(sortedData, {
          y: 'category',
          x: 'overall',
          fill: '#f3f4f6',
          rx: 4,
        }),

        // Dots for subcategory values
        Plot.dot(dotData, {
          y: 'category',
          x: 'value',
          fill: 'subcategory',
          stroke: 'white',
          strokeWidth: 2,
          r: 6,
        }),

        // Value labels on bars
        ...(showValueLabels
          ? [
            Plot.text(sortedData, {
              y: 'category',
              x: 'overall',
              text: (d) => formatValue(d.overall),
              dx: 8,
              fill: '#6b7280',
              fontSize: 11,
              fontWeight: 500,
              textAnchor: 'start'
            })
          ]
          : []),

        // Zero reference line
        Plot.ruleX([0], { stroke: '#9ca3af', strokeWidth: 1.5 }),

        // Shared Tooltip (Moved to end for z-index)
        Plot.tip(sortedData, Plot.pointerY({
          x: "overall",
          y: "category",
          title: (d) => {
            const subValues = subcategories
              .map(s => {
                const val = d.values?.[s]?.value;
                return val != null ? `${s}: ${formatValue(val)}` : null;
              })
              .filter(Boolean)
              .join('\n');
            return `${d.category}\nOverall: ${formatValue(d.overall)}\n${subValues}`;
          }
        }))
      ]
    });

    containerRef.current.appendChild(plot);

    return () => {
      plot.remove();
    };
  }, [data, subcategories, title, subtitle, width, height, colors, categoryLabel, valueLabel, caption, sortBy, sortDirection, marginLeft, showValueLabels]);

  return (
    <div className="w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      {/* Title & Subtitle */}
      {(title || subtitle) && (
        <div className="mb-2">
          {title && <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">{title}</h2>}
          {subtitle && <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">{subtitle}</p>}
        </div>
      )}

      {/* Custom Legend */}
      <div className="flex flex-wrap items-center gap-6 mb-4">
        {subcategories.map((sub, i) => (
          <div key={sub} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-sm font-medium text-gray-700">{sub}</span>
          </div>
        ))}
        {/* Overall Legend Item */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
          <span className="text-sm font-medium text-gray-500">Overall</span>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={containerRef} className="overflow-visible" />

      {/* Custom Caption */}
      {caption && (
        <div className="mt-6 pt-4 border-t border-gray-50 text-xs text-gray-400 italic">
          {caption}
        </div>
      )}
    </div>
  );
};

export default SplitBar;
