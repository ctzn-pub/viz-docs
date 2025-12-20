"use client";

import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ErrorBar,
    ReferenceArea,
    Text
} from 'recharts';
import { Label } from "@/viz/ui/label";
import { Switch } from "@/viz/ui/switch";

// --- Type Definitions ---
interface DataPoint {
    year: string | number | null;
    value: number | null;
    ci_lower?: number;
    ci_upper?: number;
    n_actual?: number;
    standard_error?: number;
    [key: string]: any;
}

interface TooltipPayloadItem {
    name: string;
    value: number | null;
    color: string;
    payload: DataPoint;
    dataKey: string;
    stroke?: string;
    fill?: string;
}

interface DataPointMetadataItem {
    id: string;
    categories?: string[];
    value_prefix?: string | object;
    value_suffix?: string | object;
    [key: string]: any;
}

interface ChartData {
    metadata: {
        title: string;
        subtitle?: string;
        question?: string;
        source?: { name: string; id?: string; };
        observations?: number;
        [key: string]: any;
    };
    dataPoints: DataPoint[];
    dataPointMetadata: DataPointMetadataItem[];
}

interface TimeTrendDemoChartProps {
    data: ChartData;
    demographicGroups: string[];
    demographic: string;
    defaultVisibleGroups?: string[];
}

