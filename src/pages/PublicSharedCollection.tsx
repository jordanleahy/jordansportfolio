import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface SharedCollection {
  id: string;
  user_id: string;
  handle: string;
  title: string | null;
  description: string | null;
  item_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface SharedItem {
  id: string;
  collection_id: string;
  post_id: string;
  title: string;
  description: string;
  image_16_9_url: string;
  position: number;
  created_at: string;
}

export default function PublicSharedCollection() {
  const { handle, id } = useParams<{ handle: string; id: string }>();
  const [collection, setCollection] = useState<SharedCollection | null>(null);
  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const publicUrl = `${window.location.origin}/public/collections/${handle}/${id}`;
  const pageTitle = collection?.title || `${handle} – 16:9 Photo Collection`;
  const pageDescription = collection?.description || `A shareable 16:9 image collection published by ${handle}.`;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: col, error: colErr } = await supabase
          .from('shared_collections')
          .select('*')
          .eq('id', id)
          .eq('handle', handle)
          .maybeSingle();
        if (colErr) throw colErr;
        if (!col || col.status !== 'published') {
          setError('Not found');
          setCollection(null);
          setItems([]);
          return;
        }

        const { data: it, error: itErr } = await supabase
          .from('shared_collection_items')
          .select('*')
          .eq('collection_id', col.id)
          .order('position', { ascending: true });
        if (itErr) throw itErr;

        if (!active) return;
        setCollection(col as SharedCollection);
        setItems((it || []) as SharedItem[]);
      } catch (e: any) {
        console.error(e);
        setError('Failed to load');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [handle, id]);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(publicUrl); } catch {}
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription.slice(0, 165)} />
        <link rel="canonical" href={publicUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription.slice(0, 165)} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={publicUrl} />
        {items[0]?.image_16_9_url && (
          <meta property="og:image" content={items[0].image_16_9_url.startsWith('http') ? items[0].image_16_9_url : `${window.location.origin}${items[0].image_16_9_url}`} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Created in 5 minutes on <a href="https://www.jordanleahy.com/stories" className="underline hover:no-underline">Story Ship</a>
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={copyLink}>Copy link</Button>
            <Link to="/">
              <Button variant="secondary">Home</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading && (
          <div className="text-muted-foreground">Loading…</div>
        )}
        {error && !loading && (
          <div className="text-destructive">Collection not found.</div>
        )}
        {!loading && !error && (
          <article>
            <h2 className="text-xl font-semibold mb-4">Sepsis Validation and Coding Guidance</h2>
            <p className="text-muted-foreground mb-6">Sepsis is a life-threatening organ dysfunction caused by a dysregulated host response to infection. This post gently reviews when sepsis is considered for coding</p>
            <section aria-label="Shared images">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <figure key={item.id} className="rounded-md overflow-hidden border">
                    <img
                      src={item.image_16_9_url}
                      alt={`${item.title} – shared 16:9 image`}
                      loading="lazy"
                      className="w-full h-auto block"
                    />
                    <figcaption className="p-3">
                      <div className="font-medium">{item.title}</div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          </article>
        )}
      </main>
    </div>
  );
}
