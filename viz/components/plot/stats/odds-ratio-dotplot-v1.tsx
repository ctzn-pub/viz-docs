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

interface OddsRatioDotplotProps {
  data: OddsRatioData;
  title?: string;
  subtitle?: string;
  source?: string;
  width?: number;
  height?: number;
}

const OddsRatioDotplot: React.FC<OddsRatioDotplotProps> = ({
  data,
  title = "Precision-Weighted Dot Plot",
  subtitle = "Dot size reflects statistical precision",
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
      marginLeft: 200,
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
        label: 'Odds Ratio',
        tickFormat: ".2f",
      },
      y: {
        grid: true,
        label: '',
        domain: plotData.map(d => d.Label),
      },
      marks: [
        // Confidence interval lines
        Plot.ruleY(plotData, {
          x1: 'LowerCI',
          x2: 'UpperCI',
          y: 'Label',
          stroke: "#9ca3af",
          strokeWidth: 2
        }),
        // Main dots with size based on confidence interval width (inverse - smaller CI = larger dot)
        Plot.dot(plotData, {
          x: 'OddsRatio',
          y: 'Label',
          r: d => Math.max(3, 15 - (d.UpperCI - d.LowerCI) * 5),
          fill: d => d.OddsRatio > 1 ? '#3b82f6' : '#ef4444',
          stroke: "white",
          strokeWidth: 1.5,
          fillOpacity: 0.8,
          tip: {
            format: {
              fill: false,
              x: (d) => `${d.toFixed(3)} [${plotData.find(p => p.OddsRatio === d)?.LowerCI.toFixed(3)}, ${plotData.find(p => p.OddsRatio === d)?.UpperCI.toFixed(3)}]`
            }
          }
        }),
        Plot.ruleX([1], {
          stroke: "black",
          strokeWidth: 1,
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

export default OddsRatioDotplot;
