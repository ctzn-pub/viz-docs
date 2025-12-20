'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as Plot from "@observablehq/plot";

interface DensityDataPoint {
  OBESITY_AdjPrev?: number;
  DIABETES_AdjPrev?: number;
  dir2020?: string;
  [key: string]: unknown;
}

interface DensityOverlayProps {
  data: DensityDataPoint[];
  valueField?: string;
  groupField?: string;
  title?: string;
  subtitle?: string;
  source?: string;
  xlabel?: string;
  width?: number;
  height?: number;
}

const DensityOverlay: React.FC<DensityOverlayProps> = ({
  data,
  valueField = "OBESITY_AdjPrev",
  groupField = "dir2020",
  title = "Distribution by Category",
  subtitle = "Overlaid density plots by demographic grouping",
  source = "CDC",
  xlabel = "Value (%)",
  width = 600,
  height = 400
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanData = useMemo(() =>
    data.filter(d => d[groupField] !== undefined && d[valueField] !== undefined),
    [data, groupField, valueField]
  );

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    containerRef.current.innerHTML = '';

    const plot = Plot.plot({
      title,
      subtitle,
      caption: `Source: ${source}`,
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      y: { grid: true, label: "Count" },
      x: { label: xlabel },
      marks: [
        Plot.areaY(cleanData, Plot.binX(
          { y: "count", filter: null },
          { x: valueField, fill: groupField, fillOpacity: 0.2 }
        )),
        Plot.lineY(cleanData, Plot.binX(
          { y: "count", filter: null },
          { x: valueField, stroke: groupField, tip: true, strokeWidth: 2 }
        )),
        Plot.ruleY([0])
      ],
      color: {
        legend: true,
        scheme: "category10"
      },
      width,
      height,
    });

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [data, cleanData, valueField, groupField, title, subtitle, source, xlabel, width, height]);

  return <div ref={containerRef} className="flex justify-center" />;
};

export default DensityOverlay;
