'use client';

import React, { useState } from 'react';
import {
    Line,
    LineChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ErrorBar,
} from 'recharts';
import { ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    GraduationCap,
    UserCircle2,
    DollarSign,
    Palette,
    LucideIcon,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/viz/ui/tabs";

interface DataPoint {
    break_out: string;
    value: number;
    confidence_limit_low: number;
    confidence_limit_high: number;
    error: [number, number];
    break_out_category: string;
    [key: string]: any;
}

interface DemographicLineChartProps {
    data: Record<string, any>;
    ylabel?: string;
    title?: string;
    description?: string;
}

const domains = {
    'Age Group': ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
    'Education Attained': [
        'Less than H.S.',
        'H.S. or G.E.D.',
        'Some post-H.S.',
        'College graduate',
    ],
    'Household Income': [
        'Less than $15,000',
        '$15,000-$24,999',
        '$25,000-$34,999',
        '$35,000-$49,999',
        '$50,000-$99,999',
        '$100,000-$199,999',
        '$200,000+',
    ],
    'Race/Ethnicity': [
        'White, non-Hispanic',
        'Black, non-Hispanic',
        'Asian, non-Hispanic',
        'Hispanic',
    ],
    Gender: ['Female', 'Male'],
};

interface CategoryInfo {
    icon: LucideIcon;
    color: string;
}

const categoryReference: Record<string, CategoryInfo> = {
    'Age Group': { icon: Users, color: 'var(--chart-1)' },
    'Education Attained': { icon: GraduationCap, color: 'var(--chart-2)' },
    Gender: { icon: UserCircle2, color: 'var(--chart-3)' },
    'Household Income': { icon: DollarSign, color: 'var(--chart-4)' },
    'Race/Ethnicity': { icon: Palette, color: 'var(--chart-5)' },
};

const defaultCategoryInfo: CategoryInfo = {
    icon: Users,
    color: 'var(--muted-foreground)',
};

function getCategoryInfo(category: string): CategoryInfo {
    return categoryReference[category] || defaultCategoryInfo;
}

interface DemographicCategory extends CategoryInfo {
    key: string;
    data: DataPoint[];
}

export default function DemographicLineChart({
    data,
    ylabel = 'Value (%)',
    title = "Demographic Trends",
    description = "Analyzing values across different population segments."
}: DemographicLineChartProps) {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [demographicCategories, setDemographicCategories] = useState<DemographicCategory[]>([]);

    React.useEffect(() => {
        if (!data || typeof data !== 'object') return;

        const categories = Object.entries(data)
            .filter(
                ([_, categoryData]) =>
                    categoryData &&
                    typeof categoryData === 'object' &&
                    Object.values(categoryData).some((value) => value !== null)
            )
            .map(([key, categoryData]) => ({
                key,
                ...getCategoryInfo(key),
                data: Object.entries(categoryData as Record<string, any>)
                    .map(([breakOut, details]: [string, any]) => ({
                        break_out: breakOut,
                        ...details,
                        error: [
                            details.value - details.confidence_limit_low,
                            details.confidence_limit_high - details.value,
                        ],
                        break_out_category: key,
                    }))
                    .sort((a, b) => {
                        const order = domains[key as keyof typeof domains];
                        if (!order) return 0;
                        const indexA = order.indexOf(a.break_out);
                        const indexB = order.indexOf(b.break_out);
                        return indexA - indexB;
                    }),
            }));

        setDemographicCategories(categories);
        if (categories.length > 0 && !activeTab) {
            setActiveTab(categories[0].key);
        }
    }, [data, activeTab]);

    if (demographicCategories.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                    No demographic data available
                </CardContent>
            </Card>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-4 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                    <div className="font-bold text-foreground mb-2 pb-2 border-b border-border">{d.break_out}</div>
                    <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-muted-foreground font-medium">Value:</span>
                            <span className="font-mono font-bold text-primary">{d.value.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-muted-foreground font-medium">95% CI:</span>
                            <span className="font-mono text-xs">[{d.confidence_limit_low.toFixed(1)}, {d.confidence_limit_high.toFixed(1)}]%</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="w-full bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
            <CardHeader className="p-0 border-b border-border pb-6 mb-6">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
                    <CardDescription className="text-base">{description}</CardDescription>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <Tabs value={activeTab || undefined} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/30 p-1 border border-border/50 rounded-xl mb-6">
                        {demographicCategories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <TabsTrigger
                                    key={category.key}
                                    value={category.key}
                                    className="flex-1 min-w-[120px] data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-border border border-transparent transition-all py-2 font-bold text-xs uppercase tracking-wider"
                                >
                                    <Icon className="w-3.5 h-3.5 mr-2 opacity-70" style={{ color: activeTab === category.key ? category.color : 'inherit' }} />
                                    {category.key}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {demographicCategories.map((category) => (
                        <TabsContent key={category.key} value={category.key} className="space-y-4 focus-visible:outline-none">
                            <div className="h-[400px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={category.data}
                                        margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
                                        <XAxis
                                            dataKey="break_out"
                                            axisLine={false}
                                            tickLine={false}
                                            interval={0}
                                            tick={{
                                                fill: 'var(--muted-foreground)',
                                                fontSize: 10,
                                                fontWeight: 600
                                            }}
                                            height={50}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                                            width={50}
                                            label={{
                                                value: ylabel,
                                                angle: -90,
                                                position: 'insideLeft',
                                                style: { fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }
                                            }}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                                        <Line
                                            dataKey="value"
                                            stroke={category.color}
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: category.color, strokeWidth: 2, stroke: 'var(--background)' }}
                                            activeDot={{ r: 6, strokeWidth: 0, fill: category.color }}
                                            isAnimationActive={true}
                                            animationDuration={1000}
                                        >
                                            <ErrorBar
                                                dataKey="error"
                                                width={6}
                                                strokeWidth={2}
                                                stroke="var(--muted-foreground)"
                                                strokeOpacity={0.5}
                                            />
                                        </Line>
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>

            <CardFooter className="p-0 flex items-center gap-2 border-t border-border mt-6 pt-6 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
                <div className="w-3 h-0.5 bg-muted-foreground/30" />
                <span>Error bars represent 95% confidence intervals</span>
            </CardFooter>
        </Card>
    );
}
