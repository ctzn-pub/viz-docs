'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from "@observablehq/plot";

interface CorrelationDataPoint {
  x: string;
  y: string;
  value: number;
}

interface CorrelationHeatmapProps {
  data: CorrelationDataPoint[];
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
  source?: string;
}

const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  data,
  width = 600,
  height = 600,
  title = "County Health Correlations",
  subtitle = "Focus on variables focused on adjusted prevalence",
  source = "CDC"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    containerRef.current.innerHTML = '';

    // Extract unique variables and create lower triangle matrix
    const variables = [...new Set(data.map(d => d.x))];
    const convertedData = data.filter(d => variables.indexOf(d.y) > variables.indexOf(d.x));

    // Clean variable names for display
    const cleanVariableName = (name: string) => {
      return name.replace('_AdjPrev', '').replace('_', ' ').toUpperCase();
    };

    // Create domains with cleaned names
    const xDomain = [...new Set(convertedData.map(d => d.x))];
    const yDomain = [...new Set(convertedData.map(d => d.y))].reverse();

    const plot = Plot.plot({
      title,
      subtitle,
      caption: `Source: ${source}`,
      padding: 0,
      marginLeft: 120,
      marginTop: 120,
      marginRight: 60,
      marginBottom: 60,
      grid: true,
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      x: {
        axis: "top",
        label: "",
        domain: xDomain,
        tickRotate: -45,
        tickFormat: cleanVariableName,
      },
      y: {
        label: "",
        domain: yDomain,
        tickFormat: cleanVariableName,
      },
      color: {
        type: "linear",
        scheme: "RdBu",
        domain: [-1, 1],
        legend: true,
        label: "Correlation coefficient",
      },
      marks: [
        Plot.cell(convertedData, {
          x: "x",
          y: "y",
          fill: "value",
          inset: 0.5,
          tip: true,
          title: d => `${cleanVariableName(d.x)} vs ${cleanVariableName(d.y)}: ${d.value.toFixed(3)}`
        }),
        Plot.text(convertedData, {
          x: "x",
          y: "y",
          text: d => d.value.toFixed(2),
          fill: d => Math.abs(d.value) > 0.5 ? "white" : "black",
          fontSize: 10,
          fontWeight: "bold",
        })
      ],
      width,
      height,
    });

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [data, width, height, title, subtitle, source]);

  return <div ref={containerRef} className="flex justify-center" />;
};

export default CorrelationHeatmap;
