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

interface OddsRatioBasicProps {
  data: OddsRatioData;
  title?: string;
  subtitle?: string;
  source?: string;
  width?: number;
  height?: number;
}

const OddsRatioBasic: React.FC<OddsRatioBasicProps> = ({
  data,
  title = "Statistical Odds Ratios",
  subtitle = "Analysis of various factors affecting outcomes",
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
        tickFormat: ",",
      },
      y: {
        grid: true,
        label: '',
        domain: plotData.map(d => d.Label),
      },
      marks: [
        Plot.dot(plotData, {
          x: 'OddsRatio',
          y: 'Label',
          tip: {
            format: { fill: false, x: (d) => d.toFixed(2) },
          },
          fill: d => d.OddsRatio > 1 ? 'green' : 'red',
        }),
        Plot.ruleY(plotData, {
          x1: 'LowerCI',
          x2: 'UpperCI',
          y: 'Label',
          stroke: d => d.OddsRatio > 1 ? 'green' : 'red'
        }),
        Plot.ruleX([1], {
          stroke: "black",
          strokeWidth: 0.5,
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

export default OddsRatioBasic;
