import React from 'react';
import { useLibraryCollections } from '@/hooks/useLibraryCollections';
import { CollectionCard } from '@/components/library/CollectionCard';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';
export const PublicCollectionsSection = () => {
  const {
    data: collections = [],
    isLoading
  } = useLibraryCollections();
  if (isLoading) {
    return <section className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured Collections
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Explore curated collections of insights, analysis, and perspectives from the healthcare technology space.
            </p>
          </div>
          <CalendarSkeletonLoader />
        </div>
      </section>;
  }
  if (collections.length === 0) {
    return null;
  }
  return <section className="py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Created using Story Ship</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Story Ship is an agentic thougtht to visualization application that I created from scratch.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map(collection => <CollectionCard key={collection.id} collection={collection} />)}
        </div>
      </div>
    </section>;
};