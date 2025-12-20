'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as Plot from "@observablehq/plot";

interface OddsRatioData {
  odds_ratios: Record<string, number>;
  conf_int_lower: Record<string, number>;
  conf_int_upper: Record<string, number>;
}

interface PlotDataPoint {
  Label: string;
  OddsRatio: number;
  LowerCI: number;
  UpperCI: number;
}

interface OddsRatioForestProps {
  data: OddsRatioData;
  title?: string;
  subtitle?: string;
  source?: string;
  width?: number;
  height?: number;
}

const OddsRatioForest: React.FC<OddsRatioForestProps> = ({
  data,
  title = "Forest Plot Analysis",
  subtitle = "Advanced statistical visualization with enhanced features",
  source = "General Social Survey",
  width = 800,
  height = 500
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const plotData: PlotDataPoint[] = useMemo(() =>
    Object.keys(data.odds_ratios).map(key => ({
      Label: key.replace(/C\((.*?)\)\[T\.(.*?)\]/, '$1 $2')
               .replace(/C\((.*?), Treatment\(.*?\)\)\[T\.(.*?)\]/, '$1 $2')
               .replace(/:/g, ' × '),
      OddsRatio: data.odds_ratios[key],
      LowerCI: data.conf_int_lower[key],
      UpperCI: data.conf_int_upper[key]
    })), [data]);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    containerRef.current.innerHTML = '';

    const plot = Plot.plot({
      marginLeft: 220,
      title,
      subtitle,
      caption: `Source: ${source}`,
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      x: {
        grid: true,
        type: "log",
        label: 'Odds Ratio (log scale)',
        tickFormat: ".2f",
        domain: [0.3, 3]
      },
      y: {
        grid: true,
        label: '',
        domain: plotData.map(d => d.Label).reverse(),
      },
      marks: [
        // Confidence interval rectangles (for visual emphasis)
        Plot.rect(plotData, {
          x1: "LowerCI",
          x2: "UpperCI",
          y: "Label",
          fill: d => d.OddsRatio > 1 ? '#dcfce7' : '#fef2f2',
          fillOpacity: 0.3,
          ry: 3
        }),
        // Confidence interval lines
        Plot.ruleY(plotData, {
          x1: 'LowerCI',
          x2: 'UpperCI',
          y: 'Label',
          stroke: d => d.OddsRatio > 1 ? '#16a34a' : '#dc2626',
          strokeWidth: 3
        }),
        // End caps for confidence intervals
        Plot.ruleY(plotData, {
          x: 'LowerCI',
          y: 'Label',
          stroke: d => d.OddsRatio > 1 ? '#16a34a' : '#dc2626',
          strokeWidth: 2,
          dx: 0,
          dy: -8
        }),
        Plot.ruleY(plotData, {
          x: 'LowerCI',
          y: 'Label',
          stroke: d => d.OddsRatio > 1 ? '#16a34a' : '#dc2626',
          strokeWidth: 2,
          dx: 0,
          dy: 8
        }),
        Plot.ruleY(plotData, {
          x: 'UpperCI',
          y: 'Label',
          stroke: d => d.OddsRatio > 1 ? '#16a34a' : '#dc2626',
          strokeWidth: 2,
          dx: 0,
          dy: -8
        }),
        Plot.ruleY(plotData, {
          x: 'UpperCI',
          y: 'Label',
          stroke: d => d.OddsRatio > 1 ? '#16a34a' : '#dc2626',
          strokeWidth: 2,
          dx: 0,
          dy: 8
        }),
        // Central point estimates (squares for forest plots)
        Plot.dot(plotData, {
          x: 'OddsRatio',
          y: 'Label',
          fill: d => d.OddsRatio > 1 ? '#16a34a' : '#dc2626',
          stroke: "white",
          strokeWidth: 2,
          r: 6,
          symbol: "square",
          tip: {
            format: {
              fill: false,
              x: (d) => `OR: ${d.toFixed(3)}`
            }
          }
        }),
        // Reference line at OR = 1
        Plot.ruleX([1], {
          stroke: "#374151",
          strokeWidth: 2,
          strokeDasharray: "5,5"
        })
      ],
      width,
      height,
    });

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [data, plotData, title, subtitle, source, width, height]);

  return <div ref={containerRef} className="flex justify-center" />;
};

export default OddsRatioForest;
