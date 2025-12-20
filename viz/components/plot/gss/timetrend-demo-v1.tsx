'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as Plot from "@observablehq/plot";

interface TimetrendDemoProps {
  defaults: {
    color: string;
    plotBands?: string;
    errorbar?: string;
    x: string;
    y: string;
  };
  data: {
    metadata: {
      title: string;
      subtitle?: string;
      source: { name: string; id?: string };
    };
    dataPoints: Record<string, any>[];
    dataPointMetadata: Array<{
      id: string;
      name: string;
      categories?: string[];
      units?: string;
      value_suffix?: string;
    }>;
  };
  error?: string;
  colors: Record<string, Record<string, string>>;
  label?: string;
}

// Default colors if not provided
const DEFAULT_COLORS: Record<string, Record<string, string>> = {
  PolParty: {
    Democrat: '#2196f3',
    Republican: '#f44336',
    Independent: '#4caf50',
  },
};

export default function TimetrendDemo({
  defaults,
  error = 'yes',
  data,
  colors = DEFAULT_COLORS,
  label = ''
}: TimetrendDemoProps) {
  if (!defaults || !data) {
    return <div>Loading...</div>;
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const initialVisibleSeries = data.dataPointMetadata?.find((item) => item.id === defaults.color)?.categories || [];
  const [visibleSeries, setVisibleSeries] = useState(new Set(initialVisibleSeries));

  const getColor = (category: string) => {
    const categoryColors: { [key: string]: string } = colors[defaults.color] || {};
    return categoryColors[category] || "#cccccc";
  };

  const toggleSeries = (series: string) => {
    setVisibleSeries(prevVisibleSeries => {
      const updatedSet = new Set(prevVisibleSeries);
      if (updatedSet.has(series)) {
        updatedSet.delete(series);
      } else {
        updatedSet.add(series);
      }
      return updatedSet;
    });
  };

  const USEPREZ = typeof defaults.plotBands !== 'undefined' && defaults.plotBands === "PrezEra";
  const colorPal = colors[defaults.color] || {};

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (!data || !defaults || containerWidth === 0) return;

    const xFormedData = data.dataPoints.map((d) => ({
      ...d,
      year: +d['year']
    }));

    const average = xFormedData.reduce((total, d) => total + d[defaults.y], 0) / xFormedData.length;
    const yaxisMin = Math.max(0, Math.min(...xFormedData.map((d) => d[defaults.y])) - 0.2 * average);
    const yaxisMax = Math.max(...xFormedData.map((d) => d[defaults.y])) + 0.2 * average;

    const yaxisMinEb = Math.floor(
      Math.min(
        ...data.dataPoints
          .filter((d) => d.ci_lower !== undefined)
          .map((d) => d.ci_lower)
      )
    );

    const yaxisMaxEb = Math.round(
      Math.max(
        ...data.dataPoints
          .filter((d) => d.ci_upper !== undefined)
          .map((d) => d.ci_upper)
      )
    );

    const dataDates = data.dataPoints.map((d) => d[defaults.x]);
    const dataStartDate = Math.min(...dataDates);
    const dataEndDate = Math.max(...dataDates);

    const PresEras = [
      { startYear: 1972, endYear: 1977, politicalParty: "Republican", president: "Nixon/Ford" },
      { startYear: 1977, endYear: 1981, politicalParty: "Democratic", president: "Carter" },
      { startYear: 1981, endYear: 1993, politicalParty: "Republican", president: "Reagan/Bush" },
      { startYear: 1993, endYear: 2001, politicalParty: "Democratic", president: "Clinton" },
      { startYear: 2001, endYear: 2009, politicalParty: "Republican", president: "Bush" },
      { startYear: 2009, endYear: 2017, politicalParty: "Democratic", president: "Obama" },
      { startYear: 2017, endYear: 2021, politicalParty: "Republican", president: "Trump" },
      { startYear: 2021, endYear: 2025, politicalParty: "Democratic", president: "Biden" },
    ];

    const filteredByDate = PresEras.filter(period => {
      return period.endYear >= dataStartDate && period.startYear <= dataEndDate;
    }).map(period => ({
      ...period,
      startYear: Math.max(period.startYear, dataStartDate),
      endYear: Math.min(period.endYear, dataEndDate)
    }));

    const filteredDem = filteredByDate.filter((d) => d.politicalParty === "Democratic");
    const filteredRep = filteredByDate.filter((d) => d.politicalParty === "Republican");

    const filteredData = xFormedData.filter((d) => visibleSeries.has(d[defaults.color]));
    const plotHeight = Math.min(400, containerWidth * 0.6);

    const plot = Plot.plot({
      caption: `Source: ${data.metadata.source.name}`,
      height: plotHeight,
      width: containerWidth,
      marginTop: 20,
      marginRight: 40,
      marginBottom: 50,
      marginLeft: 60,
      style: {
        backgroundColor: "transparent",
        overflow: "visible"
      },
      x: {
        label: data.dataPointMetadata.find((item) => item.id === defaults.x)?.name || defaults.x,
        tickFormat: (d) => `${Math.floor(d as number)}`,
        labelOffset: 35,
      },
      y: {
        grid: true,
        domain: error === "none" ? [yaxisMin, yaxisMax] : [yaxisMinEb, yaxisMaxEb],
        label: data.dataPointMetadata.find((item) => item.id === defaults.y)?.name || defaults.y,
      },
      color: {
        type: 'ordinal',
        domain: Array.from(visibleSeries),
        range: Array.from(visibleSeries).map(series => getColor(series)),
      },
      marks: [
        USEPREZ ? Plot.rect(filteredDem, {
          x1: "startYear",
          x2: "endYear",
          y1: yaxisMinEb,
          y2: yaxisMaxEb,
          fillOpacity: 0.1,
          fill: "#2987f1"
        }) : null,
        USEPREZ ? Plot.rect(filteredRep, {
          x1: "startYear",
          x2: "endYear",
          y1: yaxisMinEb,
          y2: yaxisMaxEb,
          fillOpacity: 0.1,
          fill: "#fa5352"
        }) : null,
        Plot.axisX({
          tickSize: 5,
          tickPadding: 5,
          tickFormat: (d) => `${Math.floor(d as number)}`,
        }),
        Plot.axisY({
          label: "",
          tickFormat: data.dataPointMetadata.find((item) => item.id === defaults.y)?.units === "Percent"
            ? (d) => `${d}${data.dataPointMetadata.find((item) => item.id === defaults.y)?.value_suffix || '%'}`
            : undefined,
          tickSize: 0,
        }),
        Plot.lineY(filteredData, {
          x: defaults.x,
          y: defaults.y,
          stroke: defaults.color,
          strokeWidth: 2,
        }),
        error === "yes" ? Plot.ruleX(filteredData, {
          x: defaults.x,
          y1: "ci_lower",
          y2: "ci_upper",
          stroke: defaults.color,
        }) : null,
        Plot.dot(filteredData, {
          x: defaults.x,
          y: defaults.y,
          stroke: defaults.color,
          r: 4,
        }),
        Plot.ruleY([yaxisMinEb]),
        ...filteredDem.map(president => Plot.text(
          [{ x: president.startYear, y: yaxisMinEb, text: president.president }],
          { rotate: 270, x: "x", y: "y", text: "text", dy: -2, textAnchor: "start" }
        )),
        ...filteredRep.map(president => Plot.text(
          [{ x: president.startYear, y: yaxisMinEb, text: president.president }],
          { rotate: 270, x: "x", y: "y", text: "text", dy: -2, textAnchor: "start" }
        )),
        Plot.tip(
          filteredData,
          Plot.pointer({
            x: defaults.x,
            y: defaults.y,
            title: (d) => `${d[defaults.color]} ${d[defaults.x]}: ${d[defaults.y].toFixed(0)}${
              data.dataPointMetadata.find((item) => item.id === defaults.y)?.units === "Percent"
                ? data.dataPointMetadata.find((item) => item.id === defaults.y)?.value_suffix || '%'
                : ""
            }`,
            fill: "#FFFFFF",
          })
        ),
      ].filter(Boolean),
    });

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(plot);
    }
  }, [data, defaults, error, containerWidth, visibleSeries, colorPal, USEPREZ]);

  const colorsinfo = data.dataPointMetadata.find((item) => item.id === defaults.color)?.categories || [];

  return (
    <div className="w-full">
      <div className="text-xl font-semibold mb-1">{data.metadata.title}</div>
      <div className="text-md text-gray-600 mb-2">{data.metadata.subtitle}</div>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        <span className="text-xs">{label}</span>
        {colorsinfo.map((series) => (
          <div
            key={series}
            className="legend-item text-xs cursor-pointer flex items-center"
            onClick={() => toggleSeries(series)}
          >
            <div
              className="legend-icon mr-1 relative"
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: visibleSeries.has(series) ? getColor(series) : '#ccc',
                display: 'inline-block',
              }}
            >
              {!visibleSeries.has(series) && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(to bottom right, transparent, black 50%, transparent)`,
                  }}
                />
              )}
            </div>
            <span style={{ color: visibleSeries.has(series) ? 'inherit' : '#ccc' }}>{series}</span>
          </div>
        ))}
      </div>
      <div ref={containerRef} className="w-full"></div>
    </div>
  );
}
