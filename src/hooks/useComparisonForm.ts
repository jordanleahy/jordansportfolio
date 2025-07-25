import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { produce } from 'immer';
import type { Vendor } from '@/types/vendor';
import type { 
  ComparisonFormState, 
  ComparisonFormData,
  FeatureRow,
  UseCaseRow,
  BasicInfoRow,
  SummaryInsights
} from '@/types/comparisonForm';
import {
  mapVendorsToFormData,
  mapStructuredComparisonToFormState,
  mapGeneratedDataToFormState,
  mapFormStateToStructuredData,
  generateSlug,
  getDefaultBasicInfo,
  getDefaultFeatures,
  getDefaultUseCases
} from '@/utils/comparisonDataMapper';
import { arrayHelpers } from '@/utils/arrayHelpers';
import { useCreateStructuredComparison, useUpdateStructuredComparison } from '@/hooks/useComparisonsStructured';
import { useGenerateComparison } from '@/hooks/useGenerateComparison';

interface UseComparisonFormProps {
  isEdit: boolean;
  structuredComparison?: any;
  userId?: string;
}

export const useComparisonForm = ({
  isEdit,
  structuredComparison,
  userId
}: UseComparisonFormProps) => {
  const navigate = useNavigate();
  const createStructuredComparison = useCreateStructuredComparison();
  const updateStructuredComparison = useUpdateStructuredComparison();
  const generateComparison = useGenerateComparison();

  const [state, setState] = useState<ComparisonFormState>({
    formData: {
      title: '',
      meta_title: '',
      meta_description: '',
      slug: '',
      company1_id: '',
      company2_id: '',
      status: 'draft',
      og_image_url: '',
    },
    features: getDefaultFeatures(),
    summaryInsights: {
      company1: '',
      company2: ''
    },
    useCases: getDefaultUseCases(),
    basicInfo: getDefaultBasicInfo(),
    generatedData: null,
  });

  // Auto-generate form data when companies are selected
  const updateFromVendors = useCallback((vendor1?: Vendor, vendor2?: Vendor) => {
    const formUpdates = mapVendorsToFormData(vendor1, vendor2, isEdit);
    if (Object.keys(formUpdates).length > 0) {
      setState(prev => produce(prev, draft => {
        Object.assign(draft.formData, formUpdates);
      }));
    }
  }, [isEdit]);

  // Load existing comparison data when editing
  useEffect(() => {
    if (isEdit && structuredComparison) {
      const mappedState = mapStructuredComparisonToFormState(structuredComparison);
      setState(prev => produce(prev, draft => {
        Object.assign(draft, mappedState);
      }));
    }
  }, [isEdit, structuredComparison]);

  // Form data updates
  const updateFormData = useCallback((updates: Partial<ComparisonFormData>) => {
    setState(prev => produce(prev, draft => {
      Object.assign(draft.formData, updates);
    }));
  }, []);

  // Summary insights updates
  const updateSummaryInsights = useCallback((updates: Partial<SummaryInsights>) => {
    setState(prev => produce(prev, draft => {
      Object.assign(draft.summaryInsights, updates);
    }));
  }, []);

  // Feature management
  const addFeature = useCallback(() => {
    setState(prev => produce(prev, draft => {
      draft.features = arrayHelpers.add(draft.features, { feature: '', company1: '', company2: '' });
    }));
  }, []);

  const removeFeature = useCallback((id: string) => {
    setState(prev => produce(prev, draft => {
      draft.features = arrayHelpers.remove(draft.features, id);
    }));
  }, []);

  const updateFeature = useCallback((id: string, updates: Partial<Omit<FeatureRow, 'id'>>) => {
    setState(prev => produce(prev, draft => {
      draft.features = arrayHelpers.update(draft.features, id, updates);
    }));
  }, []);

  // Use case management
  const addUseCase = useCallback(() => {
    setState(prev => produce(prev, draft => {
      draft.useCases = arrayHelpers.add(draft.useCases, { useCase: '', bestFit: '' });
    }));
  }, []);

  const removeUseCase = useCallback((id: string) => {
    setState(prev => produce(prev, draft => {
      draft.useCases = arrayHelpers.remove(draft.useCases, id);
    }));
  }, []);

  const updateUseCase = useCallback((id: string, updates: Partial<Omit<UseCaseRow, 'id'>>) => {
    setState(prev => produce(prev, draft => {
      draft.useCases = arrayHelpers.update(draft.useCases, id, updates);
    }));
  }, []);

  // Basic info management
  const addBasicInfo = useCallback(() => {
    setState(prev => produce(prev, draft => {
      draft.basicInfo = arrayHelpers.add(draft.basicInfo, { category: '', company1: '', company2: '' });
    }));
  }, []);

  const removeBasicInfo = useCallback((id: string) => {
    setState(prev => produce(prev, draft => {
      draft.basicInfo = arrayHelpers.remove(draft.basicInfo, id);
    }));
  }, []);

  const updateBasicInfo = useCallback((id: string, updates: Partial<Omit<BasicInfoRow, 'id'>>) => {
    setState(prev => produce(prev, draft => {
      draft.basicInfo = arrayHelpers.update(draft.basicInfo, id, updates);
    }));
  }, []);

  // Generate comparison from AI
  const handleGenerateComparison = useCallback(async (vendor1: Vendor, vendor2: Vendor) => {
    try {
      const result = await generateComparison.mutateAsync({ vendor1, vendor2 });
      const parsedData = JSON.parse(result.generatedText);
      
      setState(prev => {
        const mappedUpdates = mapGeneratedDataToFormState(parsedData, generateSlug, prev.formData);
        return produce(prev, draft => {
          Object.assign(draft, mappedUpdates);
        });
      });

      toast.success('Comparison generated successfully');
    } catch (error) {
      console.error('Error generating comparison:', error);
      toast.error('Failed to generate comparison');
    }
  }, [generateComparison]);

  // Submit form
  const handleSubmit = useCallback(async (
    status: 'draft' | 'published',
    vendor1: Vendor,
    vendor2: Vendor
  ) => {
    if (!vendor1 || !vendor2 || !userId) {
      toast.error('Please select both companies');
      return;
    }

    const loadingToast = toast.loading(`${status === 'draft' ? 'Saving draft' : 'Publishing'} comparison...`);
    
    try {
      const structuredData = mapFormStateToStructuredData(state, vendor1, vendor2, userId, status);

      if (isEdit && structuredComparison?.id) {
        await updateStructuredComparison.mutateAsync({
          id: structuredComparison.id,
          ...structuredData
        });
      } else {
        await createStructuredComparison.mutateAsync(structuredData);
      }

      toast.dismiss(loadingToast);
      toast.success(`Comparison ${status === 'draft' ? 'saved as draft' : 'published'} successfully`);
      navigate('/admin/comparisons');
    } catch (error) {
      console.error('Save error:', error);
      toast.dismiss(loadingToast);
      toast.error(`Failed to ${status === 'draft' ? 'save' : 'publish'} comparison`);
    }
  }, [state, isEdit, structuredComparison, userId, updateStructuredComparison, createStructuredComparison, navigate]);

  return {
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
    isGenerating: generateComparison.isPending,
    isSubmitting: createStructuredComparison.isPending || updateStructuredComparison.isPending,
  };
};