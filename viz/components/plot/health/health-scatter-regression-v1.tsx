'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as Plot from "@observablehq/plot";

interface HealthDataPoint {
  OBESITY_AdjPrev: number;
  DIABETES_AdjPrev: number;
  population: number;
  dir2020?: string;
}

interface HealthScatterRegressionProps {
  data: HealthDataPoint[];
  title?: string;
  subtitle?: string;
  source?: string;
  width?: number;
  height?: number;
}

const HealthScatterRegression: React.FC<HealthScatterRegressionProps> = ({
  data,
  title = "County Health Correlations with Trend",
  subtitle = "Including linear regression line",
  source = "CDC",
  width = 700,
  height = 500
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
      marks: [
        Plot.dot(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          r: d => Math.sqrt(d.population) * 0.008,
          fill: d => d.dir2020,
          fillOpacity: 0.7,
          stroke: "black",
          strokeWidth: 0.5,
          title: d => `Obesity: ${d.OBESITY_AdjPrev}%\nDiabetes: ${d.DIABETES_AdjPrev}%\nPopulation: ${d.population?.toLocaleString()}`
        }),
        Plot.linearRegressionY(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          strokeWidth: 2,
          stroke: "#ff6b35"
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

export default HealthScatterRegression;
