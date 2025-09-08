import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { image, context } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: image' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Starting QA vision analysis...');

    const qaResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a meticulous QA specialist analyzing visual content for quality issues. 

Your task is to thoroughly examine images and identify potential problems:

**TEXT ISSUES:**
- Missing or incomplete text (e.g., "C is for..." without the actual word)
- Cut-off text at edges
- Overlapping or unreadable text
- Inconsistent fonts or formatting
- Spelling errors or typos

**VISUAL ISSUES:**
- Missing UI elements (buttons, icons, images)
- Layout problems (misaligned elements, poor spacing)
- Broken or corrupted images
- Color inconsistencies
- Resolution/quality issues

**CONTENT ISSUES:**
- Missing content that should be present
- Placeholder text still showing
- Broken functionality indicators
- Incomplete forms or interfaces

**OUTPUT FORMAT:**
Provide a JSON response with:
- "hasIssues": boolean
- "severity": "low" | "medium" | "high" | "critical"
- "issues": array of specific problems found
- "suggestions": array of recommended fixes
- "overallAssessment": brief summary

Be thorough but practical. Flag genuine issues that would impact user experience.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this image for QA issues. ${context ? `Context: ${context}` : ''}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_completion_tokens: 800,
        temperature: 0.1
      }),
    });

    if (!qaResponse.ok) {
      const error = await qaResponse.text();
      console.error('❌ QA Vision API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const qaData = await qaResponse.json();
    const analysisResult = qaData.choices[0].message.content;
    
    console.log('✅ QA analysis completed');

    let parsedResult;
    try {
      // Try to parse as JSON first
      parsedResult = JSON.parse(analysisResult);
    } catch {
      // If not JSON, create structured response
      parsedResult = {
        hasIssues: analysisResult.toLowerCase().includes('issue') || analysisResult.toLowerCase().includes('problem'),
        severity: 'medium',
        issues: [analysisResult],
        suggestions: ['Review the analysis and address identified concerns'],
        overallAssessment: analysisResult.substring(0, 200) + '...'
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: parsedResult,
        rawAnalysis: analysisResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in QA vision check:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred during QA analysis', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});