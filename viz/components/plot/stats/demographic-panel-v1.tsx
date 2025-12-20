'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from "@observablehq/plot";

interface DemographicValue {
  value: number | null;
  state_count?: number;
  low_confidence_limit?: number;
  high_confidence_limit?: number;
}

interface DemographicCategory {
  levels: string[];
  values: Record<string, DemographicValue | null>;
}

interface DemographicPanelData {
  clean_title?: string;
  question?: string;
  year?: number;
  data_value_unit?: string;
  overall?: { value: number };
  by_demographic: Record<string, DemographicCategory>;
}

interface DemographicPanelProps {
  data: DemographicPanelData;
  title?: string;
  source?: string;
  width?: number;
  panelHeight?: number;
}

// Auto-format demographic keys: age_group → Age Group
function formatDemographicLabel(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const DemographicPanel: React.FC<DemographicPanelProps> = ({
  data,
  title,
  source = "CDC BRFSS",
  width = 450,
  panelHeight = 250
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data?.by_demographic) return;

    containerRef.current.innerHTML = '';

    const demographics = Object.entries(data.by_demographic)
      .filter(([_, cat]) => cat && cat.levels && cat.values);

    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(2, 1fr)';
    container.style.gap = '24px';

    demographics.forEach(([key, category]) => {
      const chartData = category.levels
        .map(level => {
          const val = category.values[level];
          if (!val || val.value === null) return null;
          return {
            label: level,
            value: val.value,
            low: val.low_confidence_limit ?? val.value * 0.95,
            high: val.high_confidence_limit ?? val.value * 1.05
          };
        })
        .filter(d => d !== null);

      if (chartData.length === 0) return;

      const panelDiv = document.createElement('div');

      const plot = Plot.plot({
        title: formatDemographicLabel(key),
        width,
        height: Math.max(panelHeight, chartData.length * 40 + 80),
        marginLeft: 140,
        marginRight: 40,
        marginTop: 30,
        marginBottom: 40,
        style: {
          backgroundColor: "white",
          fontFamily: "sans-serif",
        },
        x: {
          grid: true,
          label: `Prevalence (${data.data_value_unit || '%'}) →`,
          domain: [0, Math.max(...chartData.map(d => d!.high)) * 1.1]
        },
        y: {
          label: null,
          domain: chartData.map(d => d!.label)
        },
        marks: [
          // Confidence interval lines
          Plot.ruleY(chartData, {
            y: "label",
            x1: "low",
            x2: "high",
            stroke: "#ef4444",
            strokeWidth: 2
          }),
          // Main bars
          Plot.barX(chartData, {
            y: "label",
            x: "value",
            fill: "#1f2937",
            tip: true,
            title: d => `${d.label}: ${d.value.toFixed(1)}%`
          }),
          // CI end caps
          Plot.dot(chartData, {
            y: "label",
            x: "low",
            fill: "#ef4444",
            r: 3
          }),
          Plot.dot(chartData, {
            y: "label",
            x: "high",
            fill: "#ef4444",
            r: 3
          })
        ]
      });

      panelDiv.appendChild(plot);
      container.appendChild(panelDiv);
    });

    // Add title header
    if (title || data.clean_title) {
      const header = document.createElement('div');
      header.style.gridColumn = '1 / -1';
      header.style.marginBottom = '16px';
      header.innerHTML = `
        <h2 style="font-size: 1.25rem; font-weight: 600; margin: 0 0 8px 0;">${title || data.clean_title}</h2>
        ${data.question ? `<p style="color: #6b7280; font-size: 0.875rem; margin: 0;">${data.question}</p>` : ''}
        ${data.year ? `<p style="color: #9ca3af; font-size: 0.75rem; margin: 4px 0 0 0;">Year: ${data.year} • Source: ${source}</p>` : ''}
      `;
      containerRef.current.appendChild(header);
    }

    containerRef.current.appendChild(container);

    return () => {
      container.remove();
    };
  }, [data, title, source, width, panelHeight]);

  return <div ref={containerRef} className="w-full" />;
};

export default DemographicPanel;
