'use client';

import React from 'react';
import { COMPONENT_MAP } from '@/lib/component-registry';

interface VizRendererProps {
    path: string;
    data: any;
    width?: number;
    height?: number;
    usTopoJSON?: any;
    className?: string;
}

export function VizRenderer({
    path,
    data,
    width = 850,
    height = 500,
    usTopoJSON,
    className,
}: VizRendererProps) {
    const Component = COMPONENT_MAP[path];

    if (!Component) {
        return (
            <div className="flex items-center justify-center text-muted-foreground font-medium min-h-[400px]">
                Component not found in registry: {path}
            </div>
        );
    }

    return (
        <Component
            {...(typeof data === 'object' && !Array.isArray(data) ? data : { data })}
            width={width}
            height={height}
            {...(path === 'plot/geo/state-map-v1' ? { usTopoJSON } : {})}
            className={className}
        />
    );
}
