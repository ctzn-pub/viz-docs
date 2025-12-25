'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink, Database } from 'lucide-react';
import {
    getComponentByPath,
    getApiDataUrl,
    getSampleDataUrl,
    getGitHubUrl
} from '@/lib/registry-data';
import usTopoJSON from '@/app/data/geo/us_counties_10m.json';
import { CopyButton } from '@/components/CopyButton';
import { getTransformForPath } from '@/lib/data-transforms';

interface ComponentDocProps {
    path: string;
    children?: React.ReactNode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Component: React.ComponentType<any>;
}

function LocalCopyButton({ text }: { text: string }) {
    return (
        <CopyButton text={text} className="h-8 w-8" />
    );
}

export function ComponentDoc({ path, children, Component }: ComponentDocProps) {
    const [data, setData] = useState<unknown>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const meta = getComponentByPath(path);

    useEffect(() => {
        if (!meta) return;

        const fetchData = async () => {
            try {
                const url = getApiDataUrl(meta.sampleData);
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch data');

                let jsonData = await response.json();

                // Handle wrapped data format for BRFSS state components
                if (path.includes('brfss/state-bar') && jsonData.data) {
                    jsonData = jsonData.data;
                }

                // Internal transform lookup
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

    if (!meta) return <div className="p-12 text-center text-muted-foreground font-medium">Component not found</div>;

    const installCommand = `npx @ontopic/viz add ${path}`;
    const sampleDataUrl = getSampleDataUrl(meta.sampleData);
    const githubUrl = getGitHubUrl(path);

    const isPlot = path.startsWith('plot/');

    return (
        <div className="space-y-12 py-8 px-4 max-w-5xl mx-auto">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
                    {path.split('/')[0]}
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight text-foreground">{meta.name}</h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl font-medium">
                    {meta.description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                <Card className="bg-card border-border shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                    <CardContent className="p-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Installation</span>
                            <div className="relative group/install">
                                <div className="flex items-center gap-3 p-3.5 bg-secondary rounded-lg border border-border group-hover/install:border-primary/30 transition-colors">
                                    <code className="text-sm font-mono text-primary font-bold flex-1 truncate">
                                        {installCommand}
                                    </code>
                                    <LocalCopyButton text={installCommand} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
                            <a
                                href={githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 uppercase tracking-wide"
                            >
                                <ExternalLink className="w-3.5 h-3.5 text-primary" /> View Source
                            </a>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                    <CardContent className="p-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground/60">
                                <Database className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Sample Data</span>
                            </div>
                            <div className="flex items-center gap-3 p-3.5 bg-secondary rounded-lg border border-border">
                                <code className="text-[10px] font-mono text-muted-foreground font-semibold truncate flex-1">
                                    {sampleDataUrl}
                                </code>
                                <LocalCopyButton text={sampleDataUrl} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-border pb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary rounded-lg border border-border shadow-sm">
                            <Activity className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Interactive Preview</h2>
                    </div>
                </div>

                <div className={cn(
                    "rounded-2xl border border-border shadow-2xl overflow-hidden min-h-[500px] flex items-center justify-center relative",
                    isPlot ? "bg-white dark:bg-[#f8f9fa]" : "bg-[#fcfcfd] dark:bg-[#0c0c0d]"
                )}>
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

                    <div className="w-full p-12 relative z-10 flex justify-center">
                        {loading ? (
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Hydrating...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center space-y-4">
                                <div className="inline-flex p-4 bg-destructive/10 rounded-full text-destructive mb-2">
                                    <Activity className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Failed to load payload</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">{error}</p>
                            </div>
                        ) : (
                            <div className={cn(
                                "w-full max-w-4xl flex justify-center",
                                isPlot ? "text-[#1a1a1a]" : "" // Ensure plot labels/text are dark on the light background
                            )}>
                                <Component
                                    {...(typeof data === 'object' && !Array.isArray(data) ? data : { data })}
                                    width={isPlot ? 700 : 800} // Plot usually fits better at 700 on these cards
                                    {...(path === 'plot/geo/state-map-v1' ? { usTopoJSON, height: 500 } : {})}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="prose prose-zinc dark:prose-invert max-w-none pt-12 border-t border-border">
                {children}
            </div>
        </div>
    );
}
import { Activity } from 'lucide-react';
