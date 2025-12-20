'use client';

import Link from 'next/link';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { REGISTRY } from '@/lib/registry-data';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} className="h-7 w-7">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

export default function Home() {
  const totalComponents = Object.values(REGISTRY).reduce(
    (sum, category) => sum + category.components.length,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">@ontopic/viz</h1>
          <p className="text-lg text-muted-foreground mb-6">
            {totalComponents} visualization components you can copy into your project.
          </p>

          {/* Install instruction */}
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg mb-4">
            <code className="text-sm flex-1 font-mono">
              npx @ontopic/viz add {'<path>'}
            </code>
            <a
              href="https://github.com/ctzn-pub/ontopic-viz-components"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              GitHub <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Component List */}
        <div className="space-y-10">
          {Object.entries(REGISTRY).map(([categoryPath, category]) => (
            <section key={categoryPath}>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">{category.title}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>

              <div className="border rounded-lg divide-y">
                {category.components.map((component) => {
                  const fullPath = `${categoryPath}/${component.id}`;
                  const installCommand = `npx @ontopic/viz add ${fullPath}`;

                  return (
                    <div key={component.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/${fullPath}`}
                            className="font-medium hover:underline"
                          >
                            {component.name}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {component.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {fullPath}
                          </code>
                          <CopyButton text={installCommand} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
