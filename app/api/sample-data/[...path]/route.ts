import { NextRequest, NextResponse } from 'next/server';

const SAMPLE_DATA_BASE = 'https://ontopic-public-data.t3.storage.dev/sample-data';
const CDC_DATA_BASE = 'https://ontopic-public-data.t3.storage.dev/cdc-data';

// Caching is now handled by Next.js 16 Cache Components

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');

  // Determine the base URL based on the path
  let url: string;
  if (pathStr.startsWith('cdc-data/')) {
    // Handle CDC data paths
    url = `https://ontopic-public-data.t3.storage.dev/${pathStr}`;
  } else {
    // Default to sample-data
    url = `${SAMPLE_DATA_BASE}/${pathStr}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'force-cache',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch data: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';

    // Handle CSV files
    if (pathStr.endsWith('.csv') || contentType.includes('text/csv')) {
      const text = await response.text();
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/csv',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    // Handle JSON files
    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching sample data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
