'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink, Database, Activity, Terminal, Code2 } from 'lucide-react';
import {
    getComponentByPath,
    getSampleDataUrl,
    getGitHubUrl
} from '@/lib/registry-data';
import usTopoJSON from '@/app/data/geo/us_counties_10m.json';
import { CopyButton } from '@/components/CopyButton';
import { getTransformForPath } from '@/lib/data-transforms';

interface ComponentDocProps {
    path: string;
    children?: React.ReactNode;
    Component: React.ComponentType<any>;
}

function LocalCopyButton({ text }: { text: string }) {
    return <CopyButton text={text} className="h-8 w-8" />;
}

function parseCSV(text: string): Record<string, string>[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => obj[h] = values[i]?.trim() || '');
        return obj;
    });
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
                const url = getSampleDataUrl(meta.sampleData);
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch data');
                let jsonData;
                if (meta.sampleData.endsWith('.csv')) {
                    const text = await response.text();
                    jsonData = parseCSV(text);
                } else {
                    jsonData = await response.json();
                }
                if (path.includes('brfss/state-bar') && jsonData.data) {
                    jsonData = jsonData.data;
                }
                const transform = getTransformForPath(path);
                setData(transform ? transform(jsonData) : jsonData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [meta, path]);

    if (!meta) return <div className="p-12 text-center text-muted-foreground">Component not found</div>;

    const installCommand = `npx @ontopic/viz add ${path}`;
    const sampleDataUrl = getSampleDataUrl(meta.sampleData);
    const githubUrl = getGitHubUrl(path);
    const isPlot = path.startsWith('plot/');

    return (
        <div className="space-y-8 py-6 px-4 max-w-5xl mx-auto">
            <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight text-foreground">{meta.name}</h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">{meta.description}</p>
            </div>
            <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Interactive Preview</h2>
                </div>
                <div className={cn("rounded-xl border border-border shadow-lg overflow-hidden min-h-[450px] flex items-center justify-center relative", isPlot ? "bg-white dark:bg-[#fafafa]" : "bg-card")}>
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="w-full p-8 relative z-10 flex justify-center">
                        {loading ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Loading...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center space-y-3">
                                <div className="inline-flex p-3 bg-destructive/10 rounded-full text-destructive"><Activity className="w-6 h-6" /></div>
                                <h3 className="text-base font-bold text-foreground">Failed to load</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{error}</p>
                            </div>
                        ) : (
                            <div className={cn("w-full max-w-4xl flex justify-center", isPlot && "text-[#1a1a1a]")}>
                                <Component {...(typeof data === 'object' && !Array.isArray(data) ? data : { data })} width={isPlot ? 700 : 800} {...(path === 'plot/geo/state-map-v1' ? { usTopoJSON, height: 500 } : {})} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-border bg-card/50 space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground"><Terminal className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wide">Install</span></div>
                    <div className="flex items-center gap-2"><code className="flex-1 text-sm font-mono bg-secondary/50 px-3 py-2.5 rounded-lg border border-border truncate">{installCommand}</code><LocalCopyButton text={installCommand} /></div>
                    <a href={githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"><Code2 className="w-3.5 h-3.5" /> View source <ExternalLink className="w-3 h-3" /></a>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card/50 space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground"><Database className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wide">Sample Data</span></div>
                    <div className="flex items-center gap-2"><code className="flex-1 text-[11px] font-mono bg-secondary/50 px-3 py-2.5 rounded-lg border border-border truncate">{sampleDataUrl}</code><LocalCopyButton text={sampleDataUrl} /></div>
                </div>
            </div>
            {children && <div className="prose prose-zinc dark:prose-invert max-w-none pt-6 border-t border-border">{children}</div>}
        </div>
    );
}
