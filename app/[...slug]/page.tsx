import Link from 'next/link';
import { ArrowLeft, ExternalLink, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  getComponentByPath,
  getSampleDataUrl,
  getGitHubUrl,
} from '@/lib/registry-data';
import usTopoJSON from '@/app/data/geo/us_counties_10m.json';
import { getCachedComponentData } from '@/lib/data-fetcher';
import { CopyButton } from '@/components/CopyButton';
import { VizRenderer } from '@/components/VizRenderer';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

function LocalCopyButton({ text, className }: { text: string; className?: string }) {
  return (
    <CopyButton text={text} className={className} />
  );
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

  // Fetch data on server (cached with 'use cache')
  const data = await getCachedComponentData(path);

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
            <h1 className="text-3xl font-bold tracking-tight">{componentMeta.name}</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-1 rounded">
              v1
            </span>
          </div>
          <p className="text-muted-foreground font-medium">{componentMeta.description}</p>
        </div>

        {/* Install card */}
        <Card className="mb-8 border-border bg-card shadow-sm">
          <CardContent className="pt-6">
            {/* Path */}
            <div className="flex items-center justify-between mb-4">
              <code className="text-lg font-bold font-mono tracking-tight">{path}</code>
            </div>

            {/* Install command */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-secondary/50 rounded-md px-4 py-3 font-mono text-sm border">
                <span className="text-muted-foreground select-none">$ </span>
                {installCommand}
              </div>
              <LocalCopyButton text={installCommand} />
            </div>

            <div className="flex items-center gap-6">
              {/* GitHub link */}
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                View source on GitHub
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Sample data */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sample Data</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] bg-secondary/30 px-3 py-2.5 rounded-md overflow-x-auto font-mono border">
                  {sampleDataUrl}
                </code>
                <LocalCopyButton text={sampleDataUrl} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo */}
        <div className="mb-8">
          <h2 className="text-xl font-bold tracking-tight mb-4">Live Preview</h2>
          <Card className="border-border shadow-md overflow-hidden">
            <CardContent className="p-0">
              {/* Plot-aware container */}
              <div className={path.startsWith('plot/') ? "bg-white dark:bg-[#f8f9fa] p-8" : "bg-card p-8"}>
                <div className="relative">
                  {path.startsWith('plot/') && (
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:15px_15px] z-0" />
                  )}
                  <div className="relative z-10 flex justify-center min-h-[400px]">
                    {!data ? (
                      <div className="flex items-center justify-center text-muted-foreground font-medium">
                        Failed to load preview data
                      </div>
                    ) : (
                      <VizRenderer
                        path={path}
                        data={data}
                        width={850}
                        height={500}
                        usTopoJSON={usTopoJSON}
                        className={path.startsWith('plot/') ? "dark:invert-[0.9] dark:hue-rotate-180" : ""}
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
