'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink, Database, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ComponentPreview } from '@/components/ComponentPreview';
import { cn } from '@/lib/utils';

interface GalleryCardProps {
    path: string;
    name: string;
    description: string;
    category: string;
    initialData?: any;
}

export function GalleryCard({ path, name, description, category, initialData }: GalleryCardProps) {
    const isPlot = path.startsWith('plot/');
    const library = isPlot ? 'Plot' : 'Recharts';

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="h-full"
        >
            <Link href={`/${path}`} className="block h-full group">
                <Card className="h-full overflow-hidden border-border bg-card hover:border-primary/30 transition-all shadow-sm hover:shadow-md flex flex-col">
                    {/* Preview Area */}
                    <div className={cn(
                        "h-40 border-b border-border flex items-center justify-center relative overflow-hidden",
                        isPlot ? "bg-white dark:bg-[#f8f9fa]" : "bg-[#fcfcfd] dark:bg-[#0c0c0d]"
                    )}>
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />

                        <ComponentPreview
                            path={path}
                            scale={0.6}
                            initialData={initialData}
                            className="pointer-events-none group-hover:scale-[1.05] transition-transform duration-500"
                        />

                        <div className="absolute top-2 right-2">
                            <span className={cn(
                                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                                isPlot
                                    ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            )}>
                                {library}
                            </span>
                        </div>
                    </div>

                    <CardContent className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {name}
                            </h3>
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                {description}
                            </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-medium">
                                <Activity className="w-3 h-3" />
                                Interactive
                            </div>
                            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </motion.div>
    );
}
