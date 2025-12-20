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
  year: string;
  value: number;
  ci_lower?: number;
  ci_upper?: number;
  n_actual?: number;
  standard_error?: number;
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
  

  // Convert year to a numerical value
  const numericData = data.map((d) => ({
    ...d,
    year: parseInt(d.year, 10), // Convert year to number
  }));

  // Extract metadata for "value" field
  const valueMetadata = dataPointMetadata.find((d) => d.id === 'value');

 

  // Check for duplicate years
  const dataYears = numericData.map((d) => d.year);
  const uniqueYears = new Set(dataYears);
  
  if (dataYears.length !== uniqueYears.size) {
    console.warn('Duplicate years found in the data prop!');

    return <div>Error: Duplicate years detected in the dataset.</div>;
  }

  // Determine min and max years for the domain
  const minYear = Math.min(...numericData.map((d) => d.year));
  const maxYear = Math.max(...numericData.map((d) => d.year));

  
   // Custom tooltip component
   const CustomTooltip = ({ active, payload, label }: any) => {
     if (!active || !payload || !payload.length) return null;

     const dataPoint = payload[0].payload;

     return (
       <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
         <p className="font-medium">{`Year: ${label}`}</p>
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
             data={numericData}
             margin={{
               top: 20,
               right: 30,
               left: 20,
               bottom: 20,
             }}
           >
             <CartesianGrid strokeDasharray="3 3" vertical={false} />

             <XAxis
               dataKey="year"
               type="number" 
               domain={[minYear , maxYear ]}
               tickCount={(maxYear - minYear) / 2}
               tickFormatter={(value) => value.toString()}
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
