import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Share } from 'lucide-react';

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
  image_1_1_url: string;
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
  const firstPost = items[0];
  const pageTitle = firstPost?.title || collection?.title || `${handle} – Photo Collection`;
  const pageDescription = firstPost?.description || collection?.description || `A shareable image collection published by ${handle}.`;

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

  const shareCollection = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pageTitle,
          text: pageDescription,
          url: publicUrl,
        });
      } catch (error) {
        // User cancelled the share or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to copying link if Web Share API isn't available
      copyLink();
    }
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
        {firstPost?.image_1_1_url && (
          <meta property="og:image" content={firstPost.image_1_1_url.startsWith('http') ? firstPost.image_1_1_url : `${window.location.origin}${firstPost.image_1_1_url}`} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-left">
            <div>Create Free Illustrations on</div>
            <div className="flex items-center gap-2">
              <img src="/lovable-uploads/80e9ea7a-2cf5-4c9c-91f9-e663036e85e2.png" alt="Story Ship logo" className="h-8 w-auto" /> 
              <a href="https://www.jordanleahy.com/stories" className="underline hover:no-underline">Story Ship</a>
            </div>
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={shareCollection}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" onClick={copyLink}>Copy link</Button>
            <Link to="/signup">
              <Button variant="secondary">Sign Up</Button>
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
            <h2 className="text-xl font-semibold mb-4">{firstPost?.title || collection?.title || 'Image Collection'}</h2>
            <p className="text-muted-foreground mb-6">{firstPost?.description || collection?.description || 'A collection of images'}</p>
            <section aria-label="Shared images">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <figure key={item.id} className="rounded-md overflow-hidden border">
                    <img
                      src={item.image_1_1_url || item.image_16_9_url}
                      alt={`${item.title} – shared image`}
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
