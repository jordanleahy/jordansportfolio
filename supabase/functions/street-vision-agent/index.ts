/**
 * STREET VISION AGENT - AI-Powered Urban Design Transformation with Database Integration
 * 
 * PURPOSE:
 * This edge function transforms real street photos into AI-generated visions of safer, 
 * more livable urban spaces. It integrates with the street_vision_generations database
 * table to track all transformations, user inputs, processing metadata, and results
 * for analytics, debugging, and user history.
 * 
 * DATABASE INTEGRATION WORKFLOW:
 * 1. Extract user authentication from JWT token
 * 2. Create initial database record with status 'pending'
 * 3. Accept base64 street photo + user transformation description
 * 4. Update record: Use GPT-5 Vision API to analyze current street conditions
 * 5. Update record: Apply specialized urban design system prompt
 * 6. Update record: Generate photorealistic transformation using GPT-Image-1
 * 7. Final update: Mark as 'completed' with processing time and all results
 * 8. Error handling: Update status to 'failed' with error details
 * 
 * DATABASE TRACKING:
 * - User ID and authentication context
 * - Original image data (base64) and user prompts
 * - GPT-5 vision analysis results
 * - Transformed image results (base64)
 * - Processing metadata (models used, timing, status)
 * - Error messages and failure reasons
 * - Complete audit trail for debugging and analytics
 * 
 * INPUT:
 * - Authorization header with JWT token (for user authentication)
 * - imageData: base64-encoded street photo
 * - userPrompt: user's vision for street transformation
 * 
 * OUTPUT:
 * - recordId: database record ID for tracking
 * - analysis: GPT-5's assessment of current street conditions
 * - transformedImageBase64: AI-generated transformed street image
 * - originalPrompt: user's original transformation request
 * - processingTimeMs: total processing time in milliseconds
 * - success: boolean status indicator
 * 
 * TRANSFORMATION FOCUS:
 * - Protected bike lanes and cycling infrastructure
 * - Expanded sidewalks for pedestrians and families
 * - Added greenery, trees, and public seating
 * - Reduced car lanes and parking dominance
 * - Enhanced safety for walking and biking
 * - Preserved existing buildings and neighborhood character
 * 
 * MODELS USED:
 * - GPT-5 (gpt-5-2025-08-07): Street analysis and urban design planning
 * - GPT-Image-1: Photorealistic street transformation generation
 * 
 * DATABASE SCHEMA:
 * - street_vision_generations table with RLS policies
 * - Tracks user_id, prompts, images, analysis, metadata, timing
 * - Status tracking: pending -> analyzing -> generating -> completed/failed
 * 
 * REQUIREMENTS:
 * - OPENAI_API_KEY environment variable must be configured
 * - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for database operations
 * - User must be authenticated (JWT token in Authorization header)
 * - Input images should be actual street photos for best results
 * - Function maintains CORS compatibility for web app integration
 * 
 * ERROR HANDLING:
 * - Database connection failures
 * - Authentication validation errors
 * - OpenAI API failures (vision analysis, image generation)
 * - Input validation errors
 * - Processing timeouts and resource limits
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

// Environment variables and client setup
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Initialize Supabase client with service role for database operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Concise system prompt for image editing (max 1000 chars)
const STREET_VISION_SYSTEM_PROMPT = `Transform ONLY the street surface and sidewalks while keeping ALL buildings exactly the same. Replace cars with protected bike lanes, add street trees and wider sidewalks. Maintain exact camera angle, perspective, lighting, and building proportions. Do not change any structures above street level, architectural details, or the distance between buildings. Create photorealistic street-level improvements only.`;

serve(async (req) => {
  const startTime = Date.now();
  let recordId: string | null = null;
  
  console.log('Street Vision Agent called with database integration');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate environment variables
  if (!openAIApiKey) {
    console.error('OPENAI_API_KEY not found');
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase configuration missing');
    return new Response(JSON.stringify({ error: 'Database configuration missing' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Extract and validate user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    console.log('Authenticated user:', userId);

    // Parse and validate request body
    const { originalImagePath, userPrompt, originalFilename } = await req.json();

    if (!originalImagePath || !userPrompt) {
      return new Response(JSON.stringify({ error: 'Missing originalImagePath or userPrompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing street vision request with user prompt:', userPrompt);

    // Get the public URL for the original image
    const { data: originalImageUrlData } = supabase.storage
      .from('street-vision')
      .getPublicUrl(originalImagePath);

    // Create initial database record
    console.log('Creating database record...');
    const { data: record, error: insertError } = await supabase
      .from('street_vision_generations')
      .insert({
        user_id: userId,
        user_prompt: userPrompt,
        original_image_url: originalImageUrlData.publicUrl,
        original_filename: originalFilename,
        status: 'pending',
        prompt_model: 'gpt-5-2025-08-07',
        image_model: 'gpt-image-1'
      })
      .select()
      .single();

    if (insertError || !record) {
      console.error('Database insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create database record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    recordId = record.id;
    console.log('Database record created:', recordId);

    // Update status to analyzing
    await supabase
      .from('street_vision_generations')
      .update({ status: 'analyzing' })
      .eq('id', recordId);

    // Step 1: Analyze the street photo using GPT-5 Vision
    console.log('Analyzing street photo...');
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'You are a street and urban design analyst. Describe what you see in this street photo, focusing on current infrastructure, traffic patterns, safety concerns, and opportunities for improvement.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this street photo and identify current conditions, then suggest how to transform it based on this user request: "${userPrompt}"`
              },
              {
                type: 'image_url',
                image_url: {
                  url: originalImageUrlData.publicUrl
                }
              }
            ]
          }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Vision API error:', errorText);
      
      // Update database with error
      await supabase
        .from('street_vision_generations')
        .update({ 
          status: 'failed',
          error_message: `Vision API error: ${visionResponse.status} - ${errorText}`,
          processing_time_ms: Date.now() - startTime
        })
        .eq('id', recordId);
      
      throw new Error(`Vision API error: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    
    // Debug: Log the full vision response structure
    console.log('Vision API Response Structure:', JSON.stringify(visionData, null, 2));
    console.log('Vision API Choices:', visionData.choices);
    console.log('First Choice:', visionData.choices?.[0]);
    console.log('First Choice Message:', visionData.choices?.[0]?.message);
    
    const analysis = visionData.choices?.[0]?.message?.content;
    console.log('Extracted Analysis:', analysis);
    console.log('Street analysis completed');

    // Update database with vision analysis - with comprehensive error handling
    console.log('Updating database with analysis. Analysis length:', analysis?.length || 0);
    console.log('Analysis preview:', analysis?.substring(0, 200) + '...');
    
    const { data: analysisUpdateData, error: analysisUpdateError } = await supabase
      .from('street_vision_generations')
      .update({ 
        vision_analysis: analysis,
        status: 'generating'
      })
      .eq('id', recordId)
      .select();

    if (analysisUpdateError) {
      console.error('Error updating analysis:', analysisUpdateError);
      throw new Error(`Failed to store vision analysis: ${analysisUpdateError.message}`);
    }

    if (!analysisUpdateData || analysisUpdateData.length === 0) {
      console.error('No rows updated when storing analysis for record:', recordId);
      throw new Error('Failed to update analysis - no rows affected');
    }

    console.log('Street analysis stored successfully. Updated rows:', analysisUpdateData.length);

    // Step 2: Download original image and prepare for image editing
    console.log('Downloading original image for editing...');
    const originalImageResponse = await fetch(originalImageUrlData.publicUrl);
    if (!originalImageResponse.ok) {
      throw new Error('Failed to download original image');
    }
    const originalImageBuffer = await originalImageResponse.arrayBuffer();

    // Create editing prompt focused on street-level transformation only (max 1000 chars)
    const basePrompt = `${STREET_VISION_SYSTEM_PROMPT}. User Request: ${userPrompt}`;
    
    // Calculate remaining space for analysis (leaving buffer for safety)
    const maxPromptLength = 950; // Leave buffer under 1000 char limit
    const remainingSpace = maxPromptLength - basePrompt.length;
    
    let editingPrompt = basePrompt;
    if (remainingSpace > 50 && analysis) {
      // Add truncated analysis if there's space
      const analysisSnippet = analysis.substring(0, Math.max(0, remainingSpace - 10));
      editingPrompt += ` Context: ${analysisSnippet}`;
    }
    
    // Final safety check
    if (editingPrompt.length > 1000) {
      editingPrompt = editingPrompt.substring(0, 997) + '...';
    }

    // Store the generated prompt and update prompt creation status
    console.log('Storing image editing prompt. Length:', editingPrompt.length);
    const { data: promptUpdateData, error: promptUpdateError } = await supabase
      .from('street_vision_generations')
      .update({
        image_generation_prompt: editingPrompt,
        prompt_creation_status: 'created',
        prompt_created_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select();

    if (promptUpdateError) {
      console.error('Error storing image prompt:', promptUpdateError);
      throw new Error(`Failed to store image generation prompt: ${promptUpdateError.message}`);
    }

    if (!promptUpdateData || promptUpdateData.length === 0) {
      console.error('No rows updated when storing prompt for record:', recordId);
      throw new Error('Failed to update prompt - no rows affected');
    }

    console.log('Image editing prompt stored successfully. Updated rows:', promptUpdateData.length);

    // Use image editing API instead of generation
    const formData = new FormData();
    formData.append('image', new Blob([originalImageBuffer], { type: 'image/png' }));
    formData.append('prompt', editingPrompt);
    formData.append('size', '1024x1024');
    formData.append('n', '1');

    const imageResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Image generation error:', errorText);
      
      // Update database with error
      await supabase
        .from('street_vision_generations')
        .update({ 
          status: 'failed',
          error_message: `Image generation error: ${imageResponse.status} - ${errorText}`,
          processing_time_ms: Date.now() - startTime
        })
        .eq('id', recordId);
      
      throw new Error(`Image generation error: ${imageResponse.status}`);
    }

    const imageData_result = await imageResponse.json();
    
    // Image edits API returns URL, convert to base64 for storage
    const transformedImageUrl = imageData_result.data[0].url;
    const transformedResponse = await fetch(transformedImageUrl);
    const transformedArrayBuffer = await transformedResponse.arrayBuffer();
    const transformedImageBase64 = btoa(String.fromCharCode(...new Uint8Array(transformedArrayBuffer)));
    
    // Upload transformed image to storage
    const transformedFilename = `${userId}/transformed/${recordId}_transformed.png`;
    const transformedImageBuffer = Uint8Array.from(atob(transformedImageBase64), c => c.charCodeAt(0));
    
    const { error: uploadError } = await supabase.storage
      .from('street-vision')
      .upload(transformedFilename, transformedImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Failed to upload transformed image:', uploadError);
      throw new Error('Failed to upload transformed image');
    }

    // Get public URL for transformed image
    const { data: transformedUrlData } = supabase.storage
      .from('street-vision')
      .getPublicUrl(transformedFilename);

    const processingTime = Date.now() - startTime;
    
    console.log('Street transformation completed successfully');

    // Final database update with results
    await supabase
      .from('street_vision_generations')
      .update({
        transformed_image_url: transformedUrlData.publicUrl,
        processing_time_ms: processingTime,
        status: 'completed'
      })
      .eq('id', recordId);

    console.log(`Processing completed in ${processingTime}ms for record ${recordId}`);

    return new Response(JSON.stringify({
      recordId,
      analysis,
      transformedImageUrl: transformedUrlData.publicUrl,
      originalPrompt: userPrompt,
      processingTimeMs: processingTime,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in street-vision-agent:', error);
    
    // Update database with error if we have a record ID
    if (recordId) {
      try {
        await supabase
          .from('street_vision_generations')
          .update({ 
            status: 'failed',
            prompt_creation_status: 'failed',
            error_message: error.message || 'Unknown error occurred',
            processing_time_ms: Date.now() - startTime
          })
          .eq('id', recordId);
      } catch (dbError) {
        console.error('Failed to update database with error:', dbError);
      }
    }
    
    return new Response(JSON.stringify({ 
      recordId,
      error: error.message || 'Failed to process street transformation',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});