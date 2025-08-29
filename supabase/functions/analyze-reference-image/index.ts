/**
 * EDGE FUNCTION: Analyze Reference Image
 * 
 * PURPOSE:
 * Analyzes uploaded reference images to extract visual characteristics including
 * color palette, composition, style, lighting, and other visual elements that
 * can be used to enhance image generation prompts.
 * 
 * INPUTS:
 * - image: base64 encoded image data
 * - aspectsToAnalyze: array of analysis aspects to focus on (optional)
 * 
 * OUTPUTS:
 * - Success: { analysis: object, extractedCharacteristics: object }
 * - Error: { error: string }
 * 
 * DEPENDENCIES:
 * - OpenAI API (GPT-4 Vision for image analysis)
 * 
 * USAGE:
 * Called from: Reference image upload components, prompt enhancement workflows
 * Authentication: Required for rate limiting and usage tracking
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageAnalysisRequest {
  image: string; // base64 encoded image
  aspectsToAnalyze?: string[]; // ['colors', 'composition', 'style', 'lighting', 'mood']
}

interface ImageAnalysisResponse {
  colors: {
    dominant: string[];
    palette: string[];
    mood: string;
    temperature: 'warm' | 'cool' | 'neutral';
  };
  composition: {
    layout: string;
    balance: string;
    focalPoints: string[];
    visualFlow: string;
  };
  style: {
    artistic: string;
    technique: string;
    aesthetic: string;
    complexity: 'minimal' | 'moderate' | 'complex';
  };
  lighting: {
    quality: string;
    direction: string;
    mood: string;
    intensity: 'soft' | 'moderate' | 'dramatic';
  };
  technical: {
    perspective: string;
    depth: string;
    quality: string;
  };
  mood: {
    overall: string;
    emotional: string;
    professional: boolean;
  };
  elements: {
    subjects: string[];
    objects: string[];
    environment: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { image, aspectsToAnalyze = ['colors', 'composition', 'style', 'lighting'] }: ImageAnalysisRequest = await req.json();

    if (!image) {
      throw new Error('Image data is required');
    }

    // Ensure image is in correct format for OpenAI
    const imageData = image.startsWith('data:image/') ? image : `data:image/jpeg;base64,${image}`;

    console.log('🔍 Analyzing reference image with aspects:', aspectsToAnalyze);

    // Create comprehensive analysis prompt
    const analysisPrompt = `Analyze this reference image and provide detailed information about the following aspects: ${aspectsToAnalyze.join(', ')}.

Please respond with a JSON object containing the following structure:

{
  "colors": {
    "dominant": ["#hexcode1", "#hexcode2", "#hexcode3"],
    "palette": ["#hexcode1", "#hexcode2", "#hexcode3", "#hexcode4", "#hexcode5"],
    "mood": "description of color mood",
    "temperature": "warm|cool|neutral"
  },
  "composition": {
    "layout": "description of overall layout",
    "balance": "description of visual balance",
    "focalPoints": ["main focal point", "secondary elements"],
    "visualFlow": "description of how the eye moves through the image"
  },
  "style": {
    "artistic": "description of artistic style",
    "technique": "rendering technique (vector, photograph, illustration, etc.)",
    "aesthetic": "overall aesthetic description",
    "complexity": "minimal|moderate|complex"
  },
  "lighting": {
    "quality": "description of lighting quality",
    "direction": "description of light direction",
    "mood": "mood created by lighting",
    "intensity": "soft|moderate|dramatic"
  },
  "technical": {
    "perspective": "description of perspective/viewpoint",
    "depth": "description of depth and dimensionality",
    "quality": "description of image quality and clarity"
  },
  "mood": {
    "overall": "overall mood description",
    "emotional": "emotional tone",
    "professional": true|false
  },
  "elements": {
    "subjects": ["main subjects in the image"],
    "objects": ["key objects or elements"],
    "environment": "description of setting/environment"
  }
}

Focus on providing actionable information that could be used to enhance image generation prompts. Include specific hex color codes for the color analysis, and be descriptive but concise for all other aspects.`;

    const requestBody = {
      model: 'gpt-5-2025-08-07',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: analysisPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageData,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_completion_tokens: 2000,
      response_format: { type: 'json_object' }
    };

    console.log('🔍 Making OpenAI Vision API request...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    console.log('✅ Raw analysis received, parsing JSON...');

    let analysis: ImageAnalysisResponse;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse analysis JSON:', parseError);
      throw new Error('Failed to parse image analysis response');
    }

    // Extract key characteristics for prompt enhancement
    const extractedCharacteristics = {
      colorPalette: analysis.colors?.palette || [],
      dominantColors: analysis.colors?.dominant || [],
      colorMood: analysis.colors?.mood || '',
      compositionStyle: analysis.composition?.layout || '',
      artisticStyle: analysis.style?.artistic || '',
      lightingMood: analysis.lighting?.mood || '',
      overallMood: analysis.mood?.overall || '',
      complexity: analysis.style?.complexity || 'moderate',
      professional: analysis.mood?.professional || false
    };

    console.log('✅ Image analysis completed successfully');

    return new Response(
      JSON.stringify({
        analysis,
        extractedCharacteristics,
        aspectsAnalyzed: aspectsToAnalyze
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-reference-image:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to analyze reference image',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});