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

export default function DemographicLineChart({
    data,
    ylabel = 'Value (%)',
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
            <div className="border rounded-lg p-6">
                <div>
                    <p className="text-gray-600">No demographic data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Demographic Line Chart with Error Bars
                </h3>
            </div>
            <div>
                <Tabs value={activeTab || undefined} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${demographicCategories.length}, 1fr)` }}>
                        {demographicCategories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <TabsTrigger key={category.key} value={category.key}>
                                    <Icon className={`w-4 h-4 mr-2 ${category.color}`} />
                                    {category.key}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {demographicCategories.map((category) => (
                        <TabsContent key={category.key} value={category.key} className="space-y-4">
                            <div className="flex justify-center mt-4">
                                <LineChart
                                    width={600}
                                    height={400}
                                    data={category.data}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
                                    className="w-full h-full"
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="break_out"
                                        label={{
                                            value: category.data[0]?.break_out_category || '',
                                            position: 'insideBottom',
                                            offset: -10,
                                        }}
                                        interval={0}
                                        tick={{
                                            fill: 'hsl(var(--foreground))',
                                            fontSize: 10,
                                            textAnchor: 'end',
                                            dy: 10,
                                        }}
                                        height={80}
                                        padding={{ left: 30, right: 30 }}
                                    />
                                    <YAxis
                                        label={{
                                            value: ylabel,
                                            angle: -90,
                                            position: 'insideLeft',
                                            offset: 0,
                                            style: { textAnchor: 'middle' },
                                        }}
                                        tick={{ fill: 'hsl(var(--foreground))' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                        }}
                                    />
                                    <Line
                                        dataKey="value"
                                        stroke='hsl(var(--foreground))'
                                        isAnimationActive={false}
                                        dot={true}
                                    >
                                        <ErrorBar
                                            dataKey="error"
                                            width={4}
                                            strokeWidth={2}
                                            stroke="grey"
                                        />
                                    </Line>
                                </LineChart>
                            </div>

                            <p className="text-sm text-gray-600 text-center">
                                Error bars represent 95% confidence intervals
                            </p>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
}
