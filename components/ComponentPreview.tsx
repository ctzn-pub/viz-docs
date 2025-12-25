'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getApiDataUrl, getComponentByPath } from '@/lib/registry-data';
import { getTransformForPath } from '@/lib/data-transforms';
import { COMPONENT_MAP } from '@/lib/component-registry';
import usTopoJSON from '@/app/data/geo/us_counties_10m.json';

interface ComponentPreviewProps {
    path: string;
    scale?: number;
    className?: string;
    initialData?: any;
}

class PreviewErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <div className="text-[10px] text-muted-foreground font-medium">
                        Preview unavailable
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export function ComponentPreview({ path, scale = 1, className, initialData }: ComponentPreviewProps) {
    const [data, setData] = useState<unknown>(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);

    const meta = getComponentByPath(path);
    const Component = COMPONENT_MAP[path];

    useEffect(() => {
        if (!meta || initialData) return;

        const fetchData = async () => {
            try {
                // Determine if we should fetch data (some use static or need more complex loading)
                const url = getApiDataUrl(meta.sampleData);
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch data');

                let jsonData;
                // Handle CSV vs JSON
                if (meta.sampleData.endsWith('.csv')) {
                    const text = await response.text();
                    const lines = text.trim().split('\n');
                    const headers = lines[0].split(',').map(h => h.trim());
                    jsonData = lines.slice(1).map(line => {
                        const values = line.split(',');
                        const obj: any = {};
                        headers.forEach((h, i) => obj[h] = values[i]?.trim());
                        return obj;
                    });
                } else {
                    jsonData = await response.json();
                }

                // Handle wrapped data format for BRFSS state components
                if (path.includes('brfss/state-bar') && jsonData.data) {
                    jsonData = jsonData.data;
                }

                const transform = getTransformForPath(path);
                if (transform) {
                    setData(transform(jsonData));
                } else {
                    setData(jsonData);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [meta, path]);

    if (!meta || !Component) return null;

    const isPlot = path.startsWith('plot/');

    return (
        <div className={cn(
            "relative w-full h-full flex items-center justify-center overflow-hidden",
            className
        )}>
            {loading ? (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="text-[10px] text-muted-foreground font-medium px-4 text-center">
                    Data unavailable
                </div>
            ) : (
                <PreviewErrorBoundary>
                    <div
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'center center',
                        }}
                        className={cn(
                            "w-full transition-transform duration-500",
                            isPlot ? "dark:invert-[0.9] dark:hue-rotate-180" : ""
                        )}
                    >
                        <Component
                            {...(typeof data === 'object' && !Array.isArray(data) ? data : { data })}
                            width={400} // Target width for previews
                            height={250}
                            {...(path === 'plot/geo/state-map-v1' ? { usTopoJSON } : {})}
                            // Force simpler rendering if component supports it
                            isPreview={true}
                        />
                    </div>
                </PreviewErrorBoundary>
            )}
        </div>
    );
}
