import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AppLayout from '@/components/layout/AppLayout';
import { ComparisonHero } from '@/components/comparison/ComparisonHero';
import { ComparisonTable } from '@/components/comparison/ComparisonTable';
import { FeatureComparison } from '@/components/comparison/FeatureComparison';
import { SummaryInsights } from '@/components/comparison/SummaryInsights';
import { UseCaseSuitability } from '@/components/comparison/UseCaseSuitability';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useStructuredComparisonBySlug } from '@/hooks/useComparisonsStructured';
const ComparisonDetail = () => {
  const { comparisonType } = useParams<{ comparisonType: string }>();
  const { data: structuredComparison, isLoading: isLoadingStructured } = useStructuredComparisonBySlug(comparisonType || '');

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

  if (isLoadingStructured) {
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

  // Use only structured comparison data
  if (!structuredComparison) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Comparison Not Found</h1>
            <p className="text-muted-foreground mb-6">The comparison you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/comparisons">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Comparisons
              </Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Transform structured comparison to match component format
  const company1 = structuredComparison.companies?.find(c => c.company_position === 1);
  const company2 = structuredComparison.companies?.find(c => c.company_position === 2);
  const insight1 = structuredComparison.insights?.find(i => i.company_position === 1);
  const insight2 = structuredComparison.insights?.find(i => i.company_position === 2);
  
  const data = {
    title: structuredComparison.title,
    metaTitle: structuredComparison.meta_title,
    metaDescription: structuredComparison.meta_description,
    company1: {
      name: company1?.name || 'Company 1',
      location: company1?.headquarters || 'N/A',
      founded: company1?.founded || 'N/A',
      headquarters: company1?.headquarters || 'N/A',
      keyBenefits: company1?.key_benefits || [],
      uniqueStrengths: company1?.unique_strengths || []
    },
    company2: {
      name: company2?.name || 'Company 2', 
      location: company2?.headquarters || 'N/A',
      founded: company2?.founded || 'N/A',
      headquarters: company2?.headquarters || 'N/A',
      keyBenefits: company2?.key_benefits || [],
      uniqueStrengths: company2?.unique_strengths || []
    },
    features: structuredComparison.features?.map(f => ({
      feature: f.feature_name,
      company1: f.company1_value,
      company2: f.company2_value
    })) || [],
    summaryInsights: {
      company1: insight1?.insight_text || '',
      company2: insight2?.insight_text || ''
    },
    useCases: structuredComparison.use_cases?.map(u => ({
      useCase: u.use_case,
      bestFit: u.best_fit
    })) || [],
  };
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