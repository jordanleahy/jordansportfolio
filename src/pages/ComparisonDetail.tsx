
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
import { ChevronRight, ArrowLeft } from 'lucide-react';

const ComparisonDetail = () => {
  const { comparisonType } = useParams<{ comparisonType: string }>();
  
  console.log('Comparison Type:', comparisonType);
  console.log('Available keys:', Object.keys(comparisonDataMap));
  console.log('Data found:', !!comparisonDataMap[comparisonType || '']);
  
  if (!comparisonType || !comparisonDataMap[comparisonType]) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Comparison Not Found</h1>
          <p className="text-muted-foreground">
            The comparison you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Requested: {comparisonType} | Available: {Object.keys(comparisonDataMap).join(', ')}
          </p>
        </div>
      </AppLayout>
    );
  }

  const data = comparisonDataMap[comparisonType];

  return (
    <>
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
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  Need help choosing the right platform for your healthcare organization? 
                  Contact us for a personalized consultation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default ComparisonDetail;
