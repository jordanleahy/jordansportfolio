import React from 'react';
import { useLibraryCollections } from '@/hooks/useLibraryCollections';
import { CollectionCard } from '@/components/library/CollectionCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';

interface LibraryCollectionsFallbackProps {
  onCreateTheme?: () => void;
}

export const LibraryCollectionsFallback = ({ onCreateTheme }: LibraryCollectionsFallbackProps) => {
  const { data: collections = [], isLoading } = useLibraryCollections();

  if (isLoading) {
    return <CalendarSkeletonLoader />;
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Get Started with Library Themes
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          No posts in this theme yet. Browse our curated library collections for inspiration 
          or create your first post to get started.
        </p>
        {onCreateTheme && (
          <Button onClick={onCreateTheme} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Post
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <CollectionCard 
            key={collection.id} 
            collection={collection} 
          />
        ))}
      </div>
    </div>
  );
};