'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink, Database, Activity, Terminal, Code2 } from 'lucide-react';
import { getSampleDataUrl, getGitHubUrl, GITHUB_BASE } from '@/lib/registry-data';
import { CopyButton } from '@/components/CopyButton';

interface VariantMeta {
    id: string;
    name: string;
    description: string;
    sampleData: string;
    Component: React.ComponentType<any>;
}

interface ComponentFamilyDocProps {
    categoryPath: string; // e.g., 'recharts/generic'
    familyId: string; // e.g., 'timeseries'
    title: string;
    description: string;
    variants: VariantMeta[];
    children?: React.ReactNode;
}

function LocalCopyButton({ text }: { text: string }) {
    return <CopyButton text={text} className="h-8 w-8" />;
}

function VariantSection({
    variant,
    categoryPath,
    familyId
}: {
    variant: VariantMeta;
    categoryPath: string;
    familyId: string;
}) {
    const [data, setData] = useState<unknown>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fullPath = `${categoryPath}/${familyId}-${variant.id}-v1`;
    const githubUrl = getGitHubUrl(fullPath);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const url = getSampleDataUrl(variant.sampleData);
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch data');
                const jsonData = await response.json();
                setData(jsonData);
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

                <div className="rounded-xl border border-border shadow-lg overflow-hidden min-h-[400px] flex items-center justify-center relative bg-card">
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
                            <div className="w-full max-w-4xl flex justify-center">
                                <Component
                                    {...(typeof data === 'object' && !Array.isArray(data) ? data : { data })}
                                    width={800}
                                />
                            </div>
                        )}
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

export function ComponentFamilyDoc({
    categoryPath,
    familyId,
    title,
    description,
    variants,
    children
}: ComponentFamilyDocProps) {
    const installCommand = `npx @ontopic/viz add ${categoryPath}/${familyId}`;

    return (
        <div className="space-y-12 py-6 px-4 max-w-5xl mx-auto">
            {/* Header */}
            <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tight text-foreground">{title}</h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">{description}</p>

                {/* Quick nav */}
                <div className="flex flex-wrap gap-2 pt-2">
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

            {/* Install command */}
            <div className="p-5 rounded-xl border border-border bg-card/50 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Terminal className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Install all variants</span>
                </div>
                <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-secondary/50 px-3 py-2.5 rounded-lg border border-border truncate">
                        {installCommand}
                    </code>
                    <LocalCopyButton text={installCommand} />
                </div>
            </div>

            {/* Variant sections */}
            <div className="space-y-16">
                {variants.map((variant) => (
                    <VariantSection
                        key={variant.id}
                        variant={variant}
                        categoryPath={categoryPath}
                        familyId={familyId}
                    />
                ))}
            </div>

            {/* Additional content from MDX */}
            {children && (
                <div className="prose prose-zinc dark:prose-invert max-w-none pt-6 border-t border-border">
                    {children}
                </div>
            )}
        </div>
    );
}
