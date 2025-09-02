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
        prompt_model: 'gpt-4.1-2025-04-14',
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

    // Step 1: Analyze the street photo using GPT-4.1 Vision (optimized for speed)
    const visionStartTime = Date.now();
    console.log('Analyzing street photo with GPT-4.1...');
    
    // Create AbortController for timeout handling
    const visionController = new AbortController();
    const visionTimeout = setTimeout(() => visionController.abort(), 30000); // 30 second timeout
    
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'Connection': 'keep-alive', // Connection pooling hint
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14', // Faster vision model
        messages: [
          {
            role: 'system',
            content: 'You are a street analyst. Analyze this street photo concisely: current infrastructure, safety issues, and improvement opportunities. Be brief and focused.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this street photo and suggest improvements for: "${userPrompt}"`
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
        max_completion_tokens: 800, // Reduced from 2000 for faster processing
        temperature: 0.7, // GPT-4.1 supports temperature
      }),
      signal: visionController.signal,
    }).finally(() => {
      clearTimeout(visionTimeout);
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      const visionTime = Date.now() - visionStartTime;
      console.error('Vision API error:', {
        status: visionResponse.status,
        error: errorText,
        timingMs: visionTime
      });
      
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
    const visionTime = Date.now() - visionStartTime;
    
    const analysis = visionData.choices?.[0]?.message?.content;
    console.log(`Street analysis completed in ${visionTime}ms. Analysis length: ${analysis?.length || 0}`);

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

    // Step 2: Download original image (optimized for 1MB target)
    const downloadStartTime = Date.now();
    console.log('Downloading client-optimized image...');
    
    const downloadController = new AbortController();
    const downloadTimeout = setTimeout(() => downloadController.abort(), 15000); // 15 second timeout
    
    const originalImageResponse = await fetch(originalImageUrlData.publicUrl, {
      signal: downloadController.signal,
      headers: {
        'Connection': 'keep-alive',
      }
    }).finally(() => {
      clearTimeout(downloadTimeout);
    });
    
    if (!originalImageResponse.ok) {
      throw new Error('Failed to download original image');
    }
    
    const originalImageBuffer = await originalImageResponse.arrayBuffer();
    const downloadTime = Date.now() - downloadStartTime;
    const imageSizeMB = Math.round(originalImageBuffer.byteLength / 1024 / 1024 * 100) / 100;
    
    console.log(`Image downloaded in ${downloadTime}ms. Size: ${imageSizeMB}MB`);
    
    // Check size limit - prefer 1MB for optimal performance, max 5MB
    if (originalImageBuffer.byteLength > 5 * 1024 * 1024) {
      throw new Error(`Image is too large: ${imageSizeMB}MB. Please compress to under 5MB for optimal performance.`);
    }
    
    // Warn if image is larger than optimal
    if (originalImageBuffer.byteLength > 1024 * 1024) {
      console.log(`Warning: Image size ${imageSizeMB}MB is above optimal 1MB threshold. This may slow processing.`);
    }

    // Create editing prompt focused on street-level transformation only (max 32000 chars for gpt-image-1)
    const basePrompt = `${STREET_VISION_SYSTEM_PROMPT}. User Request: ${userPrompt}`;
    
    // Calculate remaining space for analysis (leaving buffer for safety)
    const maxPromptLength = 31500; // Leave buffer under 32000 char limit
    const remainingSpace = maxPromptLength - basePrompt.length;
    
    let editingPrompt = basePrompt;
    if (remainingSpace > 50 && analysis) {
      // Add truncated analysis if there's space
      const analysisSnippet = analysis.substring(0, Math.max(0, remainingSpace - 10));
      editingPrompt += ` Context: ${analysisSnippet}`;
    }
    
    // Final safety check - ensure we stay under gpt-image-1 limit
    if (editingPrompt.length > 32000) {
      editingPrompt = editingPrompt.substring(0, 31997) + '...';
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

    // Step 3: Generate transformed image with timeout handling
    const imageGenStartTime = Date.now();
    console.log('Starting image generation...');
    
    const formData = new FormData();
    formData.append('model', 'gpt-image-1'); // CRITICAL: Add model parameter for gpt-image-1
    formData.append('image', new File([originalImageBuffer], "input.png", { type: 'image/png' }));
    formData.append('prompt', editingPrompt);
    formData.append('size', '1024x1024');
    formData.append('n', '1');
    
    console.log('Image generation parameters:', {
      model: 'gpt-image-1',
      imageSize: `${Math.round(originalImageBuffer.byteLength / 1024)}KB`,
      promptLength: editingPrompt.length,
      size: '1024x1024'
    });

    // Log detailed image generation start timing
    console.log('Image generation started at:', new Date().toISOString());
    console.log('Expected processing time: 60-120 seconds for complex urban transformations');

    const imageResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Connection': 'keep-alive',
      },
      body: formData,
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      const imageGenTime = Date.now() - imageGenStartTime;
      console.error('Image generation API error:', {
        status: imageResponse.status,
        statusText: imageResponse.statusText,
        error: errorText,
        timingMs: imageGenTime,
        headers: Object.fromEntries(imageResponse.headers.entries())
      });
      
      // Update database with error
      await supabase
        .from('street_vision_generations')
        .update({ 
          status: 'failed',
          error_message: `Image generation error: ${imageResponse.status} - ${errorText}`,
          processing_time_ms: Date.now() - startTime
        })
        .eq('id', recordId);
      
      throw new Error(`Image generation error: ${imageResponse.status} - ${errorText}`);
    }

    const imageData_result = await imageResponse.json();
    const imageGenTime = Date.now() - imageGenStartTime;
    console.log(`Image generation completed in ${imageGenTime}ms`);
    
    // Step 4: Process and upload transformed image
    const uploadStartTime = Date.now();
    console.log('Processing transformed image...');
    
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

    const uploadTime = Date.now() - uploadStartTime;
    const processingTime = Date.now() - startTime;
    
    console.log(`Upload completed in ${uploadTime}ms`);
    console.log('Street transformation completed successfully');

    // Final database update with results and performance metrics
    await supabase
      .from('street_vision_generations')
      .update({
        transformed_image_url: transformedUrlData.publicUrl,
        processing_time_ms: processingTime,
        status: 'completed'
      })
      .eq('id', recordId);

    // Log detailed performance metrics
    console.log(`=== PERFORMANCE SUMMARY ===`);
    console.log(`Vision Analysis: ${visionTime}ms`);
    console.log(`Image Download: ${downloadTime}ms`);
    console.log(`Image Generation: ${imageGenTime}ms`);
    console.log(`Upload Processing: ${uploadTime}ms`);
    console.log(`Total Processing: ${processingTime}ms`);
    console.log(`Record ID: ${recordId}`);

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