'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/viz/ui/button";
import { Input } from "@/viz/ui/input";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

interface StateData {
  state_name: string;
  overall: number | null;
}

interface Data {
  state_data: {
    [key: string]: StateData;
  };
  question: string;
  response: string;
  clean_title: string;
  year: number;
}

interface SortedDataItem {
  code: string;
  state: string;
  overall: number;
}

interface StateBarChartProps {
  data: Data;
}

export default function StateBarChart({ data }: StateBarChartProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedData = Object.entries(data.state_data)
    .filter((entry): entry is [string, StateData & { overall: number }] => (entry[1] as any).overall !== null)
    .map(([code, data]): SortedDataItem => ({
      code,
      state: data.state_name,
      overall: data.overall
    }))
    .sort((a, b) => sortOrder === 'desc' ? b.overall - a.overall : a.overall - b.overall)
    .filter(item =>
      item.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold">{data.clean_title}</h2>
          <span className="text-md text-gray-500">({data.year})</span>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-md text-gray-500">{data.question}</span>
        </div>

        <div className="flex justify-between items-center mb-4">
          <Input
            placeholder="Search states..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={toggleSort} variant="outline">
            Sort {sortOrder === 'desc' ? 'Ascending' : 'Descending'}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={`${isExpanded ? 'h-auto' : 'h-[400px]'}`}>
        <ResponsiveContainer width="100%" height={isExpanded ? 800 : 400}>
          <BarChart data={sortedData} layout="vertical" margin={{ right: 20, top: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              label={{ value: `Response: ${data.response} (%)`, position: 'bottom', offset: 0 }}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              dataKey="state"
              type="category"
              width={180}
              interval={isExpanded ? 0 : 5}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, `Response: ${data.response}`]}
              labelFormatter={(label: string) => `State: ${label}`}
            />
            <Bar dataKey="overall" fill="#4A4A4A" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center mt-4">
        <Button onClick={() => setIsExpanded(!isExpanded)} variant="outline">
          {isExpanded ? (
            <>
              See less <ChevronUp className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Expand <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2 mt-6">
        <span className="text-sm text-gray-500">Source: CDC Behavioral Risk Factor Surveillance System</span>
      </div>
    </div>
  );
}