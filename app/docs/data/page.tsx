'use client';

import React, { useState } from 'react';
import {
    Database,
    ExternalLink,
    FileJson,
    FileText,
    Copy,
    Check,
    ChevronDown
} from 'lucide-react';
import { DATA_REGISTRY, DataMetadata } from '@/lib/data-metadata';
import { cn } from '@/lib/utils';

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Copy URL"
        >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
}

function SchemaRow({ data, isOpen, onToggle }: { data: DataMetadata; isOpen: boolean; onToggle: () => void }) {
    return (
        <>
            <tr className="border-b border-border hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                    <button
                        onClick={onToggle}
                        className="flex items-center gap-2"
                    >
                        <ChevronDown className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform",
                            isOpen && "rotate-180"
                        )} />
                        {data.type === 'json' ? (
                            <FileJson className="w-4 h-4 text-blue-500" />
                        ) : (
                            <FileText className="w-4 h-4 text-emerald-500" />
                        )}
                        <code className="text-sm font-mono font-medium text-foreground">{data.id}</code>
                    </button>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs">
                    {data.description}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                    {data.source}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground capitalize">
                    {data.schema.format}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground text-center">
                    {data.schema.fields.length}
                </td>
            </tr>
            {isOpen && (
                <tr className="border-b border-border bg-secondary/20">
                    <td colSpan={5} className="px-8 py-4">
                        <div className="text-xs font-mono space-y-1">
                            {data.schema.fields.map((field, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-400">{field.name}</span>
                                    <span className="text-muted-foreground">:</span>
                                    <span className="text-purple-600 dark:text-purple-400">{field.type}</span>
                                    {field.description && (
                                        <span className="text-muted-foreground italic">// {field.description}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function DataPage() {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const dataEntries = Object.values(DATA_REGISTRY);

    const toggleRow = (id: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <div className="py-8 px-6 max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Database className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Sample Data</h1>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    {dataEntries.length} datasets used across visualization components.
                </p>
            </div>

            {/* Table 1: Quick Reference */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Quick Reference</h2>
                <div className="rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary/50 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">File</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Source</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">URL</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Used By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataEntries.map((data) => (
                                    <tr key={data.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {data.type === 'json' ? (
                                                    <FileJson className="w-4 h-4 text-blue-500 shrink-0" />
                                                ) : (
                                                    <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                                )}
                                                <code className="text-sm font-mono font-medium text-foreground">{data.id}</code>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                            {data.source.split(' ')[0]}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "inline-flex px-2 py-0.5 text-xs font-medium rounded-full",
                                                data.type === 'json'
                                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                            )}>
                                                {data.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <CopyButton text={data.path} />
                                                <a
                                                    href={data.path}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                                                    title="Open"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {data.usedBy.slice(0, 2).map((comp) => (
                                                    <code key={comp} className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                                                        {comp.split('/').pop()}
                                                    </code>
                                                ))}
                                                {data.usedBy.length > 2 && (
                                                    <span className="text-xs text-muted-foreground">+{data.usedBy.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Table 2: Schema Catalog */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Schema Catalog</h2>
                <p className="text-sm text-muted-foreground">Click a row to expand and view field definitions.</p>
                <div className="rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary/50 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">File</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Source</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Format</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Fields</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataEntries.map((data) => (
                                    <SchemaRow
                                        key={data.id}
                                        data={data}
                                        isOpen={expandedRows.has(data.id)}
                                        onToggle={() => toggleRow(data.id)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
