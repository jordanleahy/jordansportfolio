import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Share, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { User } from '@supabase/supabase-js';

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
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const publicUrl = `${window.location.origin}/public/collections/${handle}/${id}`;
  const firstPost = items[0];
  const pageTitle = firstPost?.title || collection?.title || `${handle} – Photo Collection`;
  const pageDescription = firstPost?.description || collection?.description || `A shareable image collection published by ${handle}.`;

  useEffect(() => {
    // Check authentication state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleDownload = async (item: SharedItem) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const imageUrl = item.image_1_1_url || item.image_16_9_url;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.title} @ JordanLeahy.com.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
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
            <span className="block md:inline">Create Free Illustrations on </span>
            <span className="flex items-center gap-2 md:inline-flex justify-start">
              <img src="/lovable-uploads/80e9ea7a-2cf5-4c9c-91f9-e663036e85e2.png" alt="Story Ship logo" className="h-8 w-auto" /> 
              <a href="https://www.jordanleahy.com/stories" className="underline hover:no-underline">Story Ship</a>
            </span>
          </h1>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={shareCollection} className="flex-1 md:flex-none">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <a href="https://www.jordanleahy.com/auth" className="flex-1 md:flex-none">
              <Button variant="secondary" className="w-full md:w-auto">Sign Up</Button>
            </a>
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
                  <figure key={item.id} className="rounded-md overflow-hidden border relative group">
                    <div className="relative">
                      <img
                        src={item.image_1_1_url || item.image_16_9_url}
                        alt={`${item.title} – shared image`}
                        loading="lazy"
                        className="w-full h-auto block"
                      />
                      <button
                        onClick={() => handleDownload(item)}
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        aria-label={`Download ${item.title}`}
                      >
                        <Download className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
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

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="max-w-none bg-transparent border-0 p-0 shadow-none">
          <div className="relative w-[95vw] md:w-[700px] mx-auto">
            {/* Background Image */}
            <div 
              className="absolute inset-0 rounded-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: 'url(/lovable-uploads/0768e481-0efe-4e8f-8822-3806ba974f3b.png)'
              }}
            />
            {/* Glass-morphism overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-8 py-12 text-center bg-background/20 backdrop-blur border border-white/20 shadow-2xl rounded-full">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Account Required</h2>
              <p className="text-base md:text-lg text-foreground/80 max-w-md">
                You need to be signed in to download images. Create a free account to access downloads and other features.
              </p>
              <div className="w-full max-w-sm">
                <a href="https://www.jordanleahy.com/auth" className="w-full block">
                  <Button className="w-full mb-3" size="lg">Sign Up</Button>
                </a>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
