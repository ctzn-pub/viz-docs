'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";

const TOPOLOGY_BASE_URL = 'https://ontopic-public-data.t3.storage.dev/geo';

interface CountyDataPoint {
  FIPS: string;
  MHLTH_AdjPrev: number;
  population: number;
}

interface ChoroplethMapProps {
  data?: CountyDataPoint[];
  title?: string;
  subtitle?: string;
  valueLabel?: string;
  colorScheme?: string;
}

const ChoroplethMap: React.FC<ChoroplethMapProps> = ({
  data = [],
  title = "US County Mental Health Prevalence",
  subtitle = "County-level mental health data from CDC",
  valueLabel = "Mental Health (% Poor Mental Health Days)",
  colorScheme = "blues"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [countyData, setCountyData] = useState<CountyDataPoint[]>([]);
  const [us, setUs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch topology data
  useEffect(() => {
    fetch(`${TOPOLOGY_BASE_URL}/us-albers-counties-10m.json`)
      .then(response => response.json())
      .then(topology => {
        setUs(topology);
      })
      .catch(error => {
        console.error('Error loading topology:', error);
      });
  }, []);

  // Load county data from JSON file
  useEffect(() => {
    if (data.length > 0) {
      setCountyData(data);
      setLoading(false);
    } else {
      fetch('/data/county_sample.json')
        .then(response => response.json())
        .then((data: CountyDataPoint[]) => {
          setCountyData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading county data:', error);
          setLoading(false);
        });
    }
  }, [data]);

  useEffect(() => {
    if (loading || !countyData || countyData.length === 0 || !us) return;
    if (!mapRef.current) return;

    // Clear existing plot
    mapRef.current.innerHTML = '';

    try {
      // Extract topojson features
      const statemesh = topojson.mesh(us as any, (us as any).objects.states, (a: any, b: any) => a !== b);
      const nation = topojson.feature(us as any, (us as any).objects.nation);
      const countiesmesh = topojson.mesh(us as any, (us as any).objects.counties);
      const counties = topojson.feature(us as any, (us as any).objects.counties);

      // Create data map for quick lookup using FIPS codes
      const dataMap = new Map(countyData.map(d => [d.FIPS, d.MHLTH_AdjPrev]));
      const populationMap = new Map(countyData.map(d => [d.FIPS, d.population]));

      console.log(`Loaded ${countyData.length} counties, data map has ${dataMap.size} entries`);

      // Color scale configuration
      const colorConfig = {
        type: "quantile" as const,
        n: 7,
        scheme: colorScheme,
        legend: true,
        label: valueLabel,
        tickFormat: ".1f"
      };

      const plot = Plot.plot({
        title: title,
        subtitle: subtitle,
        width: 960,
        height: 600,
        projection: "albers",
        style: {
          backgroundColor: "white",
          fontFamily: "sans-serif",
        },
        color: colorConfig,
        marks: [
          // County boundaries (light stroke)
          Plot.geo(countiesmesh, {
            strokeOpacity: 0.3,
            stroke: "#ddd"
          }),

          // Counties with data (choropleth fill)
          Plot.geo(counties.features, {
            fill: (d: any) => {
              const value = dataMap.get(d.id);
              return value !== undefined ? value : null;
            },
            stroke: "white",
            strokeWidth: 0.5,
            tip: true,
            title: (d: any) => {
              const countyName = d.properties?.name || `County ${d.id}`;
              const value = dataMap.get(d.id);
              const population = populationMap.get(d.id);
              if (value !== undefined) {
                const popText = population ? `\nPopulation: ${population.toLocaleString()}` : '';
                return `${countyName}\n${valueLabel}: ${value.toFixed(1)}%${popText}`;
              }
              return `${countyName}\nNo data available`;
            }
          }),

          // Nation outline
          Plot.geo(nation, {
            stroke: "black",
            strokeWidth: 1,
            fill: "none"
          }),

          // State boundaries (stronger stroke)
          Plot.geo(statemesh, {
            stroke: "black",
            strokeOpacity: 0.5,
            strokeWidth: 0.5
          })
        ],
        marginLeft: 0,
        marginRight: 140 // Space for legend
      });

      mapRef.current.appendChild(plot);

      // Cleanup
      return () => {
        plot?.remove();
      };
    } catch (error) {
      console.error('Error rendering choropleth map:', error);
      if (mapRef.current) {
        mapRef.current.innerHTML = `<div class="text-red-500 p-4">Error loading map: ${error}</div>`;
      }
    }
  }, [countyData, loading, title, subtitle, valueLabel, colorScheme, us]);

  if (loading || !us) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <p className="text-gray-600">Loading county health data...</p>
        </div>
        <div>
          <div className="flex justify-center items-center" style={{ minHeight: '600px' }}>
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-gray-600">
          Interactive county-level choropleth map showing mental health prevalence across US counties.
          Colors represent different prevalence ranges using quantile scaling for optimal contrast.
          Data source: CDC Behavioral Risk Factor Surveillance System (BRFSS).
        </p>
      </div>

      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">County Mental Health Prevalence Map</h3>
          <p className="text-sm text-gray-600">
            Percentage of adults reporting poor mental health for 14+ days per month
          </p>
        </div>
        <div>
          <div ref={mapRef} className="flex justify-center" style={{ minHeight: '600px' }} />
          <p className="text-sm text-gray-600 mt-4">
            This choropleth map uses quantile scaling to divide {countyData.length} counties into equal-sized groups,
            ensuring good color distribution across geographic regions. Hover over counties for detailed information
            including population data.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Choropleth Map Features</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium">Color Encoding</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Quantile-based color scaling</li>
              <li>7 color gradations for nuance</li>
              <li>Interactive legend</li>
              <li>Customizable color schemes</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Geographic Features</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>County-level detail</li>
              <li>State boundary overlay</li>
              <li>Albers projection for accuracy</li>
              <li>Clean boundary styling</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Interactivity</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Hover tooltips with details</li>
              <li>County names and values</li>
              <li>Responsive design</li>
              <li>Data-driven styling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChoroplethMap;