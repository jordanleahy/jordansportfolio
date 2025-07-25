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
  const { data: structuredComparison, isLoading: isLoadingStructured, error } = useStructuredComparisonBySlug(comparisonType || '');

  console.log('🔍 ComparisonDetail - Slug:', comparisonType);
  console.log('📊 ComparisonDetail - Data:', structuredComparison);
  console.log('⏳ ComparisonDetail - Loading:', isLoadingStructured);
  console.log('❌ ComparisonDetail - Error:', error);

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

  // Add data validation - ensure we have minimum required data
  const hasValidData = structuredComparison && 
                      structuredComparison.companies?.length >= 2 &&
                      (structuredComparison.basic_info?.length > 0 || 
                       structuredComparison.features?.length > 0);

  if (!hasValidData) {
    console.warn('⚠️ ComparisonDetail - Invalid data structure:', structuredComparison);
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Comparison Data Incomplete</h1>
            <p className="text-muted-foreground mb-6">This comparison is missing required data. Please try again later.</p>
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
  
  // Create lookup from basic_info table
  const basicInfoLookup = structuredComparison.basic_info?.reduce((acc, info) => {
    acc[info.category] = {
      company1: info.company1_value,
      company2: info.company2_value
    };
    return acc;
  }, {} as Record<string, { company1: string; company2: string }>) || {};

  // Separate key benefits and unique strengths from basic info
  const keyBenefits = structuredComparison.basic_info?.filter(info => 
    info.category.startsWith('Key Benefits')
  ) || [];
  const uniqueStrengths = structuredComparison.basic_info?.filter(info => 
    info.category.startsWith('Unique Strengths')
  ) || [];

  console.log('🏗️ ComparisonDetail - basicInfoLookup:', basicInfoLookup);
  console.log('🏢 ComparisonDetail - Companies:', { company1, company2 });
  
  const data = {
    title: structuredComparison.title,
    metaTitle: structuredComparison.meta_title,
    metaDescription: structuredComparison.meta_description,
    company1: {
      name: company1?.name || `${structuredComparison.title?.split(' vs ')[0] || 'First Company'}`,
      founded: company1?.founded || basicInfoLookup['Founded']?.company1 || 'N/A',
      headquarters: company1?.headquarters || basicInfoLookup['Headquarters']?.company1 || 'N/A',
      companyType: basicInfoLookup['Company Type']?.company1 || 'N/A',
      funding: basicInfoLookup['Funding']?.company1 || 'N/A',
      investors: basicInfoLookup['Investors']?.company1 || 'N/A',
      employeeSize: basicInfoLookup['Employee Size']?.company1 || 'N/A',
      deliveryModel: basicInfoLookup['Delivery Model']?.company1 || 'N/A',
      targetCustomers: basicInfoLookup['Target Customers']?.company1 || 'N/A',
      primarySolutions: basicInfoLookup['Primary Solutions']?.company1 || 'N/A',
      aiCore: basicInfoLookup['AI Core']?.company1 || 'N/A',
      ehrIntegration: basicInfoLookup['EHR Integration']?.company1 || 'N/A',
      clientBase: basicInfoLookup['Notable Customers']?.company1 || 'N/A',
      certifications: basicInfoLookup['Certifications']?.company1 || 'N/A',
      awards: basicInfoLookup['Awards & Recognition']?.company1 || 'N/A',
      location: company1?.headquarters || basicInfoLookup['Headquarters']?.company1 || 'N/A',
      keyBenefits: keyBenefits.map(kb => kb.company1_value).filter(val => val !== 'N/A'),
      uniqueStrengths: uniqueStrengths.map(us => us.company1_value).filter(val => val !== 'N/A')
    },
    company2: {
      name: company2?.name || `${structuredComparison.title?.split(' vs ')[1] || 'Second Company'}`,
      founded: company2?.founded || basicInfoLookup['Founded']?.company2 || 'N/A',
      headquarters: company2?.headquarters || basicInfoLookup['Headquarters']?.company2 || 'N/A',
      companyType: basicInfoLookup['Company Type']?.company2 || 'N/A',
      funding: basicInfoLookup['Funding']?.company2 || 'N/A',
      investors: basicInfoLookup['Investors']?.company2 || 'N/A',
      employeeSize: basicInfoLookup['Employee Size']?.company2 || 'N/A',
      deliveryModel: basicInfoLookup['Delivery Model']?.company2 || 'N/A',
      targetCustomers: basicInfoLookup['Target Customers']?.company2 || 'N/A',
      primarySolutions: basicInfoLookup['Primary Solutions']?.company2 || 'N/A',
      aiCore: basicInfoLookup['AI Core']?.company2 || 'N/A',
      ehrIntegration: basicInfoLookup['EHR Integration']?.company2 || 'N/A',
      clientBase: basicInfoLookup['Notable Customers']?.company2 || 'N/A',
      certifications: basicInfoLookup['Certifications']?.company2 || 'N/A',
      awards: basicInfoLookup['Awards & Recognition']?.company2 || 'N/A',
      location: company2?.headquarters || basicInfoLookup['Headquarters']?.company2 || 'N/A',
      keyBenefits: keyBenefits.map(kb => kb.company2_value).filter(val => val !== 'N/A'),
      uniqueStrengths: uniqueStrengths.map(us => us.company2_value).filter(val => val !== 'N/A')
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
            
            {/* Key Benefits Section */}
            {(data.company1.keyBenefits.length > 0 || data.company2.keyBenefits.length > 0) && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    ⭐ Key Benefits
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-primary">{data.company1.name}</h3>
                      <div className="space-y-2">
                        {data.company1.keyBenefits.map((benefit, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                            <span className="text-muted-foreground">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-primary">{data.company2.name}</h3>
                      <div className="space-y-2">
                        {data.company2.keyBenefits.map((benefit, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                            <span className="text-muted-foreground">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Unique Strengths Section */}
            {(data.company1.uniqueStrengths.length > 0 || data.company2.uniqueStrengths.length > 0) && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    💎 Unique Strengths
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-primary">{data.company1.name}</h3>
                      <div className="space-y-2">
                        {data.company1.uniqueStrengths.map((strength, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                            <span className="text-muted-foreground">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-primary">{data.company2.name}</h3>
                      <div className="space-y-2">
                        {data.company2.uniqueStrengths.map((strength, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                            <span className="text-muted-foreground">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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