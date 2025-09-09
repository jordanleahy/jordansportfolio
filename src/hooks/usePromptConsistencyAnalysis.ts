import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ConsistencyIssue {
  type: 'style' | 'character' | 'setting' | 'color' | 'tone' | 'brand';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedPosts: string[];
  suggestion: string;
}

export interface ConsistencyReport {
  totalPosts: number;
  consistencyScore: number;
  issues: ConsistencyIssue[];
  summary: string;
}

export const usePromptConsistencyAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [report, setReport] = useState<ConsistencyReport | null>(null);

  const analyzeConsistency = async (themeId?: string, postIds?: string[]) => {
    if (!themeId && (!postIds || postIds.length === 0)) {
      toast.error('Theme ID or post IDs are required for analysis');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'analyze-prompt-consistency',
        {
          body: { themeId, postIds },
        }
      );

      if (error) {
        console.error('Analysis error:', error);
        toast.error('Failed to analyze prompt consistency');
        return;
      }

      setReport(data);
      toast.success('Prompt consistency analysis completed');
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cleanPrompts = async (themeId?: string, postIds?: string[], dryRun = false) => {
    if (!themeId && (!postIds || postIds.length === 0)) {
      toast.error('Theme ID or post IDs are required for cleaning');
      return null;
    }

    setIsCleaning(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'clean-prompt-noise',
        {
          body: { themeId, postIds, dryRun },
        }
      );

      if (error) {
        console.error('Cleaning error:', error);
        toast.error('Failed to clean prompts');
        return null;
      }

      if (dryRun) {
        toast.success(`Analysis complete: ${data.summary.promptsCleaned} prompts can be cleaned`);
      } else {
        toast.success(`Successfully cleaned ${data.summary.promptsCleaned} prompts`);
      }
      
      return data;
    } catch (error) {
      console.error('Unexpected cleaning error:', error);
      toast.error('An unexpected error occurred during cleaning');
      return null;
    } finally {
      setIsCleaning(false);
    }
  };

  const clearReport = () => {
    setReport(null);
  };

  return {
    analyzeConsistency,
    cleanPrompts,
    clearReport,
    isAnalyzing,
    isCleaning,
    report,
  };
};