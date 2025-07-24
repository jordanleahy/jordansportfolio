import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Eye, Plus, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useVendors } from '@/hooks/useVendors';
import { useCreateComparison, useUpdateComparison, useComparisonBySlug } from '@/hooks/useComparisons';
import { useCreateStructuredComparison, useUpdateStructuredComparison, useStructuredComparison } from '@/hooks/useComparisonsStructured';
import { useGenerateComparison } from '@/hooks/useGenerateComparison';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ComparisonPreview } from '@/components/admin/ComparisonPreview';

interface FeatureRow {
  feature: string;
  company1: boolean | string;
  company2: boolean | string;
}

interface UseCaseRow {
  useCase: string;
  bestFit: string;
}

interface BasicInfoRow {
  category: string;
  company1: string;
  company2: string;
}

export const ComparisonForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const { data: vendors } = useVendors();
  const { data: existingComparison } = useComparisonBySlug(id || '');
  const { data: structuredComparison } = useStructuredComparison(id || '');
  
  // Use both old and new create/update hooks during transition
  const createComparison = useCreateComparison();
  const updateComparison = useUpdateComparison();
  const createStructuredComparison = useCreateStructuredComparison();
  const updateStructuredComparison = useUpdateStructuredComparison();
  const generateComparison = useGenerateComparison();

  const [formData, setFormData] = useState({
    title: '',
    meta_title: '',
    meta_description: '',
    slug: '',
    company1_id: '',
    company2_id: '',
    status: 'draft' as 'draft' | 'published',
  });

  const [features, setFeatures] = useState<FeatureRow[]>([
    { feature: '', company1: '', company2: '' }
  ]);

  const [summaryInsights, setSummaryInsights] = useState({
    company1: '',
    company2: ''
  });

  const [useCases, setUseCases] = useState<UseCaseRow[]>([
    { useCase: '', bestFit: '' }
  ]);

  const [basicInfo, setBasicInfo] = useState<BasicInfoRow[]>([
    { category: 'Founded', company1: '', company2: '' },
    { category: 'Headquarters', company1: '', company2: '' },
    { category: 'Company Type', company1: '', company2: '' },
    { category: 'Funding', company1: '', company2: '' },
    { category: 'Investors', company1: '', company2: '' },
    { category: 'Employee Size', company1: '', company2: '' },
    { category: 'Delivery Model', company1: '', company2: '' },
    { category: 'Target Customers', company1: '', company2: '' },
    { category: 'Primary Solutions', company1: '', company2: '' },
    { category: 'AI Core', company1: '', company2: '' },
    { category: 'EHR Integration', company1: '', company2: '' }
  ]);

  const [generatedData, setGeneratedData] = useState<any>(null);

  const selectedCompany1 = vendors?.find(v => v.id === formData.company1_id);
  const selectedCompany2 = vendors?.find(v => v.id === formData.company2_id);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Auto-generate title and slug when companies are selected
  useEffect(() => {
    if (selectedCompany1 && selectedCompany2 && !isEdit) {
      const title = `${selectedCompany1.company_name} vs ${selectedCompany2.company_name}`;
      const slug = generateSlug(`${selectedCompany1.company_name}vs${selectedCompany2.company_name}`);
      
      setFormData(prev => ({
        ...prev,
        title,
        slug,
        meta_title: `${title} - Detailed Comparison`,
        meta_description: `Compare ${selectedCompany1.company_name} and ${selectedCompany2.company_name}. Detailed analysis of features, pricing, and use cases.`
      }));
    }
  }, [selectedCompany1, selectedCompany2, isEdit]);

  // Load existing comparison data when editing
  useEffect(() => {
    if (isEdit && structuredComparison) {
      // Populate basic form data
      setFormData({
        title: structuredComparison.title,
        meta_title: structuredComparison.meta_title,
        meta_description: structuredComparison.meta_description,
        slug: structuredComparison.slug,
        company1_id: structuredComparison.companies?.[0]?.vendor_id || '',
        company2_id: structuredComparison.companies?.[1]?.vendor_id || '',
        status: structuredComparison.status as 'draft' | 'published',
      });

      // Populate basic info rows
      if (structuredComparison.basic_info && structuredComparison.basic_info.length > 0) {
        setBasicInfo(structuredComparison.basic_info.map(info => ({
          category: info.category,
          company1: info.company1_value,
          company2: info.company2_value,
        })));
      }

      // Populate features
      if (structuredComparison.features && structuredComparison.features.length > 0) {
        setFeatures(structuredComparison.features.map(feature => ({
          feature: feature.feature_name,
          company1: feature.company1_value,
          company2: feature.company2_value,
        })));
      }

      // Populate use cases
      if (structuredComparison.use_cases && structuredComparison.use_cases.length > 0) {
        setUseCases(structuredComparison.use_cases.map(useCase => ({
          useCase: useCase.use_case,
          bestFit: useCase.best_fit,
        })));
      }

      // Populate insights
      if (structuredComparison.insights && structuredComparison.insights.length > 0) {
        const company1Insight = structuredComparison.insights.find(i => i.company_position === 1);
        const company2Insight = structuredComparison.insights.find(i => i.company_position === 2);
        
        setSummaryInsights({
          company1: company1Insight?.insight_text || '',
          company2: company2Insight?.insight_text || '',
        });
      }
    }
  }, [isEdit, structuredComparison]);

  const addFeature = () => {
    setFeatures([...features, { feature: '', company1: '', company2: '' }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: keyof FeatureRow, value: string | boolean) => {
    setFeatures(features.map((feature, i) => 
      i === index ? { ...feature, [field]: value } : feature
    ));
  };

  const addUseCase = () => {
    setUseCases([...useCases, { useCase: '', bestFit: '' }]);
  };

  const removeUseCase = (index: number) => {
    setUseCases(useCases.filter((_, i) => i !== index));
  };

  const handleGenerateComparison = async () => {
    if (!formData.company1_id || !formData.company2_id) {
      toast.error("Please select both companies first");
      return;
    }

    const vendor1 = vendors?.find(v => v.id === formData.company1_id);
    const vendor2 = vendors?.find(v => v.id === formData.company2_id);

    if (!vendor1 || !vendor2) {
      toast.error("Could not find vendor data");
      return;
    }

    try {
      const result = await generateComparison.mutateAsync({ vendor1, vendor2 });
      const parsedData = JSON.parse(result.generatedText);
      
      // Store the full generated data for preview
      setGeneratedData(parsedData);
      
      // Populate form with generated data
      setFormData({
        ...formData,
        title: parsedData.title,
        meta_title: parsedData.metaTitle,
        meta_description: parsedData.metaDescription,
      });
      
      // Map company data to basicInfo array
      if (parsedData.company1 && parsedData.company2) {
        const updatedBasicInfo = basicInfo.map(info => {
          let company1Value = '';
          let company2Value = '';
          
          switch (info.category) {
            case 'Founded':
              company1Value = parsedData.company1.founded || '';
              company2Value = parsedData.company2.founded || '';
              break;
            case 'Headquarters':
              company1Value = parsedData.company1.headquarters || '';
              company2Value = parsedData.company2.headquarters || '';
              break;
            case 'Company Type':
              company1Value = parsedData.company1.companyType || '';
              company2Value = parsedData.company2.companyType || '';
              break;
            case 'Funding':
              company1Value = parsedData.company1.funding || '';
              company2Value = parsedData.company2.funding || '';
              break;
            case 'Investors':
              company1Value = parsedData.company1.investors || '';
              company2Value = parsedData.company2.investors || '';
              break;
            case 'Employee Size':
              company1Value = parsedData.company1.employeeSize || '';
              company2Value = parsedData.company2.employeeSize || '';
              break;
            case 'Delivery Model':
              company1Value = parsedData.company1.deliveryModel || '';
              company2Value = parsedData.company2.deliveryModel || '';
              break;
            case 'Target Customers':
              company1Value = parsedData.company1.targetCustomers || '';
              company2Value = parsedData.company2.targetCustomers || '';
              break;
            case 'Primary Solutions':
              company1Value = parsedData.company1.primarySolutions || '';
              company2Value = parsedData.company2.primarySolutions || '';
              break;
            case 'AI Core':
              company1Value = parsedData.company1.aiCore || '';
              company2Value = parsedData.company2.aiCore || '';
              break;
            case 'EHR Integration':
              company1Value = parsedData.company1.ehrIntegration || '';
              company2Value = parsedData.company2.ehrIntegration || '';
              break;
            default:
              company1Value = info.company1;
              company2Value = info.company2;
          }
          
          return {
            ...info,
            company1: company1Value,
            company2: company2Value
          };
        });
        
        setBasicInfo(updatedBasicInfo);
      }
      
      setFeatures(parsedData.features);
      setSummaryInsights(parsedData.summaryInsights);
      setUseCases(parsedData.useCases);
      
      toast.success("Comparison generated successfully! Please review and edit as needed.");
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error("Failed to generate comparison. Please try again.");
    }
  };

  const updateUseCase = (index: number, field: keyof UseCaseRow, value: string) => {
    setUseCases(useCases.map((useCase, i) => 
      i === index ? { ...useCase, [field]: value } : useCase
    ));
  };

  const addBasicInfo = () => {
    setBasicInfo([...basicInfo, { category: '', company1: '', company2: '' }]);
  };

  const removeBasicInfo = (index: number) => {
    setBasicInfo(basicInfo.filter((_, i) => i !== index));
  };

  const updateBasicInfo = (index: number, field: keyof BasicInfoRow, value: string) => {
    setBasicInfo(basicInfo.map((info, i) => 
      i === index ? { ...info, [field]: value } : info
    ));
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!selectedCompany1 || !selectedCompany2 || !user) {
      toast.error('Please select both companies');
      return;
    }

    // Prepare data for the new structured format
    const structuredData = {
      title: formData.title,
      meta_title: formData.meta_title,
      meta_description: formData.meta_description,
      slug: formData.slug,
      status,
      created_by: user.id,
      companies: [
        {
          company_position: 1,
          vendor_id: selectedCompany1.id,
          name: selectedCompany1.company_name,
          founded: selectedCompany1.founding_year?.toString() || 'N/A',
          headquarters: selectedCompany1.headquarters,
          key_benefits: selectedCompany1.key_benefits || [],
          unique_strengths: selectedCompany1.competitive_advantages || [],
        },
        {
          company_position: 2,
          vendor_id: selectedCompany2.id,
          name: selectedCompany2.company_name,
          founded: selectedCompany2.founding_year?.toString() || 'N/A',
          headquarters: selectedCompany2.headquarters,
          key_benefits: selectedCompany2.key_benefits || [],
          unique_strengths: selectedCompany2.competitive_advantages || [],
        }
      ],
      basic_info: basicInfo.filter(b => b.category.trim()).map(info => ({
        category: info.category,
        company1_value: info.company1,
        company2_value: info.company2,
        sort_order: 0 // Will be set automatically
      })),
      features: features.filter(f => f.feature.trim()).map(feature => ({
        feature_name: feature.feature,
        company1_value: feature.company1.toString(),
        company2_value: feature.company2.toString(),
        sort_order: 0 // Will be set automatically
      })),
      use_cases: useCases.filter(u => u.useCase.trim()).map(useCase => ({
        use_case: useCase.useCase,
        best_fit: useCase.bestFit,
        sort_order: 0 // Will be set automatically
      })),
      insights: [
        ...(summaryInsights.company1 ? [{
          company_position: 1,
          insight_text: summaryInsights.company1
        }] : []),
        ...(summaryInsights.company2 ? [{
          company_position: 2,
          insight_text: summaryInsights.company2
        }] : [])
      ]
    };

    try {
      if (isEdit && (existingComparison || structuredComparison)) {
        // Update using structured approach
        const comparisonId = existingComparison?.id || structuredComparison?.id;
        if (comparisonId) {
          const updateData = {
            id: comparisonId,
            title: structuredData.title,
            meta_title: structuredData.meta_title,
            meta_description: structuredData.meta_description,
            slug: structuredData.slug,
            status: structuredData.status,
            companies: structuredData.companies.map(company => ({ 
              id: '', // Temporary ID, will be generated
              ...company 
            })),
            basic_info: structuredData.basic_info.map(info => ({ 
              id: '', // Temporary ID, will be generated
              ...info 
            })),
            features: structuredData.features.map(feature => ({ 
              id: '', // Temporary ID, will be generated
              ...feature 
            })),
            use_cases: structuredData.use_cases.map(useCase => ({ 
              id: '', // Temporary ID, will be generated
              ...useCase 
            })),
            insights: structuredData.insights.map(insight => ({ 
              id: '', // Temporary ID, will be generated
              ...insight 
            }))
          };
          await updateStructuredComparison.mutateAsync(updateData);
          toast.success('Comparison updated successfully');
        }
      } else {
        // Create using structured approach
        await createStructuredComparison.mutateAsync(structuredData);
        toast.success('Comparison created successfully');
      }
      navigate('/admin/comparisons');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save comparison');
    }
  };

  return (
    <AppLayout>
      <Helmet>
        <title>{isEdit ? 'Edit' : 'New'} Comparison - Admin</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/comparisons')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Edit' : 'Create'} Comparison
          </h1>
        </div>

        {/* Generated Comparison Preview */}
        {generatedData && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Generated Comparison Preview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review the AI-generated comparison below. You can edit the fields in the form to customize it.
                </p>
              </CardHeader>
              <CardContent>
                <ComparisonPreview data={generatedData} />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company1">Company 1</Label>
                    <Select value={formData.company1_id} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, company1_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select first company" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg z-50">
                        {vendors?.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.company_name} {vendor.status !== 'published' && '(Draft)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="company2">Company 2</Label>
                    <Select value={formData.company2_id} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, company2_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select second company" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg z-50">
                        {vendors?.filter(v => v.id !== formData.company1_id).map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.company_name} {vendor.status !== 'published' && '(Draft)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., SmarterDx vs Iodine Software"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., smarterdx-vs-iodine"
                  />
                </div>

                <div>
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="SEO title"
                  />
                </div>

                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="SEO description"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Basic Company Information Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Basic Company Information</CardTitle>
                  <Button onClick={addBasicInfo} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generateComparison.isPending ? (
                    Array.from({ length: 11 }, (_, index) => (
                      <div key={index} className="grid md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-10" />
                      </div>
                    ))
                  ) : (
                    basicInfo.map((info, index) => (
                      <div key={index} className="grid md:grid-cols-4 gap-4 items-end">
                        <div>
                          <Label>Category</Label>
                          <Input
                            value={info.category}
                            onChange={(e) => updateBasicInfo(index, 'category', e.target.value)}
                            placeholder="e.g., Founded, Headquarters"
                          />
                        </div>
                        <div>
                          <Label>{selectedCompany1?.company_name || 'Company 1'}</Label>
                          <Input
                            value={info.company1}
                            onChange={(e) => updateBasicInfo(index, 'company1', e.target.value)}
                            placeholder="Company 1 value"
                          />
                        </div>
                        <div>
                          <Label>{selectedCompany2?.company_name || 'Company 2'}</Label>
                          <Input
                            value={info.company2}
                            onChange={(e) => updateBasicInfo(index, 'company2', e.target.value)}
                            placeholder="Company 2 value"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBasicInfo(index)}
                          disabled={basicInfo.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Feature Comparison</CardTitle>
                  <Button onClick={addFeature} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Feature
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generateComparison.isPending ? (
                    Array.from({ length: 5 }, (_, index) => (
                      <div key={index} className="grid md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-10" />
                      </div>
                    ))
                  ) : (
                    features.map((feature, index) => (
                      <div key={index} className="grid md:grid-cols-4 gap-4 items-end">
                        <div>
                          <Label>Feature</Label>
                          <Input
                            value={feature.feature}
                            onChange={(e) => updateFeature(index, 'feature', e.target.value)}
                            placeholder="Feature name"
                          />
                        </div>
                        <div>
                          <Label>{selectedCompany1?.company_name || 'Company 1'}</Label>
                          <Input
                            value={feature.company1.toString()}
                            onChange={(e) => updateFeature(index, 'company1', e.target.value)}
                            placeholder="Yes/No or description"
                          />
                        </div>
                        <div>
                          <Label>{selectedCompany2?.company_name || 'Company 2'}</Label>
                          <Input
                            value={feature.company2.toString()}
                            onChange={(e) => updateFeature(index, 'company2', e.target.value)}
                            placeholder="Yes/No or description"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(index)}
                          disabled={features.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Summary Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {generateComparison.isPending ? (
                  <>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>{selectedCompany1?.company_name || 'Company 1'} Summary</Label>
                      <Textarea
                        value={summaryInsights.company1}
                        onChange={(e) => setSummaryInsights(prev => ({ ...prev, company1: e.target.value }))}
                        placeholder="Summary insight for company 1"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>{selectedCompany2?.company_name || 'Company 2'} Summary</Label>
                      <Textarea
                        value={summaryInsights.company2}
                        onChange={(e) => setSummaryInsights(prev => ({ ...prev, company2: e.target.value }))}
                        placeholder="Summary insight for company 2"
                        rows={4}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Use Cases */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Use Case Suitability</CardTitle>
                  <Button onClick={addUseCase} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Use Case
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generateComparison.isPending ? (
                    Array.from({ length: 3 }, (_, index) => (
                      <div key={index} className="grid md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1 space-y-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-10" />
                      </div>
                    ))
                  ) : (
                    useCases.map((useCase, index) => (
                      <div key={index} className="grid md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1">
                          <Label>Use Case</Label>
                          <Input
                            value={useCase.useCase}
                            onChange={(e) => updateUseCase(index, 'useCase', e.target.value)}
                            placeholder="Use case description"
                          />
                        </div>
                        <div>
                          <Label>Best Fit</Label>
                          <Select
                            value={useCase.bestFit}
                            onValueChange={(value) => updateUseCase(index, 'bestFit', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select best fit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Both">Both</SelectItem>
                              <SelectItem value={selectedCompany1?.company_name || 'Company 1'}>
                                {selectedCompany1?.company_name || 'Company 1'}
                              </SelectItem>
                              <SelectItem value={selectedCompany2?.company_name || 'Company 2'}>
                                {selectedCompany2?.company_name || 'Company 2'}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeUseCase(index)}
                          disabled={useCases.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.company1_id && formData.company2_id && (
                  <Button
                    onClick={handleGenerateComparison}
                    disabled={generateComparison.isPending}
                    variant="secondary"
                    className="w-full gap-2"
                  >
                    {generateComparison.isPending ? 'Generating...' : '🤖 Generate with AI'}
                  </Button>
                )}
                <Button
                  onClick={() => handleSubmit('draft')}
                  variant="outline"
                  className="w-full gap-2"
                  disabled={createComparison.isPending || updateComparison.isPending}
                >
                  <Save className="h-4 w-4" />
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSubmit('published')}
                  className="w-full gap-2"
                  disabled={createComparison.isPending || updateComparison.isPending}
                >
                  <Eye className="h-4 w-4" />
                  Publish
                </Button>
              </CardContent>
            </Card>

            {selectedCompany1 && selectedCompany2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">{selectedCompany1.company_name}</div>
                      <div className="text-sm text-muted-foreground">{selectedCompany1.headquarters}</div>
                    </div>
                    <div className="text-center text-muted-foreground">vs</div>
                    <div>
                      <div className="font-medium">{selectedCompany2.company_name}</div>
                      <div className="text-sm text-muted-foreground">{selectedCompany2.headquarters}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};