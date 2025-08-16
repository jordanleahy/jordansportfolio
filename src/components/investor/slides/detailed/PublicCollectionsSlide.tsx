import React from 'react';
import { useLibraryCollections } from '@/hooks/useLibraryCollections';
import { CollectionCard } from '@/components/library/CollectionCard';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';

export const PublicCollectionsSlide: React.FC = () => {
  const { data: collections = [], isLoading } = useLibraryCollections();

  return (
    <div className="h-full flex flex-col justify-center items-start pl-12 pr-16 py-12 text-left">
      <div className="mb-6">
        <span className="text-sm text-muted-foreground font-medium">15/15</span>
      </div>
      
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-primary leading-tight">
        Live Platform Showcase
      </h1>
      
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground">
        Real content created by our growing community
      </h2>
      
      <div className="space-y-6 max-w-6xl w-full">
        <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl">
          Our platform is already generating high-quality collections across healthcare technology, 
          with engaged users creating and sharing valuable insights.
        </p>
        
        {isLoading ? (
          <div className="mt-8">
            <CalendarSkeletonLoader />
          </div>
        ) : collections.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {collections.slice(0, 6).map((collection) => (
              <CollectionCard 
                key={collection.id} 
                collection={collection} 
              />
            ))}
          </div>
        ) : (
          <p className="text-lg text-muted-foreground italic mt-8">
            Collections are being curated and will be available soon.
          </p>
        )}
      </div>
    </div>
  );
};