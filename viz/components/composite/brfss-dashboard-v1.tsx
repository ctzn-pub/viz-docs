'use client';

import React, { useState, useMemo } from 'react';
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  GraduationCap,
  DollarSign,
  Palette,
  LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DemographicValue {
  value: number;
  state_count?: number;
}

interface DemographicCategory {
  levels: string[];
  values: Record<string, DemographicValue>;
}

interface BrfssData {
  clean_title: string;
  topic?: string;
  question?: string;
  response?: string;
  data_value_type?: string;
  data_value_unit?: string;
  year?: number;
  overall?: number;
  by_demographic: Record<string, DemographicCategory>;
}

interface CategoryInfo {
  icon: LucideIcon;
  color: string;
}

const categoryReference: Record<string, CategoryInfo> = {
  'Age Group': { icon: Users, color: 'text-blue-500' },
  'Education Attained': { icon: GraduationCap, color: 'text-green-500' },
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

interface ChartDataPoint {
  name: string;
  value: number;
  state_count?: number;
}

const ChartComponent = ({
  chartType,
  data,
  ylabel,
}: {
  chartType: string;
  data: ChartDataPoint[];
  ylabel: string;
}) => {
  const XAxisProps = {
    dataKey: 'name',
    interval: 0,
    tick: {
      fill: 'hsl(var(--foreground))',
      fontSize: 10,
      textAnchor: 'end' as const,
      dy: 10,
    },
    height: 80,
    padding: { left: 30, right: 30 },
  };

  const YAxisProps = {
    label: {
      value: ylabel,
      angle: -90,
      position: 'insideLeft' as const,
      offset: 0,
      style: { textAnchor: 'middle' },
    },
    tick: { fill: 'hsl(var(--foreground))' },
  };

  const TooltipContent = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0].payload;
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-lg rounded text-sm">
        <p className="font-medium">{point.name}</p>
        <p className="text-blue-600">{`Value: ${Number(point.value).toFixed(1)}%`}</p>
        {point.state_count && (
          <p className="text-gray-500 text-xs">{`States: ${point.state_count}`}</p>
        )}
      </div>
    );
  };

  switch (chartType) {
    case 'dot':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis {...XAxisProps} type="category" allowDuplicatedCategory={false} />
            <YAxis {...YAxisProps} />
            <Tooltip content={<TooltipContent />} />
            <Scatter
              data={data}
              dataKey="value"
              fill="hsl(var(--foreground))"
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      );
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis {...XAxisProps} />
            <YAxis {...YAxisProps} />
            <Tooltip content={<TooltipContent />} />
            <Line
              dataKey="value"
              stroke="hsl(var(--foreground))"
              isAnimationActive={false}
              dot={true}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis {...XAxisProps} />
            <YAxis {...YAxisProps} />
            <Tooltip content={<TooltipContent />} />
            <Bar dataKey="value" fill="hsl(var(--foreground))" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      );
    default:
      return null;
  }
};

export default function BrfssDashboard({ data }: { data: BrfssData }) {
  const [chartType, setChartType] = useState('dot');

  const demographicCategories = useMemo(() => {
    if (!data?.by_demographic) return [];

    return Object.entries(data.by_demographic).map(([key, category]) => {
      const chartData: ChartDataPoint[] = category.levels.map((level) => ({
        name: level,
        value: category.values[level]?.value ?? 0,
        state_count: category.values[level]?.state_count,
      }));

      return {
        key,
        ...getCategoryInfo(key),
        data: chartData,
      };
    });
  }, [data]);

  const toggleChartType = () => {
    const types = ['dot', 'line', 'bar'];
    const currentIndex = types.indexOf(chartType);
    setChartType(types[(currentIndex + 1) % types.length]);
  };

  if (!demographicCategories.length) {
    return <div className="text-muted-foreground">No demographic data available.</div>;
  }

  const ylabel = `${data.data_value_type || 'Prevalence'} (${data.data_value_unit || '%'})`;

  return (
    <Card className="p-4 w-full">
      <CardContent>
        <div className="mb-4">
          <h2 className="text-xl font-bold">{data.clean_title}</h2>
          {data.question && <p className="text-sm text-muted-foreground mt-1">{data.question}</p>}
          {data.overall !== undefined && (
            <p className="text-sm text-muted-foreground">
              Overall: <span className="font-medium">{Number(data.overall).toFixed(1)}%</span>
              {data.year && ` (${data.year})`}
            </p>
          )}
        </div>

        <Tabs defaultValue={demographicCategories[0]?.key} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {demographicCategories.map((category) => (
              <TabsTrigger key={category.key} value={category.key} className="text-xs">
                <category.icon size={12} className={`mr-1 ${category.color}`} />
                {category.key}
              </TabsTrigger>
            ))}
          </TabsList>

          {demographicCategories.map((category) => (
            <TabsContent key={category.key} value={category.key}>
              <div className="w-full">
                <div className="mb-4">
                  <Button onClick={toggleChartType} variant="outline" size="sm">
                    Switch to{' '}
                    {chartType === 'dot' ? 'Line' : chartType === 'line' ? 'Bar' : 'Dot'} Chart
                  </Button>
                </div>
                <ChartComponent chartType={chartType} data={category.data} ylabel={ylabel} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col items-start text-sm text-muted-foreground">
        <p>Data source: CDC Behavioral Risk Factor Surveillance System</p>
        {data.response && (
          <p>
            Note: {chartType === 'bar' ? 'Bars' : 'Points'} represent {data.response.toLowerCase()}.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
