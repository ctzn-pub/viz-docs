'use client';

import React, { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ErrorBar,
    ResponsiveContainer,
} from 'recharts';
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

interface DemographicBarChartProps {
    data: Record<string, any>;
    ylabel?: string;
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
    'Age Group': { icon: Users, color: 'text-blue-500' },
    'Education Attained': { icon: GraduationCap, color: 'text-green-500' },
    Gender: { icon: UserCircle2, color: 'text-purple-500' },
    'Household Income': { icon: DollarSign, color: 'text-yellow-500' },
    'Race/Ethnicity': { icon: Palette, color: 'text-red-500' },
};

const defaultCategoryInfo: CategoryInfo = {
    icon: Users,
    color: 'text-gray-500',
};

function getCategoryInfo(category: string): CategoryInfo {
    return categoryReference[category] || defaultCategoryInfo;
}

interface DemographicCategory extends CategoryInfo {
    key: string;
    data: DataPoint[];
}

export default function DemographicBarChart({
    data,
    ylabel = 'Value (%)',
}: DemographicBarChartProps) {
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

    // Map categories to theme colors
    const getThemeColor = (index: number) => {
        const colors = [
            'var(--chart-1)',
            'var(--chart-2)',
            'var(--chart-3)',
            'var(--chart-4)',
            'var(--chart-5)',
        ];
        return colors[index % colors.length];
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) return null;
        const dataPoint = payload[0].payload;

        return (
            <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-4 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                <p className="font-semibold text-foreground mb-2 text-sm">{label}</p>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground text-sm">Value</span>
                    <span className="font-mono font-medium text-foreground">
                        {dataPoint.value?.toFixed(1)}%
                    </span>
                </div>
                <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                    <div className="flex justify-between gap-2">
                        <span>95% CI</span>
                        <span className="font-mono">
                            [{dataPoint.confidence_limit_low?.toFixed(1)}, {dataPoint.confidence_limit_high?.toFixed(1)}]
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    if (demographicCategories.length === 0) {
        return (
            <div className="border border-dashed border-border rounded-xl p-12 text-center bg-card/50">
                <p className="text-muted-foreground">No demographic data available to display.</p>
            </div>
        );
    }

    const activeCategoryIndex = demographicCategories.findIndex(c => c.key === activeTab);
    const currentColor = getThemeColor(activeCategoryIndex >= 0 ? activeCategoryIndex : 0);

    return (
        <div className="w-full bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
            <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">
                    Demographic Breakdown
                </h3>
            </div>

            <Tabs value={activeTab || undefined} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6 w-full h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1">
                    {demographicCategories.map((category) => {
                        const Icon = category.icon;
                        return (
                            <TabsTrigger
                                key={category.key}
                                value={category.key}
                                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                            >
                                <Icon className="w-4 h-4 opacity-70" />
                                {category.key}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {demographicCategories.map((category) => (
                    <TabsContent key={category.key} value={category.key} className="space-y-4 animate-in fade-in duration-300 slide-in-from-left-2">
                        <div className="w-full h-[450px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={category.data}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                    barSize={40}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="var(--border)"
                                        strokeOpacity={0.4}
                                    />
                                    <XAxis
                                        dataKey="break_out"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fill: 'var(--muted-foreground)',
                                            fontSize: 11,
                                            textAnchor: 'end',
                                        }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        dy={10}
                                        interval={0}
                                    />
                                    <YAxis
                                        label={{
                                            value: ylabel,
                                            angle: -90,
                                            position: 'insideLeft',
                                            offset: 0,
                                            style: {
                                                textAnchor: 'middle',
                                                fill: 'var(--muted-foreground)',
                                                fontSize: 12,
                                                fontWeight: 500
                                            },
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)/0.5' }} />
                                    <Bar
                                        dataKey="value"
                                        fill={currentColor}
                                        radius={[6, 6, 0, 0]}
                                        isAnimationActive={true}
                                        animationDuration={1000}
                                        animationBegin={0}
                                    >
                                        <ErrorBar
                                            dataKey="error"
                                            width={4}
                                            strokeWidth={1.5}
                                            stroke="var(--foreground)" // Better visibility than grey
                                            strokeOpacity={0.4}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex justify-center">
                            <p className="text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border border-border/50">
                                Note: Error bars represent 95% confidence intervals
                            </p>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
