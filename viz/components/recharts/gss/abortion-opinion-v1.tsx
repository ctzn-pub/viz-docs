"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ErrorBar,
  Cell,
} from "recharts";

interface DataPoint {
  Race: string;
  value: number;
  ci_lower: number;
  ci_upper: number;
  n_actual: number;
  Education: string;
  Census_Region: string;
  standard_error: number;
}

interface Metadata {
  note: string;
  type: string;
  title: string;
  source: {
    id: string;
    name: string;
  };
  question: string;
  subtitle: string;
}

interface DataPointMetadata {
  id: string;
  name: string;
  type: string;
  categories?: string[];
  units?: string;
  value_suffix?: string;
  value_prefix?: string;
}

interface ChartData {
  metadata: Metadata;
  dataPoints: DataPoint[];
  dataPointMetadata: DataPointMetadata[];
}

interface Props {
  data: ChartData;
}

export default function AbortionOpinionChart({ data }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [selectedEducation, setSelectedEducation] = useState<string>("All");

  const { metadata, dataPoints, dataPointMetadata } = data;

  // Extract categories from metadata
  const regions = ["All", ...(dataPointMetadata.find(d => d.id === "Census_Region")?.categories || [])];
  const educationLevels = ["All", ...(dataPointMetadata.find(d => d.id === "Education")?.categories || [])];
  const races = dataPointMetadata.find(d => d.id === "Race")?.categories || [];

  // Filter data based on selections
  const filteredData = dataPoints.filter(point => {
    const regionMatch = selectedRegion === "All" || point.Census_Region === selectedRegion;
    const educationMatch = selectedEducation === "All" || point.Education === selectedEducation;
    return regionMatch && educationMatch;
  });

  // Group data by region and education for visualization
  const groupedData = React.useMemo(() => {
    const groups: { [key: string]: any } = {};

    filteredData.forEach(point => {
      const key = `${point.Census_Region} - ${point.Education}`;
      if (!groups[key]) {
        groups[key] = {
          name: key,
          region: point.Census_Region,
          education: point.Education,
        };
      }
      groups[key][`${point.Race}`] = point.value;
      groups[key][`${point.Race}_error`] = point.standard_error * 1.96; // 95% CI
      groups[key][`${point.Race}_ci_lower`] = point.ci_lower;
      groups[key][`${point.Race}_ci_upper`] = point.ci_upper;
      groups[key][`${point.Race}_n`] = point.n_actual;
    });

    return Object.values(groups).sort((a, b) => {
      // Sort by region first, then education
      if (a.region !== b.region) {
        return regions.indexOf(a.region) - regions.indexOf(b.region);
      }
      return educationLevels.indexOf(a.education) - educationLevels.indexOf(b.education);
    });
  }, [filteredData, regions, educationLevels]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0]?.payload;

    return (
      <div className="bg-white p-4 border border-gray-300 shadow-lg rounded-lg">
        <p className="font-semibold mb-2 text-sm">{label}</p>
        <div className="space-y-1">
          {races.map((race) => {
            const value = data[race];
            const ciLower = data[`${race}_ci_lower`];
            const ciUpper = data[`${race}_ci_upper`];
            const n = data[`${race}_n`];

            if (value === undefined) return null;

            return (
              <div key={race} className="text-sm">
                <span className="font-medium">{race}:</span>{" "}
                <span className="font-semibold">{value.toFixed(1)}%</span>
                <div className="text-xs text-gray-600 ml-2">
                  95% CI: [{ciLower.toFixed(1)}%, {ciUpper.toFixed(1)}%]
                </div>
                <div className="text-xs text-gray-500 ml-2">n = {n}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const colors = {
    White: "#374151",
    Black: "#9CA3AF",
  };

  return (
    <div className="w-full space-y-4">
      {/* Title and subtitle */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{metadata.title}</h2>
        <p className="text-sm text-gray-600">{metadata.subtitle}</p>
        <p className="text-xs text-gray-500 italic">{metadata.question}</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="region" className="text-sm font-medium">
            Region:
          </label>
          <select
            id="region"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="education" className="text-sm font-medium">
            Education:
          </label>
          <select
            id="education"
            value={selectedEducation}
            onChange={(e) => setSelectedEducation(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            {educationLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: Math.max(400, groupedData.length * 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={groupedData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 200, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              label={{ value: "Support for Legal Abortion (%)", position: "bottom", offset: 0 }}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={190}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {races.map((race) => (
              <Bar
                key={race}
                dataKey={race}
                fill={colors[race as keyof typeof colors] || "#6B7280"}
                name={race}
                isAnimationActive={false}
              >
                <ErrorBar
                  dataKey={`${race}_error`}
                  stroke="#000000"
                  strokeWidth={1}
                  width={4}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Source and notes */}
      <div className="text-xs text-gray-500 space-y-1 mt-4 border-t pt-4">
        <p>
          <strong>Source:</strong> {metadata.source.name}
        </p>
        <p>
          <strong>Note:</strong> {metadata.note}
        </p>
      </div>
    </div>
  );
}
