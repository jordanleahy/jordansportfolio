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
 */ import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
// Environment variables and client setup
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// Initialize Supabase client with service role for database operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Technical constraints to support user vision (kept minimal to prioritize user input)
const TECHNICAL_CONSTRAINTS = `Technical requirements: Transform street-level only, keep all buildings unchanged, maintain exact perspective and lighting, photorealistic results.`;
serve(async (req)=>{
  const startTime = Date.now();
  let recordId = null;
  console.log('Street Vision Agent called with database integration');
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  // Validate environment variables
  if (!openAIApiKey) {
    console.error('OPENAI_API_KEY not found');
    return new Response(JSON.stringify({
      error: 'OpenAI API key not configured'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase configuration missing');
    return new Response(JSON.stringify({
      error: 'Database configuration missing'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    // Extract and validate user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Authorization header required'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({
        error: 'Invalid authentication token'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const userId = user.id;
    console.log('Authenticated user:', userId);
    // Parse and validate request body
    const { originalImagePath, userPrompt, originalFilename } = await req.json();
    if (!originalImagePath || !userPrompt) {
      return new Response(JSON.stringify({
        error: 'Missing originalImagePath or userPrompt'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Processing street vision request with user prompt:', userPrompt);
    // Get the public URL for the original image
    const { data: originalImageUrlData } = supabase.storage.from('street-vision').getPublicUrl(originalImagePath);
    // Create initial database record
    console.log('Creating database record...');
    const { data: record, error: insertError } = await supabase.from('street_vision_generations').insert({
      user_id: userId,
      user_prompt: userPrompt,
      original_image_url: originalImageUrlData.publicUrl,
      original_filename: originalFilename,
      status: 'pending',
      prompt_model: 'gpt-5-2025-08-07',
      image_model: 'gpt-image-1'
    }).select().single();
    if (insertError || !record) {
      console.error('Database insert error:', insertError);
      return new Response(JSON.stringify({
        error: 'Failed to create database record'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    recordId = record.id;
    console.log('Database record created:', recordId);
    // Update status to analyzing
    await supabase.from('street_vision_generations').update({
      status: 'analyzing'
    }).eq('id', recordId);
    // Step 1: Analyze the street photo using GPT-5.1 Vision (optimized for speed)
    const visionStartTime = Date.now();
    console.log('Analyzing street photo with GPT-5.1...');
    
    // === ENHANCED LOGGING: PRE-API CALL ===
    console.log('=== VISION ANALYSIS DEBUG: PRE-API CALL ===');
    console.log('OpenAI API Key Status:', openAIApiKey ? `Present (length: ${openAIApiKey.length})` : 'MISSING');
    console.log('Image URL being sent to OpenAI:', originalImageUrlData.publicUrl);
    console.log('User prompt being analyzed:', userPrompt);
    console.log('System prompt length:', 'You are a street analyst. Analyze this street photo concisely: current infrastructure, safety issues, and improvement opportunities. Be brief and focused.'.length);
    
    const requestPayload = {
      model: 'gpt-5-2025-08-07',
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
      max_completion_tokens: 800
    };
    
    console.log('Request payload summary:', {
      model: requestPayload.model,
      max_completion_tokens: requestPayload.max_completion_tokens,
      system_content_length: requestPayload.messages[0].content.length,
      user_text_length: requestPayload.messages[1].content[0].text.length,
      image_url_provided: !!requestPayload.messages[1].content[1].image_url.url
    });
    
    // Create AbortController for timeout handling
    const visionController = new AbortController();
    const visionTimeout = setTimeout(()=>visionController.abort(), 30000); // 30 second timeout
    
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      },
      body: JSON.stringify(requestPayload),
      signal: visionController.signal
    }).finally(()=>{
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
      await supabase.from('street_vision_generations').update({
        status: 'failed',
        error_message: `Vision API error: ${visionResponse.status} - ${errorText}`,
        processing_time_ms: Date.now() - startTime
      }).eq('id', recordId);
      throw new Error(`Vision API error: ${visionResponse.status}`);
    }
    const visionData = await visionResponse.json();
    const visionTime = Date.now() - visionStartTime;
    
    // === ENHANCED LOGGING: API RESPONSE ANALYSIS ===
    console.log('=== VISION ANALYSIS DEBUG: API RESPONSE ===');
    console.log('Response status:', visionResponse.status);
    console.log('Response headers:', Object.fromEntries(visionResponse.headers.entries()));
    console.log('Raw response structure:', {
      hasChoices: !!visionData.choices,
      choicesLength: visionData.choices?.length,
      hasUsage: !!visionData.usage,
      hasModel: !!visionData.model,
      hasId: !!visionData.id
    });
    
    if (visionData.choices && visionData.choices.length > 0) {
      console.log('First choice structure:', {
        hasMessage: !!visionData.choices[0].message,
        hasContent: !!visionData.choices[0].message?.content,
        messageRole: visionData.choices[0].message?.role,
        finishReason: visionData.choices[0].finish_reason
      });
    } else {
      console.log('WARNING: No choices found in response!');
    }
    
    const analysis = visionData.choices?.[0]?.message?.content;
    
    // === ENHANCED LOGGING: CONTENT ANALYSIS ===
    console.log('=== VISION ANALYSIS DEBUG: CONTENT ANALYSIS ===');
    console.log('Analysis type:', typeof analysis);
    console.log('Analysis is null:', analysis === null);
    console.log('Analysis is undefined:', analysis === undefined);
    console.log('Analysis is empty string:', analysis === '');
    console.log('Analysis is whitespace only:', analysis && analysis.trim() === '');
    console.log('Analysis length:', analysis?.length || 0);
    
    if (analysis) {
      console.log('Analysis first 100 chars:', analysis.substring(0, 100));
      console.log('Analysis last 50 chars:', analysis.substring(Math.max(0, analysis.length - 50)));
      console.log('Analysis contains non-whitespace:', /\S/.test(analysis));
    } else {
      console.log('Analysis content is falsy:', { analysis });
    }
    
    console.log(`Street analysis completed in ${visionTime}ms. Analysis length: ${analysis?.length || 0}`);
    // Update database with vision analysis - with comprehensive error handling
    console.log('=== VISION ANALYSIS DEBUG: DATABASE OPERATIONS ===');
    console.log('About to store analysis in database:');
    console.log('- Record ID:', recordId);
    console.log('- Analysis type:', typeof analysis);
    console.log('- Analysis length:', analysis?.length || 0);
    console.log('- Analysis is truthy:', !!analysis);
    console.log('- Analysis value (first 300 chars):', analysis?.substring(0, 300) || 'NULL/UNDEFINED');
    
    const updatePayload = {
      vision_analysis: analysis,
      status: 'generating'
    };
    
    console.log('Database update payload:', {
      vision_analysis_type: typeof updatePayload.vision_analysis,
      vision_analysis_length: updatePayload.vision_analysis?.length || 0,
      status: updatePayload.status
    });
    
    const { data: analysisUpdateData, error: analysisUpdateError } = await supabase.from('street_vision_generations').update(updatePayload).eq('id', recordId).select();
    
    if (analysisUpdateError) {
      console.error('=== DATABASE UPDATE ERROR ===');
      console.error('Error updating analysis:', analysisUpdateError);
      console.error('Error details:', {
        message: analysisUpdateError.message,
        details: analysisUpdateError.details,
        hint: analysisUpdateError.hint,
        code: analysisUpdateError.code
      });
      throw new Error(`Failed to store vision analysis: ${analysisUpdateError.message}`);
    }
    
    if (!analysisUpdateData || analysisUpdateData.length === 0) {
      console.error('=== DATABASE UPDATE WARNING ===');
      console.error('No rows updated when storing analysis for record:', recordId);
      console.error('Update response:', analysisUpdateData);
      throw new Error('Failed to update analysis - no rows affected');
    }
    
    console.log('=== DATABASE UPDATE SUCCESS ===');
    console.log('Street analysis stored successfully. Updated rows:', analysisUpdateData.length);
    console.log('Updated record data:', {
      id: analysisUpdateData[0]?.id,
      vision_analysis_length: analysisUpdateData[0]?.vision_analysis?.length || 0,
      status: analysisUpdateData[0]?.status,
      updated_at: analysisUpdateData[0]?.updated_at
    });
    
    // Verify the data was actually stored correctly
    const { data: verificationData, error: verificationError } = await supabase
      .from('street_vision_generations')
      .select('vision_analysis, status')
      .eq('id', recordId)
      .single();
    
    if (verificationError) {
      console.warn('Could not verify database storage:', verificationError);
    } else {
      console.log('=== DATABASE VERIFICATION ===');
      console.log('Verified stored analysis:', {
        type: typeof verificationData.vision_analysis,
        length: verificationData.vision_analysis?.length || 0,
        status: verificationData.status,
        content_preview: verificationData.vision_analysis?.substring(0, 100) || 'EMPTY/NULL'
      });
    }
    // Step 2: Download original image (optimized for 1MB target)
    const downloadStartTime = Date.now();
    console.log('Downloading client-optimized image...');
    const downloadController = new AbortController();
    const downloadTimeout = setTimeout(()=>downloadController.abort(), 15000); // 15 second timeout
    const originalImageResponse = await fetch(originalImageUrlData.publicUrl, {
      signal: downloadController.signal,
      headers: {
        'Connection': 'keep-alive'
      }
    }).finally(()=>{
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
    // Create user-focused editing prompt that prioritizes their specific transformation vision
    const maxPromptLength = 1000; // Target optimal range
    
    // Ensure user prompt is never empty or too short
    if (!userPrompt || userPrompt.trim().length < 10) {
      throw new Error('User prompt must be at least 10 characters long and describe the desired transformation');
    }
    
    // Start with user's vision as the primary directive (60-70% of prompt priority)
    let editingPrompt = userPrompt.trim();
    
    // Calculate space remaining for technical constraints and analysis
    const userPromptLength = editingPrompt.length;
    const technicalConstraintsLength = TECHNICAL_CONSTRAINTS.length;
    const remainingSpace = maxPromptLength - userPromptLength - technicalConstraintsLength - 20; // 20 chars buffer
    
    // Add key insights from vision analysis if space allows (10-15% of prompt)
    if (remainingSpace > 50 && analysis) {
      // Extract only the most relevant infrastructure keywords for context
      const analysisWords = analysis.split(' ');
      const keyTerms = analysisWords.filter(word => 
        /current|existing|lanes?|sidewalks?|parking|trees?|bikes?|pedestrian|traffic|safety|width|narrow|wide/i.test(word)
      );
      
      if (keyTerms.length > 0) {
        // Take only essential keywords that fit in remaining space
        const maxKeywordsSpace = Math.min(remainingSpace - 10, 80); // Leave buffer, cap at 80 chars
        const keyInsights = keyTerms.slice(0, Math.floor(maxKeywordsSpace / 8)).join(' ');
        editingPrompt += `. Current conditions: ${keyInsights}`;
      }
    }
    
    // Append technical constraints as supporting requirements (20-25% of prompt)
    editingPrompt += `. ${TECHNICAL_CONSTRAINTS}`;
    
    // Final length check - prioritize user content if we exceed limit
    if (editingPrompt.length > maxPromptLength) {
      // If over limit, preserve user prompt and essential technical constraints
      const essentialConstraints = "Transform street-level only, keep buildings unchanged, photorealistic.";
      const availableSpace = maxPromptLength - essentialConstraints.length - 2; // 2 chars for ". "
      
      if (userPromptLength <= availableSpace) {
        // User prompt fits, use shortened constraints
        editingPrompt = `${userPrompt.trim()}. ${essentialConstraints}`;
      } else {
        // Truncate analysis first, preserve user prompt and basic constraints
        editingPrompt = `${userPrompt.trim()}. ${essentialConstraints}`;
        if (editingPrompt.length > maxPromptLength) {
          // Last resort: slightly truncate user prompt but never below 200 chars
          const minUserPrompt = Math.max(200, maxPromptLength - essentialConstraints.length - 2);
          const truncatedUserPrompt = userPrompt.substring(0, minUserPrompt - 3) + '...';
          editingPrompt = `${truncatedUserPrompt}. ${essentialConstraints}`;
        }
      }
    }
    
    // Store the generated prompt and update prompt creation status
    console.log('=== PROMPT CONSTRUCTION SUMMARY ===');
    console.log('User prompt (priority #1):', userPrompt.substring(0, 150) + (userPrompt.length > 150 ? '...' : ''));
    console.log('Technical constraints:', TECHNICAL_CONSTRAINTS.substring(0, 100) + '...');
    console.log('Final prompt length:', editingPrompt.length, 'characters');
    console.log('Final prompt preview:', editingPrompt.substring(0, 200) + (editingPrompt.length > 200 ? '...' : ''));
    console.log('Storing image editing prompt. Length:', editingPrompt.length);
    const { data: promptUpdateData, error: promptUpdateError } = await supabase.from('street_vision_generations').update({
      image_generation_prompt: editingPrompt,
      prompt_creation_status: 'created',
      prompt_created_at: new Date().toISOString()
    }).eq('id', recordId).select();
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
    formData.append('model', 'gpt-image-1');
    formData.append('image', new File([
      originalImageBuffer
    ], "input.png", {
      type: 'image/png'
    }));
    formData.append('prompt', editingPrompt);
    formData.append('size', '1024x1024');
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
        'Connection': 'keep-alive'
      },
      body: formData
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
      await supabase.from('street_vision_generations').update({
        status: 'failed',
        error_message: `Image generation error: ${imageResponse.status} - ${errorText}`,
        processing_time_ms: Date.now() - startTime
      }).eq('id', recordId);
      throw new Error(`Image generation error: ${imageResponse.status} - ${errorText}`);
    }
    const imageData_result = await imageResponse.json();
    const imageGenTime = Date.now() - imageGenStartTime;
    console.log(`Image generation completed in ${imageGenTime}ms`);
    
    // Log the actual response structure for debugging
    console.log('Image generation response structure:', {
      hasData: !!imageData_result.data,
      dataLength: imageData_result.data?.length,
      firstItemKeys: imageData_result.data?.[0] ? Object.keys(imageData_result.data[0]) : 'no data'
    });
    
    // Step 4: Process and upload transformed image
    const uploadStartTime = Date.now();
    console.log('Processing transformed image...');
    
    let transformedImageBase64;
    
    // Handle both gpt-image-1 (base64) and legacy (URL) response formats
    if (imageData_result.data?.[0]?.b64_json) {
      // gpt-image-1 returns base64 data directly - use it without additional fetch
      console.log('Using base64 response from gpt-image-1');
      transformedImageBase64 = imageData_result.data[0].b64_json;
    } else if (imageData_result.data?.[0]?.url) {
      // Legacy format returns URL - fetch and convert to base64
      console.log('Fetching image from URL response');
      const transformedImageUrl = imageData_result.data[0].url;
      const transformedResponse = await fetch(transformedImageUrl);
      if (!transformedResponse.ok) {
        throw new Error(`Failed to fetch transformed image: ${transformedResponse.status}`);
      }
      const transformedArrayBuffer = await transformedResponse.arrayBuffer();
      transformedImageBase64 = btoa(String.fromCharCode(...new Uint8Array(transformedArrayBuffer)));
    } else {
      console.error('Unexpected image response format:', imageData_result);
      throw new Error('Image generation response missing expected data format (no b64_json or url found)');
    }
    // Upload transformed image to storage
    const transformedFilename = `${userId}/transformed/${recordId}_transformed.png`;
    const transformedImageBuffer = Uint8Array.from(atob(transformedImageBase64), (c)=>c.charCodeAt(0));
    const { error: uploadError } = await supabase.storage.from('street-vision').upload(transformedFilename, transformedImageBuffer, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: true
    });
    if (uploadError) {
      console.error('Failed to upload transformed image:', uploadError);
      throw new Error('Failed to upload transformed image');
    }
    // Get public URL for transformed image
    const { data: transformedUrlData } = supabase.storage.from('street-vision').getPublicUrl(transformedFilename);
    const uploadTime = Date.now() - uploadStartTime;
    const processingTime = Date.now() - startTime;
    console.log(`Upload completed in ${uploadTime}ms`);
    console.log('Street transformation completed successfully');
    // Final database update with results and performance metrics
    await supabase.from('street_vision_generations').update({
      transformed_image_url: transformedUrlData.publicUrl,
      processing_time_ms: processingTime,
      status: 'completed'
    }).eq('id', recordId);
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
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in street-vision-agent:', error);
    // Update database with error if we have a record ID
    if (recordId) {
      try {
        await supabase.from('street_vision_generations').update({
          status: 'failed',
          prompt_creation_status: 'failed',
          error_message: error.message || 'Unknown error occurred',
          processing_time_ms: Date.now() - startTime
        }).eq('id', recordId);
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
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
