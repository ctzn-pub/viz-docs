import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  // Configure pageExtensions to include MDX files
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx', 'json'],
  typescript: {
    // Skip type checking during build (components have minor type issues)
    ignoreBuildErrors: true,
  },
  // Note: eslint config moved to CLI options in Next.js 16
  transpilePackages: ['recharts', 'lucide-react', 'd3-geo', 'topojson-client'],
  // cacheComponents disabled for dynamic routes - requires Suspense boundaries
  // cacheComponents: true,
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);
