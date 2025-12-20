/**
 * Statistical Utilities for Recharts Visualizations
 * Provides functions for statistical calculations and transformations
 */

export interface QuartileData {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
  iqr: number;
}

/**
 * Calculate quartiles and identify outliers for box plot
 */
export function calculateQuartiles(data: number[]): QuartileData {
  if (data.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0, outliers: [], iqr: 0 };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  const q1 = quantile(sorted, 0.25);
  const median = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;

  // Outliers are beyond 1.5 * IQR from quartiles
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
  const nonOutliers = sorted.filter(v => v >= lowerFence && v <= upperFence);

  const min = nonOutliers.length > 0 ? nonOutliers[0] : sorted[0];
  const max = nonOutliers.length > 0 ? nonOutliers[nonOutliers.length - 1] : sorted[n - 1];

  return { min, q1, median, q3, max, outliers, iqr };
}

/**
 * Calculate quantile value
 */
export function quantile(sortedData: number[], p: number): number {
  if (sortedData.length === 0) return 0;
  if (p <= 0) return sortedData[0];
  if (p >= 1) return sortedData[sortedData.length - 1];

  const index = (sortedData.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
}

/**
 * Calculate mean
 */
export function mean(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0) / data.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(data: number[]): number {
  if (data.length === 0) return 0;
  const avg = mean(data);
  const squareDiffs = data.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = mean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate confidence interval for mean
 */
export function confidenceInterval(data: number[], confidence: number = 0.95): { mean: number; lower: number; upper: number; error: number } {
  const avg = mean(data);
  const std = standardDeviation(data);
  const n = data.length;

  // Using t-distribution approximation (simplified with z-score for large n)
  const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.96;
  const standardError = std / Math.sqrt(n);
  const marginError = zScore * standardError;

  return {
    mean: avg,
    lower: avg - marginError,
    upper: avg + marginError,
    error: marginError
  };
}

/**
 * Kernel Density Estimation for violin plots
 */
export function kernelDensity(
  data: number[],
  bandwidth?: number,
  points: number = 50
): Array<{ x: number; density: number }> {
  const n = data.length;
  if (n === 0) return [];

  // Silverman's rule of thumb for bandwidth
  const std = standardDeviation(data);
  const bw = bandwidth ?? 1.06 * std * Math.pow(n, -1 / 5);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const padding = range * 0.1;

  const result: Array<{ x: number; density: number }> = [];

  for (let i = 0; i < points; i++) {
    const x = min - padding + ((max - min + 2 * padding) * i) / (points - 1);
    let density = 0;

    for (const value of data) {
      const u = (x - value) / bw;
      // Gaussian kernel
      density += Math.exp((-1 / 2) * u * u) / Math.sqrt(2 * Math.PI);
    }

    result.push({ x, density: density / (n * bw) });
  }

  return result;
}

/**
 * Create histogram bins using Sturges' rule
 */
export function createHistogram(
  data: number[],
  bins?: number
): Array<{ bin: string; count: number; binStart: number; binEnd: number; binMid: number }> {
  if (data.length === 0) return [];

  const numBins = bins ?? Math.ceil(Math.log2(data.length) + 1);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / numBins;

  const histogram = Array.from({ length: numBins }, (_, i) => {
    const binStart = min + i * binWidth;
    const binEnd = min + (i + 1) * binWidth;
    const binMid = (binStart + binEnd) / 2;
    return {
      bin: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
      count: 0,
      binStart,
      binEnd,
      binMid
    };
  });

  data.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
    histogram[binIndex].count++;
  });

  return histogram;
}

/**
 * Calculate linear regression
 */
export function linearRegression(
  x: number[],
  y: number[]
): { slope: number; intercept: number; rSquared: number; residuals: number[]; fitted: number[] } {
  const n = x.length;
  if (n === 0 || n !== y.length) {
    return { slope: 0, intercept: 0, rSquared: 0, residuals: [], fitted: [] };
  }

  const meanX = mean(x);
  const meanY = mean(y);

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;

  // Calculate R-squared and residuals
  const fitted = x.map(xi => slope * xi + intercept);
  const residuals = y.map((yi, i) => yi - fitted[i]);

  const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, rSquared, residuals, fitted };
}

/**
 * Calculate theoretical quantiles for Q-Q plot
 */
export function qqPlotData(data: number[]): Array<{ theoretical: number; sample: number }> {
  if (data.length === 0) return [];

  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  return sorted.map((value, i) => {
    // Calculate theoretical quantile from standard normal distribution
    const p = (i + 0.5) / n; // Plotting position
    const theoretical = normalQuantile(p);

    return {
      theoretical,
      sample: value
    };
  });
}

/**
 * Approximate inverse normal CDF (for Q-Q plot)
 */
function normalQuantile(p: number): number {
  // Beasley-Springer-Moro algorithm approximation
  const a = [
    -3.969683028665376e+01,
    2.209460984245205e+02,
    -2.759285104469687e+02,
    1.383577518672690e+02,
    -3.066479806614716e+01,
    2.506628277459239e+00
  ];

  const b = [
    -5.447609879822406e+01,
    1.615858368580409e+02,
    -1.556989798598866e+02,
    6.680131188771972e+01,
    -1.328068155288572e+01
  ];

  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
    4.374664141464968e+00,
    2.938163982698783e+00
  ];

  const d = [
    7.784695709041462e-03,
    3.224671290700398e-01,
    2.445134137142996e+00,
    3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
           (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
}

/**
 * Calculate beeswarm layout for swarm plot
 */
export function beeswarmLayout(
  values: number[],
  categoryIndex: number,
  radius: number = 3
): Array<{ x: number; y: number; value: number }> {
  const sorted = values
    .map((value, idx) => ({ value, originalIndex: idx }))
    .sort((a, b) => a.value - b.value);

  const positions: Array<{ x: number; y: number; value: number }> = [];
  const placed: Array<{ x: number; y: number }> = [];

  sorted.forEach(({ value }) => {
    let x = categoryIndex;
    let y = value;
    let offset = 0;
    let direction = 1;

    // Find non-overlapping position
    while (true) {
      const overlaps = placed.some(p => {
        const dx = x - p.x;
        const dy = y - p.y;
        return Math.sqrt(dx * dx + dy * dy) < radius * 2.2;
      });

      if (!overlaps) {
        break;
      }

      offset += radius * 0.8;
      x = categoryIndex + offset * direction;
      direction *= -1;
    }

    positions.push({ x, y, value });
    placed.push({ x, y });
  });

  return positions;
}

/**
 * Add jitter to values for strip plot
 */
export function addJitter(categoryIndex: number, count: number, jitterAmount: number = 0.3): number[] {
  return Array.from({ length: count }, () =>
    categoryIndex + (Math.random() - 0.5) * jitterAmount
  );
}
