import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUpdateCompanyPortfolio } from '@/hooks/useCompanyPortfolios';
import { useQueryClient } from '@tanstack/react-query';

interface VisualGenerationRequest {
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  companySlug: string;
  portfolioId?: string;
}

interface VisualGenerationState {
  isGenerating: boolean;
  currentStep: 'prompt' | 'image' | 'upload' | 'complete';
  error: string | null;
}

export const useAutomaticVisualGeneration = () => {
  const [state, setState] = useState<VisualGenerationState>({
    isGenerating: false,
    currentStep: 'complete',
    error: null
  });
  
  const { toast } = useToast();
  const updatePortfolioMutation = useUpdateCompanyPortfolio();
  const queryClient = useQueryClient();

  const generateVisual = useCallback(async (request: VisualGenerationRequest) => {
    console.log('🎨 Starting automated visual generation workflow');
    
    setState({
      isGenerating: true,
      currentStep: 'prompt',
      error: null
    });

    try {
      // Step 1: Generate healthcare-themed prompt
      console.log('🎨 Step 1: Generating healthcare prompt...');
      const { data: promptData, error: promptError } = await supabase.functions.invoke('generate-image-prompt-dynamic', {
        body: {
          title: request.jobTitle,
          description: request.jobDescription,
          category: 'healthcare'
        }
      });

      if (promptError || !promptData?.generatedPrompt) {
        throw new Error('Failed to generate image prompt');
      }

      console.log('✅ Prompt generated successfully');
      
      // Step 2: Generate image using the prompt
      setState(prev => ({ ...prev, currentStep: 'image' }));
      console.log('🎨 Step 2: Generating image...');
      
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-image-gpt', {
        body: {
          prompt: promptData.generatedPrompt,
          aspectRatio: '9:16'
        }
      });

      if (imageError || !imageData?.image) {
        throw new Error('Failed to generate image');
      }

      console.log('✅ Image generated successfully');

      // Step 3: Upload image to portfolio
      setState(prev => ({ ...prev, currentStep: 'upload' }));
      console.log('🎨 Step 3: Uploading to portfolio...');

      // Convert base64 to blob for upload
      const response = await fetch(imageData.image);
      const blob = await response.blob();
      
      // Create a unique filename
      const fileName = `cover-image-${request.companySlug}-${Date.now()}.png`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hero-parallax')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('hero-parallax')
        .getPublicUrl(fileName);

      // Find and update the portfolio record
      const { data: portfolios, error: fetchError } = await supabase
        .from('company_portfolios')
        .select('id')
        .eq('company_slug', request.companySlug);

      if (fetchError) {
        throw new Error('Failed to find portfolio record');
      }

      if (!portfolios || portfolios.length === 0) {
        throw new Error('No portfolio found for this company');
      }

      const portfolioId = portfolios[0].id;

      // Update portfolio with the cover image
      const { error: updateError } = await supabase
        .from('company_portfolios')
        .update({ 
          custom_cover_image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolioId);

      if (updateError) {
        throw new Error('Failed to update portfolio with image');
      }

      console.log('✅ Portfolio updated successfully');
      
      // Invalidate queries to refresh the UI immediately
      queryClient.invalidateQueries({ queryKey: ["company-portfolio", request.companySlug] });
      queryClient.invalidateQueries({ queryKey: ["company-portfolios"] });
      
      setState({
        isGenerating: false,
        currentStep: 'complete',
        error: null
      });

      toast({
        title: "Visual Generated!",
        description: "Healthcare-themed cover image has been added to your portfolio page.",
      });

      return { success: true, imageUrl: publicUrl };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Visual generation failed:', errorMessage);
      
      setState({
        isGenerating: false,
        currentStep: 'complete',
        error: errorMessage
      });

      toast({
        title: "Visual Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, error: errorMessage };
    }
  }, [toast]);

  return {
    generateVisual,
    isGenerating: state.isGenerating,
    currentStep: state.currentStep,
    error: state.error
  };
};