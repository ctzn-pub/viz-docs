'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink, Terminal, Code2, Activity, Database, ChevronDown } from 'lucide-react';
import { getSampleDataUrl, getGitHubUrl } from '@/lib/registry-data';
import { getTransformForPath } from '@/lib/data-transforms';
import { CopyButton } from '@/components/CopyButton';

function LocalCopyButton({ text }: { text: string }) {
    return <CopyButton text={text} className="h-8 w-8" />;
}

// Data transform code snippets for display
const TRANSFORM_CODE: Record<string, string> = {
    'plot/stats/density-basic-v1': `(rawData) => ({
    data: Array.isArray(rawData) ? rawData : []
})`,
    'plot/stats/density-overlay-v1': `(rawData) => ({
    data: Array.isArray(rawData) ? rawData : []
})`,
};

// Import density components
import DensityBasic from '@/viz/components/plot/stats/density-basic-v1';
import DensityOverlay from '@/viz/components/plot/stats/density-overlay-v1';

interface VariantConfig {
    id: string;
    name: string;
    description: string;
    sampleData: string;
    componentPath: string;
    Component: React.ComponentType<any>;
    isPlot?: boolean;
}

const variants: VariantConfig[] = [
    {
        id: 'basic',
        name: 'Basic',
        description: 'Single variable density distribution curve showing the frequency of values across a continuous range.',
        sampleData: 'county_sample.json',
        componentPath: 'plot/stats/density-basic-v1',
        Component: DensityBasic,
        isPlot: true,
    },
    {
        id: 'overlay',
        name: 'Overlay',
        description: 'Overlaid density curves comparing distributions across different groups or categories.',
        sampleData: 'health-obesity-diabetes.json',
        componentPath: 'plot/stats/density-overlay-v1',
        Component: DensityOverlay,
        isPlot: true,
    },
];

function VariantSection({ variant }: { variant: VariantConfig }) {
    const [transformedData, setTransformedData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [transformOpen, setTransformOpen] = useState(false);

    const githubUrl = getGitHubUrl(variant.componentPath);
    const transformCode = TRANSFORM_CODE[variant.componentPath];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const url = getSampleDataUrl(variant.sampleData);
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch data');
                const rawData = await response.json();

                // Apply the component-specific transform
                const transform = getTransformForPath(variant.componentPath);
                const data = transform ? transform(rawData) : rawData;
                setTransformedData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [variant.sampleData, variant.componentPath]);

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

                <div className={cn(
                    "rounded-xl border border-border shadow-lg overflow-hidden min-h-[400px] flex items-center justify-center relative",
                    variant.isPlot ? "bg-white dark:bg-[#fafafa]" : "bg-card"
                )}>
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
                            <div className={cn("w-full max-w-3xl flex justify-center", variant.isPlot && "text-[#1a1a1a]")}>
                                <Component
                                    {...transformedData}
                                    width={600}
                                    height={400}
                                />
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

                {/* Data Transform Accordion */}
                {transformCode && (
                    <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
                        <button
                            onClick={() => setTransformOpen(!transformOpen)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Code2 className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">Data Transform</span>
                            </div>
                            <ChevronDown className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform",
                                transformOpen && "rotate-180"
                            )} />
                        </button>
                        {transformOpen && (
                            <div className="border-t border-border">
                                <div className="relative">
                                    <pre className="p-4 text-sm font-mono bg-secondary/30 overflow-x-auto">
                                        <code>{transformCode}</code>
                                    </pre>
                                    <div className="absolute top-2 right-2">
                                        <LocalCopyButton text={transformCode} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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

function TableOfContents() {
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const scrollContainer = document.querySelector('main');

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                root: scrollContainer,
                rootMargin: '-20% 0% -60% 0%'
            }
        );

        variants.forEach((variant) => {
            const element = document.getElementById(variant.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <nav className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                On this page
            </span>
            <ul className="space-y-1 pt-2">
                {variants.map((variant) => (
                    <li key={variant.id}>
                        <a
                            href={`#${variant.id}`}
                            className={cn(
                                "block py-1 text-sm transition-colors border-l-2 pl-3 -ml-px",
                                activeId === variant.id
                                    ? "border-primary text-foreground font-medium"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                            )}
                        >
                            {variant.name}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default function DensityPlotsPage() {
    return (
        <div className="relative">
            {/* Main content */}
            <div className="py-6 px-4 max-w-4xl mx-auto lg:mr-56 space-y-12">
                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tight text-foreground">Density Plots</h1>
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                        Distribution visualizations showing the probability density of continuous variables. Compare single distributions or overlay multiple groups.
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
                <TableOfContents />
            </aside>
        </div>
    );
}
