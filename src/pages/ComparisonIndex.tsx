import React from 'react';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { useComparisons } from '@/hooks/useComparisonsStructured';
import { ComparisonIndexCard } from '@/components/comparison/ComparisonIndexCard';

const ComparisonIndex = () => {
  const { data: comparisons, isLoading } = useComparisons();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading comparisons...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Helmet>
        <title>Healthcare Platform Comparisons | Jordan Leahy</title>
        <meta name="description" content="In-depth comparisons of leading healthcare AI platforms, clinical documentation improvement tools, and revenue cycle management solutions." />
        <meta property="og:title" content="Healthcare Platform Comparisons" />
        <meta property="og:description" content="Expert analysis and side-by-side comparisons of healthcare technology platforms." />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Platform Comparisons
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              In-depth analysis and side-by-side comparisons of leading healthcare technology platforms
            </p>
          </div>

          {!comparisons || comparisons.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold text-foreground mb-2">No Comparisons Available</h3>
              <p className="text-muted-foreground">Check back soon for detailed platform comparisons.</p>
            </div>
          ) : (
            <div className="grid gap-8 max-w-5xl mx-auto">
              {comparisons.map((comparison) => (
                <ComparisonIndexCard key={comparison.id} comparison={comparison} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ComparisonIndex;