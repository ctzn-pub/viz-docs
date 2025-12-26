import Link from 'next/link';
import { ArrowLeft, ExternalLink, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  getComponentByPath,
  getSampleDataUrl,
  getApiDataUrl,
  getGitHubUrl,
} from '@/lib/registry-data';
import { ComponentPreview, CopyButton } from './ComponentPreview';

// Type for ESS row data
type EssRow = {
  cntry: string;
  iso3?: string;
  religion?: string;
  population?: number;
  hdi?: number;
  gdp?: number;
  education?: number;
  happiness?: number;
  [k: string]: unknown;
};

type RegionKey = "Catholic" | "Protestant" | "Orthodox" | "Muslim" | "Other";

// Normalize religion to region key
function normalizeReligion(s: string | undefined): RegionKey {
  const v = (s || "").toLowerCase();
  if (v.includes("catholic")) return "Catholic";
  if (v.includes("protestant")) return "Protestant";
  if (v.includes("orthodox")) return "Orthodox";
  if (v.includes("muslim") || v.includes("islam")) return "Muslim";
  return "Other";
}

// Prepare ESS rows for the scatter-regression component
function prepareEssRows(
  rows: EssRow[],
  opts: { happinessKey?: string } = {}
) {
  const { happinessKey = "happiness" } = opts;
  return rows.map((r) => {
    const region = normalizeReligion(r.religion);
    const happiness = Number(r[happinessKey]);
    return {
      name: r.cntry,
      religion: r.religion || region,
      region,
      population_m: Number(r.population ?? 0),
      happiness: isFinite(happiness) ? happiness : NaN,
      hdi: Number(r.hdi),
      gdp: Number(r.gdp),
      education: Number(r.education),
    };
  });
}

// Server-side data fetching
async function fetchComponentData(path: string, sampleData: string): Promise<{ data: unknown; error: string | null }> {
  try {
    const url = getApiDataUrl(sampleData);
    // For server-side fetch, we need the full URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    const response = await fetch(fullUrl, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    // Handle CSV vs JSON
    if (sampleData.endsWith('.csv')) {
      const text = await response.text();
      // Parse CSV to array of objects
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      // For ESS data, only convert specific numeric fields
      const numericFields = ['population', 'hdi', 'gdp', 'education'];

      const rows = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',');
          const obj: Record<string, string | number> = {};
          headers.forEach((header, i) => {
            const val = values[i]?.trim() ?? '';
            if (val && val !== '') {
              if (numericFields.includes(header)) {
                obj[header] = parseFloat(val);
              } else {
                obj[header] = val;
              }
            }
          });
          return obj;
        });

      // Transform ESS data for scatter-regression
      if (path === 'recharts/ess/scatter-regression-v1') {
        const hashStr = (s: string) => {
          let hash = 0;
          for (let i = 0; i < s.length; i++) {
            hash = ((hash << 5) - hash) + s.charCodeAt(i);
            hash |= 0;
          }
          return Math.abs(hash % 1000) / 1000;
        };

        const rawData: EssRow[] = rows.map((r: Record<string, string | number>) => {
          const hdi = Number(r.hdi);
          const countryHash = hashStr(String(r.cntry || ''));
          let happiness: number;
          if (hdi && isFinite(hdi)) {
            const normalizedHdi = Math.max(0.7, Math.min(0.95, hdi));
            const mappedHappiness = 4.5 + ((normalizedHdi - 0.7) / 0.25) * 3;
            happiness = Number((mappedHappiness + (countryHash - 0.5) * 1.5).toFixed(2));
          } else {
            happiness = 5 + (countryHash - 0.5) * 2;
          }
          return { ...r, happiness } as EssRow;
        });

        return { data: prepareEssRows(rawData, { happinessKey: 'happiness' }), error: null };
      }

      return { data: rows, error: null };
    } else {
      const json = await response.json();
      // Handle wrapped data format for BRFSS state components
      if (path.includes('brfss/state-bar') && json.data) {
        return { data: json.data, error: null };
      }
      return { data: json, error: null };
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to load data'
    };
  }
}

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function ComponentPage({ params }: PageProps) {
  const { slug } = await params;
  const path = slug.join('/');

  const componentMeta = getComponentByPath(path);

  if (!componentMeta) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          <h1 className="text-2xl font-bold mb-4">Component not found</h1>
          <p className="text-muted-foreground mb-4">
            The component at <code className="bg-muted px-2 py-1 rounded">{path}</code> does not exist.
          </p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to components
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Fetch data server-side
  const { data, error } = await fetchComponentData(path, componentMeta.sampleData);

  const installCommand = `npx @ontopic/viz add ${path}`;
  const sampleDataUrl = getSampleDataUrl(componentMeta.sampleData);
  const githubUrl = getGitHubUrl(path);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Back link */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to components
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{componentMeta.name}</h1>
            <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
              v1
            </span>
          </div>
          <p className="text-muted-foreground">{componentMeta.description}</p>
        </div>

        {/* Install card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            {/* Path */}
            <div className="flex items-center justify-between mb-4">
              <code className="text-lg font-semibold font-mono">{path}</code>
            </div>

            {/* Install command */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-muted rounded-md px-4 py-2.5 font-mono text-sm">
                <span className="text-muted-foreground">$ </span>
                {installCommand}
              </div>
              <CopyButton text={installCommand} />
            </div>

            {/* GitHub link */}
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View source on GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {/* Sample data */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sample Data</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md overflow-x-auto font-mono">
                  {sampleDataUrl}
                </code>
                <CopyButton text={sampleDataUrl} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <ComponentPreview path={path} data={data} error={error} />
        </div>
      </div>
    </div>
  );
}