// --- Constants ---
const COLORS = ['#2196f3', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#795548', '#607d8b'];
const presidentialTerms = [
    { start: 1971, end: 1976, party: "Republican", president: "Nixon/Ford" },
    { start: 1976, end: 1980, party: "Democrat", president: "Carter" },
    { start: 1980, end: 1992, party: "Republican", president: "Reagan/Bush" },
    { start: 1992, end: 2000, party: "Democrat", president: "Clinton" },
    { start: 2000, end: 2008, party: "Republican", president: "Bush" },
    { start: 2008, end: 2016, party: "Democrat", president: "Obama" },
    { start: 2016, end: 2020, party: "Republican", president: "Trump" },
    { start: 2020, end: 2024, party: "Democrat", president: "Biden" },
];

// --- Helper Functions ---
const generateTicks = (start: number, end: number, interval: number): number[] => {
    const ticks: number[] = [];
    const firstTick = Math.ceil(start / interval) * interval;
    for (let i = firstTick; i <= end; i += interval) {
        if (i <= end) { ticks.push(i); }
    }
    return ticks;
};

const processDataPoint = (d: DataPoint): DataPoint & { year: number | null } => {
    const yearNum = parseInt(String(d.year), 10);
    const valueNum = typeof d.value === 'number' ? d.value : parseFloat(String(d.value));
    return {
        ...d,
        year: isNaN(yearNum) ? null : yearNum,
        value: typeof valueNum === 'number' && !isNaN(valueNum) ? valueNum : null
    };
};

// --- Component ---
export default function TimeTrendDemoChart({
    data, demographicGroups, demographic, defaultVisibleGroups
}: TimeTrendDemoChartProps) {
    const [visibleGroups, setVisibleGroups] = useState<Set<string>>(
        new Set(defaultVisibleGroups || demographicGroups)
    );
    const [showCI, setShowCI] = useState(false);

    useEffect(() => {
        setVisibleGroups(new Set(defaultVisibleGroups || demographicGroups));
    }, [demographicGroups, defaultVisibleGroups]);

    if (!data || !data.dataPoints || !Array.isArray(data.dataPoints) || data.dataPoints.length === 0) {
        return <div className="p-4 text-center text-gray-500">No data available to display chart.</div>;
    }

    const processedDataPoints = data.dataPoints.map(processDataPoint);
    const allValidYearsNumeric = processedDataPoints.map(d => d.year).filter((year): year is number => year !== null);

    if (allValidYearsNumeric.length === 0) {
        return <div className="p-4 text-center text-gray-500">Data contains no valid years.</div>;
    }

    const minYearInData = Math.min(...allValidYearsNumeric);
    const maxYearInData = Math.max(...allValidYearsNumeric);

    const relevantPresidentialTerms = presidentialTerms.filter(term =>
        term.end >= minYearInData && term.start <= maxYearInData
    );
    const firstRelevantBandStart = relevantPresidentialTerms.length > 0
        ? Math.min(...relevantPresidentialTerms.map(t => t.start)) : minYearInData;
    const xAxisMin = Math.min(firstRelevantBandStart, minYearInData);
    const xAxisMax = maxYearInData;
    const xTickInterval = 5;
    const xAxisTicks = generateTicks(xAxisMin, xAxisMax, xTickInterval);

    const groupedData = demographicGroups.map(group => {
        const groupData = processedDataPoints
            .filter(d => d[demographic] === group && d.year !== null)
            .map(d => d as DataPoint & { year: number })
            .sort((a, b) => a.year - b.year);
        return { name: group, data: groupData };
    });
    const hasCIData = groupedData.some(g =>
        g.data.some(d => d.standard_error !== undefined || (d.ci_lower !== undefined && d.ci_upper !== undefined))
    );

    const getVisibleBounds = (): { min: number; max: number } => {
        let overallMin = Infinity;
        let overallMax = -Infinity;
        let hasVisibleData = false;

        groupedData
            .filter(group => visibleGroups.has(group.name))
            .forEach(group => {
                group.data.forEach(point => {
                    if (point.value === null) return;
                    hasVisibleData = true;
                    let currentMin = point.value;
                    let currentMax = point.value;

                    if (showCI) {
                        if (point.ci_lower !== undefined && point.ci_lower !== null) { currentMin = point.ci_lower; }
                        else if (typeof point.standard_error === 'number' && !isNaN(point.standard_error)) { currentMin = point.value - 1.96 * point.standard_error; }
                        if (point.ci_upper !== undefined && point.ci_upper !== null) { currentMax = point.ci_upper; }
                        else if (typeof point.standard_error === 'number' && !isNaN(point.standard_error)) { currentMax = point.value + 1.96 * point.standard_error; }
                    }

                    if (typeof currentMin === 'number' && !isNaN(currentMin)) { overallMin = Math.min(overallMin, currentMin); }
                    if (typeof currentMax === 'number' && !isNaN(currentMax)) { overallMax = Math.max(overallMax, currentMax); }
                });
            });

        return hasVisibleData && isFinite(overallMin) && isFinite(overallMax)
            ? { min: overallMin, max: overallMax } : { min: 0, max: 100 };
    };

    const { min: effectiveMin, max: effectiveMax } = getVisibleBounds();
    let yDomain: [number, number] = [0, 100];

    if (isFinite(effectiveMin) && isFinite(effectiveMax)) {
        const dataRange = effectiveMax - effectiveMin;
        const buffer = Math.max(5, dataRange * 0.15);
        const lowerBound = effectiveMin - buffer;
        const upperBound = effectiveMax + buffer;
        const finalMin = Math.max(0, lowerBound);
        const finalMax = Math.min(100, upperBound);
        const minRange = 10;

        if (finalMin >= finalMax) {
             const centerValue = Math.min(100, Math.max(0, (effectiveMin + effectiveMax) / 2));
             yDomain = [Math.max(0, Math.floor((centerValue - minRange / 2) / 5) * 5), Math.min(100, Math.ceil((centerValue + minRange / 2) / 5) * 5)];
             if (yDomain[0] >= yDomain[1]) { yDomain = [Math.max(0, finalMin - 5), Math.min(100, finalMax + 5)]; }
        } else if (finalMax - finalMin < minRange) {
             const midPoint = (finalMin + finalMax) / 2;
             yDomain = [Math.max(0, Math.floor((midPoint - minRange / 2) / 5) * 5), Math.min(100, Math.ceil((midPoint + minRange / 2) / 5) * 5)];
             if (yDomain[0] >= yDomain[1]) {
                 yDomain = [Math.max(0, finalMin - buffer), Math.min(100, finalMax + buffer)];
                 if(yDomain[0] >= yDomain[1]) yDomain = [Math.max(0, finalMin - 5), Math.min(100, finalMax + 5)];
             }
        } else {
            yDomain = [finalMin, finalMax];
        }
    }

    const handleLegendClick = (entry: { value: string }) => {
        setVisibleGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entry.value)) {
                newSet.delete(entry.value);
            } else {
                newSet.add(entry.value);
            }
            return newSet;
        });
    };

    const yAxisTickFormatter = (value: number | string): string => {
        const metadata = data.dataPointMetadata.find(d => d.id === 'value');
        const prefixValue = metadata?.value_prefix;
        const suffixValue = metadata?.value_suffix;
        const prefix = (prefixValue && (typeof prefixValue !== 'object' || Object.keys(prefixValue).length > 0)) ? String(prefixValue) : '';
        const suffix = (suffixValue && (typeof suffixValue !== 'object' || Object.keys(suffixValue).length > 0)) ? String(suffixValue) : '%';
        const num = Number(value);
        if (isNaN(num)) return String(value);
        const formattedValue = num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        return `${prefix}${formattedValue}${suffix}`;
    };

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string | number }) => {
        if (!active || !payload || payload.length === 0 || label === undefined) return null;
        const visiblePayload = payload.filter(series => visibleGroups.has(series.name));
        if (visiblePayload.length === 0) return null;
        const valueMetadata = data.dataPointMetadata.find(m => m.id === 'value');
        const suffix = (typeof valueMetadata?.value_suffix === 'string') ? valueMetadata.value_suffix : '%';
        const prefix = (typeof valueMetadata?.value_prefix === 'string') ? valueMetadata.value_prefix : '';

        return (
            <div className="bg-white p-3 border border-gray-300 shadow-lg rounded-md text-sm max-w-xs">
                <p className="font-semibold mb-2 text-gray-700">{`Year: ${label}`}</p>
                {visiblePayload.map((series) => {
                    const colorIndex = demographicGroups.indexOf(series.name);
                    const color = colorIndex !== -1 ? COLORS[colorIndex % COLORS.length] : series.color || '#8884d8';
                    const pointData = series.payload;
                    return (
                        <div key={series.name} className="mb-1.5 last:mb-0">
                            <p className="font-medium" style={{ color: color }}>{series.name}</p>
                            <p className="text-gray-600" style={{ color: color }}>
                                {`Value: ${series.value != null ? `${prefix}${series.value.toFixed(1)}${suffix}` : 'N/A'}`}
                            </p>
                            {pointData?.ci_lower !== undefined && pointData?.ci_upper !== undefined && (
                                <p className="text-gray-500 text-xs">
                                    {`95% CI: [${pointData.ci_lower.toFixed(1)}%, ${pointData.ci_upper.toFixed(1)}%]`}
                                </p>
                            )}
                            {pointData?.n_actual && (
                                <p className="text-gray-500 text-xs">
                                    {`N: ${pointData.n_actual.toLocaleString()}`}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="w-full bg-white p-4 md:p-6 rounded-lg shadow">
            <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{data.metadata.title}</h2>
                {data.metadata.subtitle && <p className="text-sm text-gray-600 mt-1">{data.metadata.subtitle}</p>}
                {data.metadata.question && <p className="text-sm text-gray-500 italic mt-1">{data.metadata.question}</p>}
            </div>

            <div className="h-[450px] md:h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        key={`${demographic}-${showCI}`}
                        margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                    >
                        {relevantPresidentialTerms.map((term, index) => (
                            <ReferenceArea key={`term-bg-${index}`} x1={term.start} x2={term.end} yAxisId="left"
                                fill={term.party === "Democrat" ? "rgba(230, 240, 255, 0.5)" : "rgba(255, 235, 238, 0.5)"}
                                ifOverflow="visible" shapeRendering="crispEdges" />
                        ))}

                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />

                        <XAxis
                            dataKey="year" type="number"
                            domain={[xAxisMin, xAxisMax]}
                            allowDataOverflow={true}
                            ticks={xAxisTicks}
                            tick={{ fontSize: 11, fill: '#666' }}
                            padding={{ left: 10, right: 10 }}
                            tickFormatter={(year) => String(year)}
                            interval={0}
                            axisLine={{ stroke: '#ccc' }}
                            tickLine={{ stroke: '#ccc' }}
                        />

                        <YAxis
                            yAxisId="left"
                            tickFormatter={yAxisTickFormatter}
                            domain={yDomain}
                            allowDataOverflow={false}
                            axisLine={false} tickLine={false}
                            tick={{ fontSize: 11, fill: '#666' }}
                            width={50}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a0a0a0', strokeWidth: 1, strokeDasharray: '3 3' }} />

                        <Legend verticalAlign="bottom" align="center" height={40} onClick={handleLegendClick}
                            iconSize={10} wrapperStyle={{ paddingTop: '10px' }}
                            formatter={(value) => {
                                const isVisible = visibleGroups.has(value);
                                return (<span style={{ color: isVisible ? '#333' : '#aaa', cursor: 'pointer', marginLeft: '4px', fontSize: '12px' }}>{value}</span>);
                            }} />

                        {groupedData.map((group) => {
                            const colorIndex = demographicGroups.indexOf(group.name);
                            const color = colorIndex !== -1 ? COLORS[colorIndex % COLORS.length] : '#8884d8';
                            return (
                                <Line
                                    key={group.name} yAxisId="left" type="linear"
                                    data={group.data}
                                    dataKey="value" name={group.name} stroke={color} strokeWidth={2}
                                    dot={{ r: 3, fill: color, strokeWidth: 1, stroke: 'white' }}
                                    activeDot={{ r: 5, strokeWidth: 1, stroke: 'white' }}
                                    hide={!visibleGroups.has(group.name)}
                                    connectNulls={true}
                                    isAnimationActive={false}
                                >
                                    {showCI && hasCIData && (
                                        <ErrorBar
                                            dataKey={(d: DataPoint) => (typeof d.standard_error === 'number' && !isNaN(d.standard_error)) ? (1.96 * d.standard_error) : 0}
                                            width={4} strokeWidth={1.5} stroke={color}
                                            opacity={0.35} direction="y"
                                        />
                                    )}
                                </Line>
                            );
                        })}

                        {relevantPresidentialTerms.map((term, index) => (
                            <Text
                                key={`term-label-${index}`}
                                x={(term.start + term.end) / 2}
                                y={typeof yDomain[1] === 'number' ? yDomain[1] - 3 : 97}
                                textAnchor="middle"
                                verticalAnchor="start"
                                fill="#6b7280"
                                fontSize={10}
                            >
                                {term.president}
                            </Text>
                        ))}

                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-3 sm:mt-1 pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500 text-left order-1 sm:order-none">
                    Source: {data.metadata.source?.name || 'Not specified'}
                    {data.metadata.observations && ` (${data.metadata.observations.toLocaleString()} Observations)`}
                </div>

                <div className="flex items-center space-x-2 order-2 sm:order-none">
                    <Switch
                        id="show-ci" checked={showCI} onCheckedChange={setShowCI}
                        disabled={!hasCIData}
                    />
                    <Label htmlFor="show-ci" className={`text-xs ${!hasCIData ? 'text-gray-400' : 'text-gray-600'}`}>
                        Show 95% CI
                    </Label>
                </div>
            </div>
        </div>
    );
}
