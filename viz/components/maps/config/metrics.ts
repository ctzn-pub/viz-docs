export type MetricFormat = "percent" | "currency" | "number"

export interface MetricConfig {
  id: string
  title: string
  description: string
  format: MetricFormat
}

// Health metrics from PMTiles-NYC
export const healthMetrics: Record<string, MetricConfig> = {
  DIABETES_zip: {
    id: "DIABETES_zip",
    title: "Diabetes",
    description: "Diagnosed diabetes among adults aged >=18 years",
    format: "percent",
  },
  BPHIGH_zip: {
    id: "BPHIGH_zip",
    title: "High Blood Pressure",
    description: "High blood pressure among adults aged >=18 years",
    format: "percent",
  },
  CSMOKING_zip: {
    id: "CSMOKING_zip",
    title: "Current Smoking",
    description: "Current smoking among adults aged >=18 years",
    format: "percent",
  },
  STROKE_zip: {
    id: "STROKE_zip",
    title: "Stroke",
    description: "Stroke among adults aged >=18 years",
    format: "percent",
  },
  ARTHRITIS_zip: {
    id: "ARTHRITIS_zip",
    title: "Arthritis",
    description: "Arthritis among adults aged >=18 years",
    format: "percent",
  },
  KIDNEY_zip: {
    id: "KIDNEY_zip",
    title: "Kidney Disease",
    description: "Kidney disease among adults aged >=18 years",
    format: "percent",
  },
  CANCER_zip: {
    id: "CANCER_zip",
    title: "Cancer",
    description: "Cancer (excluding skin cancer) among adults aged >=18 years",
    format: "percent",
  },
  COPD_zip: {
    id: "COPD_zip",
    title: "COPD",
    description: "Chronic obstructive pulmonary disease among adults aged >=18 years",
    format: "percent",
  },
  HIGHCHOL_zip: {
    id: "HIGHCHOL_zip",
    title: "High Cholesterol",
    description: "High cholesterol among adults aged >=18 years",
    format: "percent",
  },
  DEPRESSION_zip: {
    id: "DEPRESSION_zip",
    title: "Depression",
    description: "Depression among adults aged >=18 years",
    format: "percent",
  },
}

// Demographic metrics from PMTiles-usa
export const demographicMetrics: Record<string, MetricConfig> = {
  total_population: {
    id: "total_population",
    title: "Total Population",
    description: "Total population count",
    format: "number",
  },
  median_income: {
    id: "median_income",
    title: "Median Income",
    description: "Median household income in dollars",
    format: "currency",
  },
  median_home_value: {
    id: "median_home_value",
    title: "Median Home Value",
    description: "Median value of owner-occupied housing units",
    format: "currency",
  },
  median_rent: {
    id: "median_rent",
    title: "Median Rent",
    description: "Median gross rent",
    format: "currency",
  },
  pct_college_plus: {
    id: "pct_college_plus",
    title: "College Education",
    description: "Percentage with bachelor's degree or higher",
    format: "percent",
  },
  pct_white: {
    id: "pct_white",
    title: "White Population",
    description: "Percentage of population that is white",
    format: "percent",
  },
  pct_black: {
    id: "pct_black",
    title: "Black Population",
    description: "Percentage of population that is black",
    format: "percent",
  },
  pct_hispanic: {
    id: "pct_hispanic",
    title: "Hispanic Population",
    description: "Percentage of population that is Hispanic",
    format: "percent",
  },
  pct_asian: {
    id: "pct_asian",
    title: "Asian Population",
    description: "Percentage of population that is Asian",
    format: "percent",
  },
}

// Utility function to format values based on metric type
export function formatMetricValue(value: number | null | undefined, format: MetricFormat): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "No data"
  }

  switch (format) {
    case "percent":
      return `${value.toFixed(1)}%`
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value)
    case "number":
      return new Intl.NumberFormat("en-US").format(Math.round(value))
    default:
      return String(value)
  }
}
