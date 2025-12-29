'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink, Terminal, Code2, Activity, Database } from 'lucide-react';
import { getSampleDataUrl, getGitHubUrl } from '@/lib/registry-data';
import { CopyButton } from '@/components/CopyButton';
import { TableOfContents } from '@/components/TableOfContents';

function LocalCopyButton({ text }: { text: string }) {
    return <CopyButton text={text} className="h-8 w-8" />;
}

// Import all health scatter components
import HealthScatterBasic from '@/viz/components/plot/health/health-scatter-basic-v1';
import HealthScatterRegression from '@/viz/components/plot/health/health-scatter-regression-v1';
import HealthScatterFaceted from '@/viz/components/plot/health/health-scatter-faceted-v1';

interface VariantConfig {
    id: string;
    name: string;
    description: string;
    sampleData: string;
    componentPath: string;
    Component: React.ComponentType<any>;
}

const variants: VariantConfig[] = [
    {
        id: 'basic',
        name: 'Basic',
        description: 'A foundational scatter plot for examining the relationship between health metrics, such as Obesity and Diabetes prevalence.',
        sampleData: 'health-obesity-diabetes.json',
        componentPath: 'plot/health/health-scatter-basic-v1',
        Component: HealthScatterBasic,
    },
    {
        id: 'regression',
        name: 'Regression',
        description: 'Combines point-level data with a statistical trend line to highlight correlations and model predictions.',
        sampleData: 'health-obesity-diabetes.json',
        componentPath: 'plot/health/health-scatter-regression-v1',
        Component: HealthScatterRegression,
    },
    {
        id: 'faceted',
        name: 'Faceted',
        description: 'Uses "Small Multiples" (faceting) to compare relationships across different categories simultaneously.',
        sampleData: 'health-obesity-diabetes.json',
        componentPath: 'plot/health/health-scatter-faceted-v1',
        Component: HealthScatterFaceted,
    },
];

function VariantSection({ variant }: { variant: VariantConfig }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const githubUrl = getGitHubUrl(variant.componentPath);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const url = getSampleDataUrl(variant.sampleData);
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch data');
                const rawData = await response.json();
                setData(rawData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [variant.sampleData]);

    const Component = variant.Component;

    return (
        <section id={variant.id} className="scroll-mt-20">
            <div className="space-y-4">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {variant.name}
                    </h2>
                    <p className="text-muted-foreground">{variant.description}</p>
                </div>

                <div className="rounded-xl border border-border shadow-lg overflow-hidden min-h-[400px] flex items-center justify-center relative bg-white dark:bg-[#fafafa]">
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="w-full p-6 relative z-10 flex justify-center">
                        {loading ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Loading...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center space-y-3">
                                <div className="inline-flex p-3 bg-destructive/10 rounded-full text-destructive">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-bold text-foreground">Failed to load</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{error}</p>
                            </div>
                        ) : (
                            <div className="w-full max-w-4xl flex justify-center text-[#1a1a1a]">
                                <Component data={data} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Install & Sample Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Install command */}
                    <div className="p-4 rounded-lg border border-border bg-card/50 space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Terminal className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wide">Install</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 text-sm font-mono bg-secondary/50 px-3 py-2 rounded-md border border-border truncate">
                                npx @ontopic/viz add {variant.componentPath}
                            </code>
                            <LocalCopyButton text={`npx @ontopic/viz add ${variant.componentPath}`} />
                        </div>
                    </div>

                    {/* Sample data */}
                    <div className="p-4 rounded-lg border border-border bg-card/50 space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Database className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wide">Sample Data</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 text-sm font-mono bg-secondary/50 px-3 py-2 rounded-md border border-border truncate">
                                {variant.sampleData}
                            </code>
                            <LocalCopyButton text={getSampleDataUrl(variant.sampleData)} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                    <a
                        href={githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <Code2 className="w-4 h-4" />
                        View source
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>
        </section>
    );
}

export default function ScatterplotsPage() {
    return (
        <div className="relative">
            {/* Main content */}
            <div className="py-6 px-4 max-w-4xl mx-auto lg:mr-56 space-y-12">
                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tight text-foreground">Scatterplots</h1>
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                        Scatter plots for examining relationships between health metrics like obesity and diabetes prevalence, with options for regression lines and faceted comparisons.
                    </p>

                    {/* Quick nav (mobile) */}
                    <div className="flex flex-wrap gap-2 pt-2 lg:hidden">
                        {variants.map((variant) => (
                            <a
                                key={variant.id}
                                href={`#${variant.id}`}
                                className="px-3 py-1.5 text-sm font-medium rounded-full border border-border bg-secondary/50 hover:bg-secondary transition-colors"
                            >
                                {variant.name}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Variant sections */}
                <div className="space-y-16">
                    {variants.map((variant) => (
                        <VariantSection key={variant.id} variant={variant} />
                    ))}
                </div>
            </div>

            {/* Right sidebar - Table of Contents (fixed position) */}
            <aside className="hidden lg:block fixed top-6 right-6 w-48">
                <TableOfContents items={variants.map(v => ({ id: v.id, name: v.name }))} />
            </aside>
        </div>
    );
}
