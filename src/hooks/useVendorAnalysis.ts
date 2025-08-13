import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VendorAnalysisData {
  company: {
    name: string;
    slug: string;
    founded?: string;
    headquarters?: string;
    website?: string;
    description: string;
  };
  business_model: {
    primary_focus: string;
    target_market: string;
    revenue_model: string;
    key_differentiators: string[];
  };
  competitive_intelligence: {
    market_position: string;
    strengths: string[];
    weaknesses: string[];
    threats: string[];
    opportunities: string[];
  };
  financials: {
    funding_stage?: string;
    total_funding?: string;
    valuation?: string;
    revenue_range?: string;
  };
  products_services: Array<{
    name: string;
    description: string;
    target_audience: string;
  }>;
  leadership: Array<{
    name: string;
    title: string;
    background: string;
  }>;
  recent_developments: Array<{
    date: string;
    event: string;
    impact: string;
  }>;
  data_source: 'internal_database' | 'web_research' | 'hybrid';
  analysis_confidence: 'high' | 'medium' | 'low';
  last_updated: string;
}

export interface VendorAnalysisRequest {
  companyName: string;
  userId?: string;
}

export interface VendorThemeData {
  category: string;
  theme: string;
  theme_description: string;
  posts: Array<{
    day: number;
    title: string;
    story_description: string;
    status: 'draft' | 'scheduled' | 'published';
  }>;
}

export const useVendorAnalysis = () => {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<VendorAnalysisData | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (request: VendorAnalysisRequest): Promise<VendorAnalysisData> => {
      console.log('🔍 Starting vendor analysis for:', request.companyName);
      
      const { data, error } = await supabase.functions.invoke('vendor-analysis', {
        body: request
      });

      if (error) {
        console.error('Vendor analysis error:', error);
        throw new Error(error.message || 'Failed to analyze vendor');
      }

      if (!data) {
        throw new Error('No analysis data received');
      }

      console.log('✅ Vendor analysis completed:', data.company?.name);
      return data;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${data.company.name}`,
      });
    },
    onError: (error) => {
      console.error('Vendor analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze vendor",
        variant: "destructive",
      });
    },
  });

  const generateThemeMutation = useMutation({
    mutationFn: async (analysis: VendorAnalysisData): Promise<VendorThemeData> => {
      if (!analysis) {
        throw new Error('No analysis data available for theme generation');
      }

      console.log('🎨 Generating theme from vendor analysis');

      // Create competitive intelligence focused theme
      const competitiveInsights = analysis.competitive_intelligence;
      const company = analysis.company;
      
      // Generate 5 posts focusing on different competitive aspects
      const posts = [
        {
          day: 1,
          title: `Understanding ${company.name}: Market Position Analysis`,
          story_description: `Comprehensive overview of ${company.name}'s current market position: ${competitiveInsights.market_position}. Key business focus: ${analysis.business_model.primary_focus}. This analysis provides competitive intelligence for understanding their strategic positioning in the ${analysis.business_model.target_market} market.`,
          status: 'draft' as const
        },
        {
          day: 2,
          title: `${company.name}'s Competitive Strengths & Advantages`,
          story_description: `Deep dive into ${company.name}'s key competitive strengths: ${competitiveInsights.strengths.join(', ')}. Their differentiators include: ${analysis.business_model.key_differentiators.join(', ')}. Understanding these strengths is crucial for competitive positioning and identifying areas where they excel in the market.`,
          status: 'draft' as const
        },
        {
          day: 3,
          title: `Competitive Weaknesses & Vulnerabilities of ${company.name}`,
          story_description: `Analysis of ${company.name}'s potential weaknesses: ${competitiveInsights.weaknesses.join(', ')}. These areas represent opportunities for competitors to gain advantage. Understanding these gaps helps in strategic planning and competitive differentiation.`,
          status: 'draft' as const
        },
        {
          day: 4,
          title: `Market Threats & Challenges Facing ${company.name}`,
          story_description: `External threats and market challenges for ${company.name}: ${competitiveInsights.threats.join(', ')}. These factors could impact their market position and represent areas where competitors might find opportunities to capture market share.`,
          status: 'draft' as const
        },
        {
          day: 5,
          title: `Strategic Opportunities & Future Outlook for ${company.name}`,
          story_description: `Growth opportunities and strategic potential for ${company.name}: ${competitiveInsights.opportunities.join(', ')}. Recent developments include: ${analysis.recent_developments.map(d => d.event).join(', ')}. This forward-looking analysis helps understand their future competitive trajectory.`,
          status: 'draft' as const
        }
      ];

      const themeData: VendorThemeData = {
        category: 'competitive-intelligence',
        theme: `${company.name} Competitive Analysis`,
        theme_description: `Comprehensive competitive intelligence analysis of ${company.name}. This theme provides detailed insights into their market position, competitive strengths and weaknesses, strategic threats and opportunities. Based on ${analysis.data_source} with ${analysis.analysis_confidence} confidence level. Essential intelligence for competitive strategy and market positioning.`,
        posts
      };

      console.log('✅ Theme generated for vendor analysis');
      return themeData;
    },
    onSuccess: (themeData) => {
      toast({
        title: "Theme Generated",
        description: `Created competitive intelligence theme for ${analysisResult?.company.name}`,
      });
    },
    onError: (error) => {
      console.error('Theme generation failed:', error);
      toast({
        title: "Theme Generation Failed",
        description: error.message || "Failed to generate theme from analysis",
        variant: "destructive",
      });
    },
  });

  const analyzeVendor = (companyName: string, userId?: string) => {
    return analyzeMutation.mutate({ companyName, userId });
  };

  const generateTheme = (analysis?: VendorAnalysisData) => {
    const dataToUse = analysis || analysisResult;
    if (!dataToUse) {
      toast({
        title: "No Analysis Data",
        description: "Please complete vendor analysis first",
        variant: "destructive",
      });
      return;
    }
    return generateThemeMutation.mutate(dataToUse);
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
  };

  return {
    // State
    analysisResult,
    
    // Analysis operations
    analyzeVendor,
    isAnalyzing: analyzeMutation.isPending,
    analysisError: analyzeMutation.error,
    
    // Theme generation
    generateTheme,
    isGeneratingTheme: generateThemeMutation.isPending,
    themeError: generateThemeMutation.error,
    themeResult: generateThemeMutation.data,
    
    // Utilities
    clearAnalysis,
    
    // Combined operation
    analyzeAndGenerateTheme: async (companyName: string, userId?: string) => {
      try {
        const analysis = await analyzeMutation.mutateAsync({ companyName, userId });
        const theme = await generateThemeMutation.mutateAsync(analysis);
        return { analysis, theme };
      } catch (error) {
        throw error;
      }
    },
  };
};