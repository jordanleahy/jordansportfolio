import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { generateSEOMetadata, SEO_DEFAULTS } from "@/utils/seoHelpers";
import { useLibraryCollections } from "@/hooks/useLibraryCollections";
import { CollectionCard } from "@/components/library/CollectionCard";

const Library = () => {
  const [query, setQuery] = useState("");
  const { data = [], isLoading, error } = useLibraryCollections();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(c =>
      (c.title || "").toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q) ||
      (c.handle || "").toLowerCase().includes(q)
    );
  }, [data, query]);

  const seo = generateSEOMetadata({
    title: "Library of Shared Collections",
    description: "Browse published visual collections and resources.",
    url: "/library",
    type: "website",
  });

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta property="og:title" content={seo.ogTitle} />
        <meta property="og:description" content={seo.ogDescription} />
        <meta property="og:image" content={seo.image} />
        <meta property="og:url" content={`${SEO_DEFAULTS.siteUrl}/library`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.ogTitle} />
        <meta name="twitter:description" content={seo.ogDescription} />
        <meta name="twitter:image" content={seo.image} />
        <link rel="canonical" href={`${SEO_DEFAULTS.siteUrl}/library`} />
      </Helmet>

      <header className="container py-12">
        <h1 className="text-3xl font-bold tracking-tight">Library of Shared Collections</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Discover published, curated collections of visuals and insights.
        </p>
        <div className="mt-6 max-w-md">
          <label htmlFor="library-search" className="sr-only">Search library</label>
          <input
            id="library-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search collections..."
            className="w-full h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
        </div>
      </header>

      <main className="container pb-16">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card h-56 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-lg border p-4 text-destructive">
            Failed to load library. Please try again.
          </div>
        )}

        {!isLoading && !error && (
          <section aria-label="Collections" className="">
            <div className="mb-4 text-sm text-muted-foreground">
              {filtered.length} collection{filtered.length === 1 ? "" : "s"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c) => (
                <CollectionCard key={c.id} collection={c} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
};

export default Library;
