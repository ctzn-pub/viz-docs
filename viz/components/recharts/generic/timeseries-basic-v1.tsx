'use client';


import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ErrorBar,
  CartesianGrid,
} from 'recharts';

interface DataPoint {
  year: string;  // Can be "2023" or "2023-01-01" format
  value: number;
  ci_lower?: number;
  ci_upper?: number;
  n_actual?: number;
  standard_error?: number;
  date?: string;  // Original date string for display
}

interface DataPointMetadataItem {
  id: string;
  name: string;
  type: string;
  units?: string;
  value_prefix?: Record<string, string>;
  value_suffix?: string;
  categories?: string[];
  var_original?: string;
  label_original?: Record<string, string>;
}

interface TimeSeriesMetadata {
  note?: string;
  type: string;
  title: string;
  subtitle: string;
  source: {
    id: string;
    name: string;
  };
  question?: string;
  years_n?: number;
  year_min?: number;
  year_max?: number;
}

interface TimeSeriesChartProps {
  data: DataPoint[];
  metadata: TimeSeriesMetadata;
  dataPointMetadata: DataPointMetadataItem[];
}

export default function TimeSeriesChart({
  data,
  metadata,
  dataPointMetadata,
}: TimeSeriesChartProps) {
  

  // Extract metadata for "value" field
  const valueMetadata = dataPointMetadata.find((d) => d.id === 'value');

  // Convert date/year strings to timestamps for proper x-axis scaling
  const processedData = data.map((d) => {
    // Try to parse as full date first (e.g., "2023-01-01" or "2023-01")
    const dateAttempt = new Date(d.year);
    const timestamp = !isNaN(dateAttempt.getTime())
      ? dateAttempt.getTime()
      : new Date(`${d.year}-01-01`).getTime(); // Fallback for year-only strings

    return {
      ...d,
      timestamp,
      displayLabel: d.year, // Keep original string for display
    };
  });

  // Determine min and max timestamps for the domain
  const minTimestamp = Math.min(...processedData.map((d) => d.timestamp));
  const maxTimestamp = Math.max(...processedData.map((d) => d.timestamp));

  // Determine if data is yearly or more granular based on data range
  const rangeMs = maxTimestamp - minTimestamp;
  const dayMs = 24 * 60 * 60 * 1000;
  const yearMs = 365 * dayMs;
  const isYearlyData = processedData.length <= 2 || (rangeMs / processedData.length) > (yearMs * 0.5);

  
   // Custom tooltip component
   const CustomTooltip = ({ active, payload }: any) => {
     if (!active || !payload || !payload.length) return null;

     const dataPoint = payload[0].payload;

     return (
       <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
         <p className="font-medium">{dataPoint.displayLabel}</p>
         <p className="text-blue-600">
           {`${valueMetadata?.name}: ${dataPoint.value.toFixed(1)}${valueMetadata?.value_suffix || ''}`}
         </p>
         {dataPoint.ci_lower && dataPoint.ci_upper && (
           <p className="text-gray-600 text-sm">
             {`95% CI: [${dataPoint.ci_lower.toFixed(1)}, ${dataPoint.ci_upper.toFixed(1)}]${valueMetadata?.value_suffix || ''}`}
           </p>
         )}
         {dataPoint.n_actual && (
           <p className="text-gray-600 text-sm">
             {`N: ${dataPoint.n_actual.toLocaleString()}`}
           </p>
         )}
       </div>
     );
   };

   return (
     <div className="w-full">
       <div className="mb-2">
         <h2 className="text-2xl font-bold mb-1">{metadata.title}</h2>
         <p className="text-gray-600 mb-2">{metadata.subtitle}</p>
       </div>

       <div className="w-full h-[400px]">
         <ResponsiveContainer width="100%" height="100%">
         <LineChart
             data={processedData}
             margin={{
               top: 20,
               right: 30,
               left: 20,
               bottom: 20,
             }}
           >
             <CartesianGrid strokeDasharray="3 3" vertical={false} />

             <XAxis
               dataKey="timestamp"
               type="number"
               domain={[minTimestamp, maxTimestamp]}
               tickFormatter={(value) => {
                 const date = new Date(value);
                 if (isYearlyData) {
                   return date.getFullYear().toString();
                 }
                 return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
               }}
               padding={{ left: 20, right: 20 }}
               tick={{ fontSize: 12 }}
             />

             <YAxis
tickFormatter={(value) => {
  const metadata = dataPointMetadata.find(d => d.id === 'value');

  const prefix = (typeof metadata?.value_prefix === 'string')
    ? metadata.value_prefix
    : '';

  const suffix = (typeof metadata?.value_suffix === 'string')
    ? metadata.value_suffix
    : '';

  const num = Number(value);

  let formattedValue: string;

  if (num >= 1_000_000_000) {
    formattedValue = (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (num >= 1_000_000) {
    formattedValue = (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (num >= 1_000) {
    formattedValue = (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  } else {
    formattedValue = num.toLocaleString(); // fallback for smaller numbers
  }

  return `${prefix}${formattedValue}${suffix}`;
}}

               domain={['auto', 'auto']} 
               axisLine={false}
               tickLine={false}
             />

             {/* Tooltip */}
             <Tooltip content={<CustomTooltip />} />

             {/* Line for "value" */}
             <Line
               key="value-line"
               type="linear"
               dataKey="value"
               stroke="#000000"
               strokeWidth={1.5}
               dot={{ r: 3, fill: "#000000" }} 
               activeDot={{ r: 5 }} 
               isAnimationActive={false} 
             >
               {/* Error bars for confidence intervals */}
               <ErrorBar
                 dataKey={(d: DataPoint) =>
                   d.standard_error ? (1.96 * d.standard_error) : 0
                 }
                 stroke="#000000"
                 strokeWidth={1}
                 width={4}
                 name="confidence-intervals"
               />
             </Line>
           </LineChart>
         </ResponsiveContainer>

         {/* Source information */}
         <div className="mb-2">
         <p className="text-sm text-gray-400">
           Source: {metadata.source.name}
         </p>
         </div>

       </div>
     </div>
   );
}
