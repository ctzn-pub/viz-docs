import { ExternalLink } from 'lucide-react';
import { REGISTRY } from '@/lib/registry-data';
import { GalleryCard } from '@/components/GalleryCard';
import { CopyButton } from '@/components/CopyButton';
import { getCachedComponentData } from '@/lib/data-fetcher';

export default async function Home() {
  const totalComponents = Object.values(REGISTRY).reduce(
    (sum, category) => {
      const componentCount = (category.components || []).length;
      const familyCount = (category.families || []).length;
      return sum + componentCount + familyCount;
    },
    0
  );

  // Fetch data for all components in parallel (cached with 'use cache')
  const categories = await Promise.all(
    Object.entries(REGISTRY).map(async ([categoryPath, category]) => {
      // Process families (show as single items linking to family page)
      const familiesWithData = await Promise.all(
        (category.families || []).map(async (family) => {
          const path = `${categoryPath}/${family.id}`;
          // Use first variant's sample data for preview
          const initialData = await getCachedComponentData(`${categoryPath}/${family.id}-${family.variants[0].id}-v1`);
          return {
            id: family.id,
            name: family.name,
            description: family.description,
            path,
            initialData,
          };
        })
      );

      // Process standalone components
      const componentsWithData = await Promise.all(
        (category.components || []).map(async (component) => {
          const path = `${categoryPath}/${component.id}`;
          const initialData = await getCachedComponentData(path);
          return { ...component, path, initialData };
        })
      );

      return {
        ...category,
        categoryPath,
        components: [...familiesWithData, ...componentsWithData],
      };
    })
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-16 px-4 max-w-6xl">
        {/* Hero Section */}
        <div className="mb-16 space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground text-pretty">
              Explore Global Data Stories
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed text-pretty">
              Beautifully crafted, production-ready visualization components built with
              <span className="text-foreground font-bold"> Recharts</span> and
              <span className="text-foreground font-bold"> Observable Plot</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 p-1.5 px-4 bg-secondary rounded-full border border-border shadow-sm">
              <code className="text-sm font-mono text-primary font-bold">
                npx @ontopic/viz add {'<path>'}
              </code>
              <CopyButton text="npx @ontopic/viz add" variant="ghost" className="h-6 w-6" iconClassName="h-3 w-3" />
            </div>

            <a
              href="https://github.com/ctzn-pub/ontopic-viz-components"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors px-4 py-2"
            >
              GitHub <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="space-y-20">
          {categories.map((category) => (
            <section key={category.categoryPath} className="space-y-8">
              <div className="flex items-end justify-between border-b pb-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">{category.title}</h2>
                  <p className="text-sm text-muted-foreground font-medium">{category.description}</p>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 bg-secondary px-2 py-0.5 rounded">
                  {category.components.length} components
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.components.map((component) => (
                  <GalleryCard
                    key={component.id}
                    path={component.path}
                    name={component.name}
                    description={component.description}
                    category={category.title}
                    initialData={component.initialData}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
