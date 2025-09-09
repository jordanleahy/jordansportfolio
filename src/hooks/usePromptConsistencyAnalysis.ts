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

  const clearReport = () => {
    setReport(null);
  };

  return {
    analyzeConsistency,
    clearReport,
    isAnalyzing,
    report,
  };
};