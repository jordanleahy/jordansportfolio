
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QAResult {
  qualityScore: number;
  feedback: string[];
  suggestions: string[];
  warnings: string[];
  isRecommended: boolean;
}

serve(async (req) => {
  console.log("🤖 [vendor-qa-agent] Function invoked");
  console.log("📊 [vendor-qa-agent] Request method:", req.method);
  
  if (req.method === 'OPTIONS') {
    console.log("✅ [vendor-qa-agent] Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📝 [vendor-qa-agent] Parsing request body");
    const { vendorData } = await req.json();
    
    console.log("📊 [vendor-qa-agent] Received vendor data:", {
      company_name: vendorData?.company_name,
      dataKeys: Object.keys(vendorData || {}),
      dataSize: JSON.stringify(vendorData || {}).length,
      citationCount: vendorData?.research_data?.citation_count || 0
    });
    
    if (!vendorData) {
      console.error("❌ [vendor-qa-agent] No vendor data provided");
      throw new Error('Vendor data is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error("❌ [vendor-qa-agent] OpenAI API key not configured");
      throw new Error('OpenAI API key not configured');
    }

    console.log("🔍 [vendor-qa-agent] Analyzing vendor data for:", vendorData.company_name);
    console.log("🤖 [vendor-qa-agent] Preparing AI prompt for quality analysis");

    // Extract citation information for analysis
    const citations = vendorData.research_data?.citations || {};
    const citationCount = vendorData.research_data?.citation_count || 0;
    const uniqueDocuments = citations ? [...new Set(Object.values(citations).flat().map((c: any) => c.documentId))] : [];

    const prompt = `You are a expert business analyst specializing in healthcare technology vendor assessment. Analyze this vendor data for quality, accuracy, and completeness.

VENDOR DATA:
${JSON.stringify(vendorData, null, 2)}

CITATION ANALYSIS:
- Total Citations: ${citationCount}
- Unique Source Documents: ${uniqueDocuments.length}
- Fields with Citations: ${Object.keys(citations).join(', ')}
- Citation Density: ${citationCount > 0 ? 'High' : 'None'}

Evaluate the following criteria and provide a detailed assessment:

1. DATA QUALITY (25 points):
   - Completeness of information
   - Consistency across fields
   - Professional language and clarity
   - Absence of placeholder/generic text

2. SOURCE QUALITY (25 points):
   - Citation coverage and density
   - Source diversity and credibility
   - Verification of key claims
   - Research data transparency

3. BUSINESS LOGIC (25 points):
   - Realistic funding amounts and stages
   - Consistent company type vs services
   - Logical headquarters vs founding year
   - Reasonable company size indicators

4. COMPETITIVE ACCURACY (25 points):
   - Services align with company type
   - Competitive advantages are specific
   - Key features are differentiated
   - Target customers make sense

CITATION SCORING BONUS:
- Add 5 points for excellent citation coverage (>50 citations)
- Add 3 points for good citation coverage (20-50 citations)
- Add 1 point for basic citation coverage (5-20 citations)
- Subtract 5 points for no citations on key claims

Provide your response in this EXACT JSON format (no markdown):
{
  "qualityScore": [1-100 integer],
  "feedback": ["specific observation 1", "specific observation 2"],
  "suggestions": ["improvement suggestion 1", "improvement suggestion 2"],
  "warnings": ["critical issue 1", "critical issue 2"],
  "isRecommended": [true/false based on score >= 70]
}

Be specific and actionable in your feedback. Focus on both data quality and source citation quality.`;

    console.log("🚀 [vendor-qa-agent] Calling OpenAI API");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a business data quality analyst with expertise in source verification and citation analysis. Respond only with valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    console.log("📬 [vendor-qa-agent] OpenAI API response status:", response.status);
    
    if (!response.ok) {
      console.error("❌ [vendor-qa-agent] OpenAI API error:", response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log("✅ [vendor-qa-agent] AI Response received");
    console.log("📋 [vendor-qa-agent] AI Response preview:", aiResponse.substring(0, 200) + "...");

    // Parse AI response and validate format
    let qaResult: QAResult;
    try {
      console.log("🔧 [vendor-qa-agent] Parsing AI response JSON");
      qaResult = JSON.parse(aiResponse);
      
      console.log("📊 [vendor-qa-agent] Parsed QA result:", {
        qualityScore: qaResult.qualityScore,
        feedbackCount: qaResult.feedback?.length || 0,
        suggestionsCount: qaResult.suggestions?.length || 0,
        warningsCount: qaResult.warnings?.length || 0,
        isRecommended: qaResult.isRecommended,
        citationBonus: citationCount > 50 ? 5 : citationCount > 20 ? 3 : citationCount > 5 ? 1 : 0
      });
      
      // Validate required fields
      if (typeof qaResult.qualityScore !== 'number' || 
          !Array.isArray(qaResult.feedback) ||
          !Array.isArray(qaResult.suggestions) ||
          !Array.isArray(qaResult.warnings) ||
          typeof qaResult.isRecommended !== 'boolean') {
        console.error("❌ [vendor-qa-agent] Invalid QA result format detected");
        throw new Error('Invalid QA result format');
      }

      // Ensure score is in valid range
      const originalScore = qaResult.qualityScore;
      qaResult.qualityScore = Math.max(1, Math.min(100, qaResult.qualityScore));
      if (originalScore !== qaResult.qualityScore) {
        console.log(`🔧 [vendor-qa-agent] Score clamped from ${originalScore} to ${qaResult.qualityScore}`);
      }
      
      // Add citation-specific feedback
      if (citationCount > 0) {
        qaResult.feedback.push(`Excellent source documentation with ${citationCount} citations from ${uniqueDocuments.length} sources`);
      } else {
        qaResult.warnings.push('No source citations found - consider adding source references for key claims');
      }
      
      console.log("✅ [vendor-qa-agent] QA result validation passed");
      
    } catch (parseError) {
      console.error("❌ [vendor-qa-agent] Failed to parse AI response:", parseError);
      console.error("❌ [vendor-qa-agent] Raw AI response:", aiResponse);
      // Fallback result with citation consideration
      console.log("⚠️ [vendor-qa-agent] Using fallback QA result");
      qaResult = {
        qualityScore: citationCount > 0 ? 60 : 40,
        feedback: citationCount > 0 ? ['Source citations detected but analysis failed'] : ['AI analysis failed - manual review recommended'],
        suggestions: ['Verify all data fields manually', 'Add source citations for key claims'],
        warnings: ['QA agent encountered an error'],
        isRecommended: citationCount > 20
      };
    }

    console.log("🎯 [vendor-qa-agent] Final QA Result:", {
      qualityScore: qaResult.qualityScore,
      isRecommended: qaResult.isRecommended,
      totalFeedback: qaResult.feedback.length,
      totalSuggestions: qaResult.suggestions.length,
      totalWarnings: qaResult.warnings.length,
      citationCount: citationCount
    });

    console.log("✅ [vendor-qa-agent] Returning successful QA analysis");
    return new Response(JSON.stringify(qaResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("❌ [vendor-qa-agent] Function error:", error);
    console.error("❌ [vendor-qa-agent] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      qualityScore: 0,
      feedback: ['QA analysis failed'],
      suggestions: ['Manual review required', 'Add source citations'],
      warnings: ['QA system error'],
      isRecommended: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
