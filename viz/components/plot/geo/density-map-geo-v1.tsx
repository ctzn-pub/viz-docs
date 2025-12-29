'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";
import { loadParquetData } from '@/lib/duckdb';

const TOPOLOGY_URL = 'https://ontopic-public-data.t3.storage.dev/geo/us-albers-counties-10m.json';
const PARQUET_URL = 'https://ontopic-public-data.t3.storage.dev/sample-data/health_zip.parquet';

interface DataPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface GeoDensityMapProps {
  data?: DataPoint[];
  width?: number;
  height?: number;
  colorScheme?: string;
  bandwidth?: number;
}

const GeoDensityMap: React.FC<GeoDensityMapProps> = ({
  width = 960,
  height = 600,
  colorScheme = "blues",
  bandwidth = 10
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [us, setUs] = useState<any>(null);
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch topology data
  useEffect(() => {
    fetch(TOPOLOGY_URL)
      .then(response => response.json())
      .then(topology => {
        setUs(topology);
      })
      .catch(error => {
        console.error('Error loading topology:', error);
      });
  }, []);

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
    if (!data || data.length === 0 || !us || loading) return;
    if (!mapRef.current) return;

    mapRef.current.innerHTML = '';

    const statemesh = topojson.mesh(us as any, (us as any).objects.states, (a: any, b: any) => a !== b);
    const nation = topojson.feature(us as any, (us as any).objects.nation);
    const countiesmesh = topojson.mesh(us as any, (us as any).objects.counties);

    const mapPlot = Plot.plot({
      width,
      height,
      projection: "albers",
      color: {
        scheme: colorScheme,
        type: "linear",
        label: "Density",
        legend: true
      },
      marks: [
        Plot.geo(countiesmesh, { strokeOpacity: 0.3 }),
        Plot.geo(nation),
        Plot.geo(statemesh, { strokeOpacity: 0.5 }),
        Plot.density(data, {
          x: "longitude",
          y: "latitude",
          bandwidth,
          fill: "density"
        })
      ]
    });

    mapRef.current.appendChild(mapPlot);

    return () => mapPlot?.remove();
  }, [data, width, height, us, loading, colorScheme, bandwidth]);

  if (loading || !us) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: `${height}px` }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Geographic Density Map</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Kernel density estimation showing geographic concentration of health data
      </p>
      <div ref={mapRef} className="flex justify-center" />
      <p className="text-sm text-muted-foreground mt-4">
        Darker areas indicate higher concentration of data points.
        State and county boundaries are overlaid for geographic reference.
      </p>
    </div>
  );
};

export default GeoDensityMap;
