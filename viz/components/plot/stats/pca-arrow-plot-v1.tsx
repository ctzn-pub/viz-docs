'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from "@observablehq/plot";

export interface PCAVariable {
    name: string;
    x: number;
    y: number;
    contrib: number;
    cos2: number;
}

export interface PCAConfig {
    title?: string;
    x_label?: string;
    y_label?: string;
    color_gradient?: {
        low: string;
        mid: string;
        high: string;
    };
    contrib_range?: {
        min: number;
        max: number;
    };
}

export interface PCAArrowPlotData {
    config: PCAConfig;
    variables: PCAVariable[];
}

export interface PCAArrowPlotProps {
    data: PCAArrowPlotData;
    width?: number;
    height?: number;
}

/**
 * PCAArrowPlot - A circle arrow plot for PCA variables
 * 
 * Visualizes the contribution of variables to the first two principal components.
 * Arrows indicate direction and magnitude, while color represents contribution.
 */
const PCAArrowPlot: React.FC<PCAArrowPlotProps> = ({
    data,
    width = 700,
    height = 700
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const legendRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !legendRef.current || !data || !data.variables) return;

        const { config, variables } = data;
        const { color_gradient, contrib_range } = config;

        containerRef.current.innerHTML = '';
        legendRef.current.innerHTML = '';

        // Create the unit circle data
        const circleData = Array.from({ length: 121 }, (_, i) => {
            const angle = (i / 120) * 2 * Math.PI;
            return { x: Math.cos(angle), y: Math.sin(angle) };
        });

        const colorOptions = {
            type: "linear" as any,
            range: color_gradient ? [color_gradient.low, color_gradient.mid, color_gradient.high] : ["#00AFBB", "#E7B800", "#FC4E07"],
            domain: contrib_range ? [contrib_range.min, contrib_range.max] : [0, Math.max(...variables.map(v => v.contrib))],
            label: "contrib"
        };

        const plot = Plot.plot({
            width: width - 80, // Leave room for legend
            height: height,
            aspectRatio: 1, // CRITICAL: keeps circle circular
            grid: true,
            inset: 60,
            x: {
                domain: [-1.1, 1.1],
                label: config.x_label || "Dim1"
            },
            y: {
                domain: [-1.1, 1.1],
                label: config.y_label || "Dim2"
            },
            color: colorOptions,
            marks: [
                Plot.line(circleData, { x: "x", y: "y", stroke: "#999", strokeWidth: 1.5, strokeOpacity: 0.6 }),
                Plot.ruleX([0], { stroke: "#333", strokeDasharray: "4,4", strokeOpacity: 0.4 }),
                Plot.ruleY([0], { stroke: "#333", strokeDasharray: "4,4", strokeOpacity: 0.4 }),
                Plot.link(variables, {
                    x1: 0, y1: 0, x2: "x", y2: "y",
                    stroke: "contrib",
                    markerEnd: "arrow",
                    strokeWidth: 2
                }),
                Plot.text(variables, {
                    x: "x", y: "y",
                    text: "name",
                    fill: "contrib",
                    dy: ((d: PCAVariable) => d.y > 0 ? -15 : 15) as any,
                    dx: ((d: PCAVariable) => d.x > 0 ? 10 : -10) as any,
                    fontSize: 11,
                    fontWeight: 600,
                    textAnchor: ((d: PCAVariable) => d.x > 0 ? "start" : "end") as any
                }),
                Plot.tip(variables, Plot.pointer({
                    x: "x", y: "y",
                    title: (d) => `${d.name}\nContrib: ${d.contrib.toFixed(2)}%\nCos2: ${d.cos2.toFixed(3)}`
                }))
            ]
        });

        const legend = Plot.legend({
            color: colorOptions,
            direction: "vertical",
            label: "contrib",
            height: 200,
            width: 80,
            marginLeft: 20
        } as any);

        containerRef.current.appendChild(plot);
        legendRef.current.appendChild(legend);

        return () => {
            plot.remove();
        };
    }, [data, width, height]);

    return (
        <div className="w-full flex flex-col items-center">
            {data?.config?.title && (
                <h3 className="text-xl font-bold mb-4 text-center leading-relaxed max-w-2xl">{data.config.title}</h3>
            )}
            <div className="flex items-center justify-center gap-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100 overflow-visible">
                <div ref={containerRef} className="flex-shrink-0" />
                <div ref={legendRef} className="flex-shrink-0" />
            </div>
        </div>
    );
};

export default PCAArrowPlot;
