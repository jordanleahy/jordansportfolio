import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, description, themeId, referenceImageData } = await req.json();
    const authHeader = req.headers.get('Authorization');

    console.log(`🎨 Theme lifecycle action: ${action}`, { description, themeId, hasReferenceImage: !!referenceImageData });

    switch (action) {
      case 'create':
        console.log('📝 Creating theme with description:', description);
        
        let characterData = null;
        
        // First check if we have reference image data
        console.log('🔍 Checking for reference image data...', { hasReferenceImage: !!referenceImageData });
        
        if (referenceImageData) {
          console.log('🎭 Theme includes visual seed from character:', referenceImageData.characterId);
          console.log('🎨 Visual characteristics:', referenceImageData.analysis?.extractedCharacteristics);
          characterData = {
            characterId: referenceImageData.characterId,
            visualSeed: referenceImageData.analysis?.extractedCharacteristics
          };
        } else {
          // Detect character references directly in description text
          console.log('🔍 No reference image data, analyzing description for character references...');
          console.log('📝 Description to analyze:', description);
          
          // Look for patterns like "by [Name]", "with [Name]", "featuring [Name]"
          const characterPatterns = [
            /\bby\s+([A-Za-z][A-Za-z0-9]*)\b/i,
            /\bwith\s+([A-Za-z][A-Za-z0-9]*)\b/i,
            /\bfeaturing\s+([A-Za-z][A-Za-z0-9]*)\b/i,
            /\bfrom\s+([A-Za-z][A-Za-z0-9]*)\b/i
          ];
          
          let detectedCharacterName = null;
          let matchedPattern = null;
          
          for (const pattern of characterPatterns) {
            const match = description.match(pattern);
            if (match && match[1]) {
              detectedCharacterName = match[1].trim();
              matchedPattern = match[0];
              console.log('✅ Character pattern detected:', { pattern: matchedPattern, name: detectedCharacterName });
              break;
            }
          }
          
          if (detectedCharacterName) {
            try {
              console.log('🔍 Looking up character in database:', detectedCharacterName);
              
              const { data: character, error } = await supabase
                .from('characters')
                .select('id, character_name, character_description, sample_image_url')
                .ilike('character_name', `%${detectedCharacterName}%`)
                .limit(1)
                .maybeSingle();
              
              if (character && !error) {
                console.log('✅ Character found in database:', character);
                characterData = {
                  characterId: character.id,
                  visualSeed: {
                    character_name: character.character_name,
                    description: character.character_description,
                    sample_image_url: character.sample_image_url
                  }
                };
              } else {
                console.log('❌ Character not found in database:', detectedCharacterName, error);
              }
            } catch (dbError) {
              console.error('❌ Database lookup error:', dbError);
            }
          } else {
            console.log('📝 No character patterns detected in description');
          }
        }
        
        const newThemeId = crypto.randomUUID();
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Theme creation initiated',
            themeId: newThemeId,
            characterId: characterData?.characterId || null,
            visualSeed: characterData?.visualSeed || null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'complete':
        console.log('✅ Marking theme as completed:', themeId);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Theme marked as completed',
            themeId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('❌ Error in manage-theme-lifecycle:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process theme lifecycle action',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});