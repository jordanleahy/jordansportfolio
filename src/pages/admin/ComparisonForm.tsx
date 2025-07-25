import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Eye, Plus, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useVendors } from '@/hooks/useVendors';
import { useStructuredComparison } from '@/hooks/useComparisonsStructured';
import { useAuth } from '@/contexts/AuthContext';
import { StructuredComparisonPreview } from '@/components/admin/StructuredComparisonPreview';
import { useComparisonForm } from '@/hooks/useComparisonForm';
import { FileUpload } from '@/components/ui/file-upload';
import { useFileUpload } from '@/hooks/useFileUpload';

export const ComparisonForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;
  
  const { uploadFile } = useFileUpload({ bucket: 'images', folder: 'comparisons' });

  const { data: vendors } = useVendors();
  const { data: structuredComparison } = useStructuredComparison(id || '');
  
  // Use the new refactored hook
  const {
    state,
    updateFromVendors,
    updateFormData,
    updateSummaryInsights,
    addFeature,
    removeFeature,
    updateFeature,
    addUseCase,
    removeUseCase,
    updateUseCase,
    addBasicInfo,
    removeBasicInfo,
    updateBasicInfo,
    handleGenerateComparison,
    handleSubmit,
    isGenerating,
    isSubmitting,
  } = useComparisonForm({
    isEdit,
    structuredComparison,
    userId: user?.id
  });

  const selectedCompany1 = vendors?.find(v => v.id === state.formData.company1_id);
  const selectedCompany2 = vendors?.find(v => v.id === state.formData.company2_id);

  // Auto-generate form data when companies are selected
  useEffect(() => {
    updateFromVendors(selectedCompany1, selectedCompany2);
  }, [selectedCompany1, selectedCompany2, updateFromVendors]);

  const handleGenerateClick = async () => {
    if (selectedCompany1 && selectedCompany2) {
      await handleGenerateComparison(selectedCompany1, selectedCompany2);
    }
  };

  const handleSaveClick = (status: 'draft' | 'published') => {
    if (selectedCompany1 && selectedCompany2) {
      handleSubmit(status, selectedCompany1, selectedCompany2);
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
        {state.generatedData && selectedCompany1 && selectedCompany2 && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Generated Comparison Preview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review the AI-generated comparison below. You can edit the fields in the form to customize it.
                </p>
              </CardHeader>
              <CardContent>
                <StructuredComparisonPreview 
                  data={state.generatedData} 
                  company1Name={selectedCompany1.company_name}
                  company2Name={selectedCompany2.company_name}
                />
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
                {isGenerating ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company1">Company 1</Label>
                        <Select 
                          value={state.formData.company1_id} 
                          onValueChange={(value) => updateFormData({ company1_id: value })}
                        >
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
                        <Select 
                          value={state.formData.company2_id} 
                          onValueChange={(value) => updateFormData({ company2_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select second company" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-border shadow-lg z-50">
                            {vendors?.filter(v => v.id !== state.formData.company1_id).map(vendor => (
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
                        value={state.formData.title}
                        onChange={(e) => updateFormData({ title: e.target.value })}
                        placeholder="e.g., SmarterDx vs Iodine Software"
                      />
                    </div>

                    <div>
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        value={state.formData.slug}
                        onChange={(e) => updateFormData({ slug: e.target.value })}
                        placeholder="e.g., smarterdx-vs-iodine"
                      />
                    </div>

                    <div>
                      <Label htmlFor="meta_title">Meta Title</Label>
                      <Input
                        id="meta_title"
                        value={state.formData.meta_title}
                        onChange={(e) => updateFormData({ meta_title: e.target.value })}
                        placeholder="SEO title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="meta_description">Meta Description</Label>
                      <Textarea
                        id="meta_description"
                        value={state.formData.meta_description}
                        onChange={(e) => updateFormData({ meta_description: e.target.value })}
                        placeholder="SEO description"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="og_image">Open Graph Image</Label>
                      <FileUpload
                        onFileSelect={async (file) => {
                          const url = await uploadFile(file);
                          if (url) {
                            updateFormData({ og_image_url: url });
                          }
                        }}
                        accept="image/*"
                        maxSize={5 * 1024 * 1024} // 5MB
                        preview={true}
                        currentFile={state.formData.og_image_url}
                        label="Upload OG image for social media sharing"
                        description="Recommended size: 1200x630px. Max file size: 5MB"
                      />
                    </div>
                  </>
                )}
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
                  {isGenerating ? (
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
                    state.basicInfo.map((info) => (
                      <div key={info.id} className="grid md:grid-cols-4 gap-4 items-end">
                        <div>
                          <Label>Category</Label>
                          <Input
                            value={info.category}
                            onChange={(e) => updateBasicInfo(info.id, { category: e.target.value })}
                            placeholder="e.g., Founded, Headquarters"
                          />
                        </div>
                        <div>
                          <Label>{selectedCompany1?.company_name || 'Company 1'}</Label>
                          <Input
                            value={info.company1}
                            onChange={(e) => updateBasicInfo(info.id, { company1: e.target.value })}
                            placeholder="Company 1 value"
                          />
                        </div>
                        <div>
                          <Label>{selectedCompany2?.company_name || 'Company 2'}</Label>
                          <Input
                            value={info.company2}
                            onChange={(e) => updateBasicInfo(info.id, { company2: e.target.value })}
                            placeholder="Company 2 value"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBasicInfo(info.id)}
                          disabled={state.basicInfo.length === 1}
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
                  {isGenerating ? (
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
                    state.features.map((feature) => (
                      <div key={feature.id} className="grid md:grid-cols-4 gap-4 items-end">
                        <div>
                          <Label>Feature</Label>
                          <Input
                            value={feature.feature}
                            onChange={(e) => updateFeature(feature.id, { feature: e.target.value })}
                            placeholder="Feature name"
                          />
                        </div>
                        <div>
                          <Label>{selectedCompany1?.company_name || 'Company 1'}</Label>
                          <Input
                            value={feature.company1.toString()}
                            onChange={(e) => updateFeature(feature.id, { company1: e.target.value })}
                            placeholder="Yes/No or description"
                          />
                        </div>
                        <div>
                          <Label>{selectedCompany2?.company_name || 'Company 2'}</Label>
                          <Input
                            value={feature.company2.toString()}
                            onChange={(e) => updateFeature(feature.id, { company2: e.target.value })}
                            placeholder="Yes/No or description"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(feature.id)}
                          disabled={state.features.length === 1}
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
                {isGenerating ? (
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
                        value={state.summaryInsights.company1}
                        onChange={(e) => updateSummaryInsights({ company1: e.target.value })}
                        placeholder="Summary insight for company 1"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>{selectedCompany2?.company_name || 'Company 2'} Summary</Label>
                      <Textarea
                        value={state.summaryInsights.company2}
                        onChange={(e) => updateSummaryInsights({ company2: e.target.value })}
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
                  {isGenerating ? (
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
                    state.useCases.map((useCase) => (
                      <div key={useCase.id} className="grid md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1">
                          <Label>Use Case</Label>
                          <Input
                            value={useCase.useCase}
                            onChange={(e) => updateUseCase(useCase.id, { useCase: e.target.value })}
                            placeholder="Use case description"
                          />
                        </div>
                        <div>
                          <Label>Best Fit</Label>
                          <Select
                            value={useCase.bestFit}
                            onValueChange={(value) => updateUseCase(useCase.id, { bestFit: value })}
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
                          onClick={() => removeUseCase(useCase.id)}
                          disabled={state.useCases.length === 1}
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
                {state.formData.company1_id && state.formData.company2_id && (
                  <Button
                    onClick={handleGenerateClick}
                    disabled={isGenerating}
                    variant="secondary"
                    className="w-full gap-2"
                  >
                    {isGenerating ? 'Generating...' : '🤖 Generate with AI'}
                  </Button>
                )}
                <Button
                  onClick={() => handleSaveClick('draft')}
                  variant="outline"
                  className="w-full gap-2"
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  onClick={() => handleSaveClick('published')}
                  className="w-full gap-2"
                  disabled={isSubmitting}
                >
                  <Eye className="h-4 w-4" />
                  {isSubmitting ? 'Publishing...' : 'Publish'}
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