'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";
import { geoCentroid } from "d3-geo";

interface CountyDataPoint {
  FIPS: string;
  [key: string]: unknown;
}

interface BubbleMapProps {
  data: CountyDataPoint[];
  topoJsonUrl?: string;
  valueField?: string;
  sizeField?: string;
  title?: string;
  subtitle?: string;
  source?: string;
  width?: number;
  height?: number;
}

const BubbleMap: React.FC<BubbleMapProps> = ({
  data,
  topoJsonUrl = 'https://ontopic-public-data.t3.storage.dev/sample-data/geo/us-albers-counties-10m.json',
  valueField = 'MHLTH_AdjPrev',
  sizeField = 'population',
  title = "US County Bubble Map",
  subtitle = "Bubble size represents population",
  source = "CDC",
  width = 960,
  height = 600
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [us, setUs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(topoJsonUrl)
      .then(response => response.json())
      .then(topology => {
        setUs(topology);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading topology:', error);
        setLoading(false);
      });
  }, [topoJsonUrl]);

  useEffect(() => {
    if (loading || !data || data.length === 0 || !us || !containerRef.current) return;

    containerRef.current.innerHTML = '';

    try {
      const statemesh = topojson.mesh(us, us.objects.states, (a: any, b: any) => a !== b);
      const nation = topojson.feature(us, us.objects.nation);
      const counties = topojson.feature(us, us.objects.counties) as any;

      const dataMap = new Map(data.map(d => [d.FIPS, d]));

      const countiesWithData = counties.features
        .filter((county: any) => dataMap.has(county.id))
        .map((county: any) => {
          const d = dataMap.get(county.id)!;
          const centroid = geoCentroid(county);
          return {
            ...d,
            longitude: centroid[0],
            latitude: centroid[1],
            countyName: county.properties?.name || `County ${county.id}`,
            value: Number(d[valueField]) || 0,
            size: Number(d[sizeField]) || 1000
          };
        })
        .filter((d: any) => d.longitude && d.latitude && !isNaN(d.longitude) && !isNaN(d.latitude));

      const plot = Plot.plot({
        title,
        subtitle,
        caption: `Source: ${source}`,
        width,
        height,
        projection: "albers",
        style: {
          backgroundColor: "white",
          fontFamily: "sans-serif",
        },
        color: {
          legend: true,
          scheme: "RdYlBu",
          reverse: true,
          label: valueField,
          tickFormat: ".1f"
        },
        r: {
          range: [2, 15],
          label: sizeField
        },
        marks: [
          Plot.geo(nation, {
            fill: "#f8f9fa",
            stroke: "white",
            strokeWidth: 1
          }),
          Plot.geo(statemesh, {
            stroke: "#dee2e6",
            strokeOpacity: 0.5
          }),
          Plot.dot(countiesWithData, {
            x: "longitude",
            y: "latitude",
            r: (d: any) => Math.sqrt(d.size / 50000),
            fill: "value",
            fillOpacity: 0.7,
            stroke: "white",
            strokeWidth: 1,
            tip: true,
            title: (d: any) => `${d.countyName}\n${valueField}: ${d.value.toFixed(1)}%\n${sizeField}: ${d.size.toLocaleString()}`
          })
        ],
        marginLeft: 0,
        marginRight: 120
      });

      containerRef.current.appendChild(plot);

      return () => {
        plot?.remove();
      };
    } catch (error) {
      console.error('Error rendering bubble map:', error);
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div class="text-red-500 p-4">Error loading map: ${error}</div>`;
      }
    }
  }, [data, us, loading, valueField, sizeField, title, subtitle, source, width, height]);

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <div ref={containerRef} className="flex justify-center" />;
};

export default BubbleMap;
