import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AppLayout from '@/components/layout/AppLayout';
import { ComparisonHero } from '@/components/comparison/ComparisonHero';
import { ComparisonTable } from '@/components/comparison/ComparisonTable';
import { FeatureComparison } from '@/components/comparison/FeatureComparison';
import { SummaryInsights } from '@/components/comparison/SummaryInsights';
import { UseCaseSuitability } from '@/components/comparison/UseCaseSuitability';
import { comparisonDataMap } from '@/data/comparisonData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useComparisonBySlug } from '@/hooks/useComparisons';
const ComparisonDetail = () => {
  const { comparisonType } = useParams<{ comparisonType: string }>();
  const { data: dynamicComparison, isLoading } = useComparisonBySlug(comparisonType || '');

  if (!comparisonType) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Comparison Not Found</h1>
          <p className="text-muted-foreground">The comparison you're looking for doesn't exist.</p>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading comparison...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Try dynamic comparison first, fallback to static data
  let data = null;
  
  if (dynamicComparison) {
    // Transform dynamic comparison to match static format
    data = {
      title: dynamicComparison.title,
      metaTitle: dynamicComparison.meta_title,
      metaDescription: dynamicComparison.meta_description,
      company1: dynamicComparison.company1_data,
      company2: dynamicComparison.company2_data,
      features: dynamicComparison.features,
      summaryInsights: dynamicComparison.summary_insights,
      useCases: dynamicComparison.use_cases,
    };
  } else {
    // Fallback to static data
    data = comparisonDataMap[comparisonType];
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Comparison Not Found</h1>
          <p className="text-muted-foreground">
            The comparison you're looking for doesn't exist or has been moved.
          </p>
        </div>
      </AppLayout>
    );
  }
  return <>
      <Helmet>
        <title>{data.metaTitle}</title>
        <meta name="description" content={data.metaDescription} />
        <meta property="og:title" content={data.metaTitle} />
        <meta property="og:description" content={data.metaDescription} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={data.metaTitle} />
        <meta name="twitter:description" content={data.metaDescription} />
      </Helmet>
      
      <AppLayout>
        {/* Breadcrumb Navigation - Hidden */}
        {/* <div className="bg-muted/30 border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-sm">
              <Link 
                to="/" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Link 
                to="/comparisons" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Comparisons
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium">
                {data.company1.name} vs {data.company2.name}
              </span>
            </div>
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <Link to="/comparisons">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Comparisons
                </Link>
              </Button>
            </div>
          </div>
         </div> */}

        <ComparisonHero data={data} />
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Technology Company Comparison</h2>
                <ComparisonTable data={data} />
              </CardContent>
            </Card>
            
            <FeatureComparison data={data} />
            
            <SummaryInsights data={data} />
            
            <UseCaseSuitability data={data} />
            
            <Card>
              
            </Card>
          </div>
        </div>
      </AppLayout>
    </>;
};
export default ComparisonDetail;