'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as Plot from "@observablehq/plot";
import { loadParquetData } from '@/lib/duckdb';

const PARQUET_URL = 'https://ontopic-public-data.t3.storage.dev/sample-data/health_zip.parquet';

interface DataPoint {
  obesity_rate: number;
  latitude: number;
  longitude: number;
}

interface DistributionProps {
  data?: DataPoint[];
  width?: number;
  height?: number;
}

const Distribution: React.FC<DistributionProps> = ({
  width = 600,
  height = 400
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from parquet
  useEffect(() => {
    loadParquetData(PARQUET_URL)
      .then(parquetData => {
        setData(parquetData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading parquet data:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!data || data.length === 0 || loading) return;
    if (!chartRef.current) return;

    chartRef.current.innerHTML = '';

    const distributionPlot = Plot.plot({
      title: "Obesity Rate Distribution",
      subtitle: "Obesity Rate by Zipcode",
      caption: "Source: CDC",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      y: { grid: true },
      x: { label: "Obesity Rate (%)" },
      marks: [
        Plot.areaY(data, Plot.binX(
          { y: "count", filter: null },
          { x: "obesity_rate", fillOpacity: 0.2 }
        )),
        Plot.lineY(data, Plot.binX(
          { y: "count", filter: null },
          { x: "obesity_rate", tip: true }
        )),
        Plot.ruleY([0]),
        Plot.ruleX([35], { stroke: "red", strokeDasharray: "3,3" })
      ],
      width,
      height,
    });

    chartRef.current.appendChild(distributionPlot);

    return () => distributionPlot?.remove();
  }, [data, width, height, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: `${height}px` }}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div ref={chartRef} className="flex justify-center" />
      <p className="text-sm text-muted-foreground mt-4">
        Histogram showing the distribution of obesity rates. The red dashed line indicates
        the national average threshold of 35%.
      </p>
    </div>
  );
};

export default Distribution;
