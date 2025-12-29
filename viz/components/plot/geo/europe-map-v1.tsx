'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";

const TOPOLOGY_BASE_URL = 'https://ontopic-public-data.t3.storage.dev/sample-data/geo';

// ISO3 to ISO2 country code mapping
const ISO3_TO_ISO2: Record<string, string> = {
  DEU: 'DE', FRA: 'FR', ITA: 'IT', ESP: 'ES', POL: 'PL', NLD: 'NL', BEL: 'BE',
  AUT: 'AT', CHE: 'CH', NOR: 'NO', SWE: 'SE', DNK: 'DK', FIN: 'FI', IRL: 'IE',
  PRT: 'PT', GRC: 'GR', CZE: 'CZ', HUN: 'HU', SVK: 'SK', SVN: 'SI', HRV: 'HR',
  ROU: 'RO', BGR: 'BG', LTU: 'LT', LVA: 'LV', EST: 'EE', LUX: 'LU', ISL: 'IS',
  UKR: 'UA', BLR: 'BY', MDA: 'MD', SRB: 'RS', BIH: 'BA', MNE: 'ME', MKD: 'MK',
  ALB: 'AL', XKX: 'KV', GBR: 'GB', TUR: 'TR', CYP: 'CY', MLT: 'MT', RUS: 'RU',
};

interface GiniDataPoint {
  cntry: string;
  iso3: string;
  gini: number;
}

interface CountryDataPoint {
  id: string;
  name: string;
  value: number;
}

interface EuropeMapProps {
  data?: GiniDataPoint[];
  title?: string;
  subtitle?: string;
  valueLabel?: string;
  colorScheme?: string;
  width?: number;
  height?: number;
}

const EuropeMap: React.FC<EuropeMapProps> = ({
  data = [],
  title = "Income Inequality in Europe",
  subtitle = "Gini coefficient by country",
  valueLabel = "Gini Coefficient",
  colorScheme = "oranges",
  width = 800,
  height = 600
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [europe, setEurope] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch topology data
  useEffect(() => {
    fetch(`${TOPOLOGY_BASE_URL}/europe.json`)
      .then(response => response.json())
      .then(topology => {
        setEurope(topology);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading topology:', error);
        setLoading(false);
      });
  }, []);

  // Transform input data to internal format
  const countryData: CountryDataPoint[] = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(d => ({
      id: ISO3_TO_ISO2[d.iso3] || d.iso3.substring(0, 2),
      name: d.cntry,
      value: d.gini
    }));
  }, [data]);

  // Convert TopoJSON to GeoJSON features
  const countries = useMemo(() => {
    if (!europe) return [];
    try {
      return topojson.feature(europe as any, europe.objects.default as any).features;
    } catch (error) {
      console.error('Error processing TopoJSON:', error);
      return [];
    }
  }, [europe]);

  // Create the map visualization
  useEffect(() => {
    if (!mapRef.current || loading || !europe || countries.length === 0 || countryData.length === 0) return;

    // Clear previous content
    mapRef.current.innerHTML = '';

    // Create a data lookup for country values
    const dataMap = new Map(countryData.map(d => [d.id, d]));

    // Enhance country features with data
    const enhancedCountries = countries.map(country => {
      const countryId = country.id || country.properties?.id || country.properties?.['hc-key']?.toUpperCase();
      const dataPoint = dataMap.get(countryId);

      return {
        ...country,
        properties: {
          ...country.properties,
          value: dataPoint?.value || 0,
          name: dataPoint?.name || country.properties?.name || 'Unknown',
        }
      };
    });

    // Create the plot
    const plot = Plot.plot({
      projection: {
        type: "mercator",
        domain: {
          type: "MultiPoint",
          coordinates: [[-25, 35], [45, 75]]
        }
      },
      width,
      height,
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 20,
      marginRight: 20,
      style: {
        backgroundColor: "transparent",
        color: "currentColor",
        fontFamily: "Inter, sans-serif"
      },
      color: {
        type: "quantile",
        n: 5,
        scheme: colorScheme,
        legend: true,
        label: valueLabel
      },
      marks: [
        // Country fills
        Plot.geo(enhancedCountries, {
          fill: d => d.properties.value,
          stroke: "#fff",
          strokeWidth: 0.5
        }),
        // Country borders
        Plot.geo(enhancedCountries, {
          fill: "none",
          stroke: "#666",
          strokeWidth: 0.25
        }),
        // Interactive tooltips
        Plot.tip(enhancedCountries, Plot.pointer(Plot.centroid({
          title: d => `${d.properties.name}: ${d.properties.value?.toFixed(1) || 'N/A'}`,
        })))
      ]
    });

    // Append the plot
    mapRef.current.appendChild(plot);
  }, [loading, europe, countries.length, countryData.length, colorScheme, valueLabel, width, height]);

  if (loading || !europe) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div ref={mapRef} className="w-full" />
      <div className="mt-4 text-xs text-muted-foreground">
        Data shows {valueLabel.toLowerCase()} across European countries.
      </div>
    </div>
  );
};

export default EuropeMap;
