import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TriageResponse {
  primary_route: 'vendor_analysis' | 'theme_structuring' | 'book_research';
  confidence: number;
  reasoning: string;
  secondary_route?: string | null;
  input_classification: {
    contains_company_names: boolean;
    contains_theme_data: boolean;
    is_research_request: boolean;
    is_content_creation: boolean;
    is_book_research: boolean;
  };
  suggested_preprocessing?: string | null;
}

export interface TriageOptions {
  input: string;
  context?: string;
  onRouteDecision?: (route: TriageResponse) => void;
  onComplete?: (route: TriageResponse) => void;
}

export interface TriageState {
  isAnalyzing: boolean;
  currentRoute: TriageResponse | null;
  error: string | null;
  lastInput: string | null;
}

export const useInputTriage = () => {
  const { toast } = useToast();
  
  const [state, setState] = useState<TriageState>({
    isAnalyzing: false,
    currentRoute: null,
    error: null,
    lastInput: null,
  });

  const triageMutation = useMutation({
    mutationFn: async ({ input, context }: { input: string; context?: string }): Promise<TriageResponse> => {
      console.log('Starting input triage analysis:', { 
        inputLength: input.length, 
        hasContext: !!context 
      });

      const { data, error } = await supabase.functions.invoke('input-triage', {
        body: { input, context }
      });

      if (error) {
        console.error('Triage function error:', error);
        throw new Error(error.message || 'Failed to analyze input');
      }

      if (!data) {
        throw new Error('No response from triage service');
      }

      console.log('Triage analysis completed:', {
        route: data.primary_route,
        confidence: data.confidence,
        classification: data.input_classification
      });

      return data as TriageResponse;
    },
    onMutate: ({ input }) => {
      setState(prev => ({
        ...prev,
        isAnalyzing: true,
        error: null,
        lastInput: input,
        currentRoute: null
      }));
    },
    onSuccess: (data) => {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        currentRoute: data,
        error: null
      }));
    },
    onError: (error) => {
      console.error('Triage mutation error:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error.message,
        currentRoute: null
      }));
      
      toast({
        title: 'Triage Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const analyzeInput = useCallback(async (options: TriageOptions): Promise<TriageResponse | null> => {
    try {
      const result = await triageMutation.mutateAsync({
        input: options.input,
        context: options.context
      });

      // Call the route decision callback if provided
      if (options.onRouteDecision) {
        options.onRouteDecision(result);
      }

      // Show user feedback about the routing decision
      if (result.confidence >= 0.8) {
        toast({
          title: 'Input Analyzed',
          description: `Routing to ${result.primary_route.replace('_', ' ')} (${Math.round(result.confidence * 100)}% confidence)`,
        });
      } else if (result.confidence >= 0.5) {
        toast({
          title: 'Input Analyzed',
          description: `Routing to ${result.primary_route.replace('_', ' ')} (medium confidence)`,
        });
      }

      // Call the completion callback if provided
      if (options.onComplete) {
        options.onComplete(result);
      }

      return result;
    } catch (error) {
      console.error('Failed to analyze input:', error);
      return null;
    }
  }, [triageMutation, toast]);

  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      currentRoute: null,
      error: null,
      lastInput: null,
    });
  }, []);

  const getRouteDescription = useCallback((route: string) => {
    switch (route) {
      case 'vendor_analysis':
        return 'Company Research & Analysis';
      case 'theme_structuring':
        return 'Content Creation & Themes';
      case 'book_research':
        return 'Book Research & Highlights';
      default:
        return 'Unknown Route';
    }
  }, []);

  const getConfidenceLabel = useCallback((confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    analyzeInput,
    reset,
    
    // Utilities
    getRouteDescription,
    getConfidenceLabel,
    
    // Computed properties
    hasResult: !!state.currentRoute,
    isHighConfidence: state.currentRoute ? state.currentRoute.confidence >= 0.8 : false,
    isMediumConfidence: state.currentRoute ? state.currentRoute.confidence >= 0.5 && state.currentRoute.confidence < 0.8 : false,
    isLowConfidence: state.currentRoute ? state.currentRoute.confidence < 0.5 : false,
  };
};