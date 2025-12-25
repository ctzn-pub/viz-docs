'use client';

import Link from 'next/link';
import { Copy, Check, ExternalLink, Search, Sparkles, Layout, BarChart3, Map, Zap } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { REGISTRY } from '@/lib/registry-data';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-8 w-8 hover:bg-white/20 transition-colors"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/60" />}
    </Button>
  );
}

const CategoryIcon = ({ path }: { path: string }) => {
  if (path.includes('geo')) return <Map className="h-5 w-5" />;
  if (path.includes('recharts')) return <BarChart3 className="h-5 w-5" />;
  if (path.includes('plot')) return <Zap className="h-5 w-5" />;
  return <Layout className="h-5 w-5" />;
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const totalComponents = useMemo(() =>
    Object.values(REGISTRY).reduce((sum, cat) => sum + cat.components.length, 0),
    []
  );

  const filteredRegistry = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const result: typeof REGISTRY = {};

    Object.entries(REGISTRY).forEach(([path, category]) => {
      const filteredComponents = category.components.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        path.toLowerCase().includes(query)
      );

      if (filteredComponents.length > 0) {
        result[path] = { ...category, components: filteredComponents };
      }
    });

    return result;
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-indigo-500/30">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse"
        />
        <div
          className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] rounded-full bg-rose-600/10 blur-[100px] animate-pulse delay-700"
        />
        <div
          className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[100px] animate-pulse delay-1000"
        />
      </div>

      <div className="relative container mx-auto py-20 px-6 max-w-6xl">
        {/* Hero Section */}
        <div
          className="flex flex-col items-center text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>{totalComponents} Premium Components Ready to Use</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            @ontopic/viz
          </h1>

          <p className="text-xl text-white/40 max-w-2xl leading-relaxed mb-10">
            A curated collection of beautiful, production-ready visualization components.
            Copy-paste directly into your project and start building.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-indigo-400 transition-colors" />
              <Input
                placeholder="Search components..."
                className="w-full pl-11 h-12 bg-white/5 border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all rounded-xl backdrop-blur-md text-white placeholder:text-white/20"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button asChild variant="outline" className="h-12 px-6 border-white/10 hover:bg-white/5 rounded-xl backdrop-blur-sm shrink-0">
              <a href="https://github.com/ctzn-pub/ontopic-viz-components" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                GitHub <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Component Grid */}
        <div className="space-y-20">
          {Object.entries(filteredRegistry).map(([categoryPath, category]) => (
            <section key={categoryPath} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div
                className="flex items-center gap-3 mb-8"
              >
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <CategoryIcon path={categoryPath} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white/90">{category.title}</h2>
                  <p className="text-sm text-white/40">{category.description}</p>
                </div>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {category.components.map((component) => {
                  const fullPath = `${categoryPath}/${component.id}`;
                  const installCommand = `npx @ontopic/viz add ${fullPath}`;

                  return (
                    <div
                      key={component.id}
                      className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 backdrop-blur-sm flex flex-col h-full"
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <Link
                            href={`/${fullPath}`}
                            className="text-lg font-semibold text-white/90 group-hover:text-indigo-400 transition-colors"
                          >
                            {component.name}
                          </Link>
                          <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-wider">
                            v1
                          </div>
                        </div>
                        <p className="text-sm text-white/40 leading-relaxed mb-6">
                          {component.description}
                        </p>
                      </div>

                      <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2 border border-white/5">
                            <code className="text-[11px] font-mono text-white/60 truncate">
                              {fullPath}
                            </code>
                            <div className="ml-auto">
                              <CopyButton text={installCommand} />
                            </div>
                          </div>
                        </div>
                        <Button asChild size="sm" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-white/10">
                          <Link href={`/${fullPath}`}>
                            <ExternalLink className="h-4 w-4 text-white/60" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {Object.keys(filteredRegistry).length === 0 && (
            <div className="text-center py-20">
              <p className="text-white/40 text-lg">No components found matching "{searchQuery}"</p>
              <Button
                variant="link"
                className="text-indigo-400 mt-2"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-32 pt-12 border-t border-white/5 text-center">
          <p className="text-white/20 text-sm">
            Built with passion for data visualization. &copy; 2025 @ontopic/viz
          </p>
        </footer>
      </div>
    </div>
  );
}
