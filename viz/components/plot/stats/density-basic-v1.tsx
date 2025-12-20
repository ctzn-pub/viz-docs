'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as Plot from "@observablehq/plot";

interface DensityDataPoint {
  [key: string]: unknown;
}

interface DensityBasicProps {
  data: DensityDataPoint[];
  valueField?: string;
  title?: string;
  subtitle?: string;
  source?: string;
  xlabel?: string;
  width?: number;
  height?: number;
}

const DensityBasic: React.FC<DensityBasicProps> = ({
  data,
  valueField = "MHLTH_AdjPrev",
  title = "Distribution",
  subtitle = "Density plot showing value distribution",
  source = "CDC",
  xlabel = "Value",
  width = 600,
  height = 400
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanData = useMemo(() =>
    data.filter(d => d[valueField] !== undefined && d[valueField] !== null),
    [data, valueField]
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
          { x: valueField, fillOpacity: 0.3, fill: "#3b82f6" }
        )),
        Plot.lineY(cleanData, Plot.binX(
          { y: "count", filter: null },
          { x: valueField, tip: true, stroke: "#3b82f6", strokeWidth: 2 }
        )),
        Plot.ruleY([0])
      ],
      width,
      height,
    });

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [data, cleanData, valueField, title, subtitle, source, xlabel, width, height]);

  return <div ref={containerRef} className="flex justify-center" />;
};

export default DensityBasic;
