'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as Plot from "@observablehq/plot";

interface HealthDataPoint {
  OBESITY_AdjPrev: number;
  DIABETES_AdjPrev: number;
  population: number;
  dir2020?: string;
}

interface HealthScatterFacetedProps {
  data: HealthDataPoint[];
  title?: string;
  subtitle?: string;
  source?: string;
  width?: number;
  height?: number;
}

const HealthScatterFaceted: React.FC<HealthScatterFacetedProps> = ({
  data,
  title = "County Health Correlations by Category",
  subtitle = "Faceted by demographic grouping",
  source = "CDC",
  width = 800,
  height = 600
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanData = useMemo(() => data.filter(d => d.dir2020 !== undefined), [data]);

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
      x: {
        label: "Obesity (%)",
        grid: true
      },
      y: {
        label: "Diabetes (%)",
        grid: true
      },
      facet: { data: cleanData, x: "dir2020" },
      marks: [
        Plot.dot(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          r: d => Math.sqrt(d.population) * 0.01,
          stroke: "dir2020",
          fill: "dir2020",
          fillOpacity: 0.3,
          title: d => `Obesity: ${d.OBESITY_AdjPrev}%\nDiabetes: ${d.DIABETES_AdjPrev}%\nPopulation: ${d.population?.toLocaleString()}`,
          tip: true
        }),
        Plot.linearRegressionY(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          stroke: "dir2020",
          strokeWidth: 2
        })
      ],
      color: {
        legend: true,
        scheme: "category10"
      },
      width,
      height
    });

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [data, cleanData, title, subtitle, source, width, height]);

  return <div ref={containerRef} className="flex justify-center" />;
};

export default HealthScatterFaceted;
