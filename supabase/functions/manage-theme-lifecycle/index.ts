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
        if (referenceImageData) {
          console.log('🎭 Theme includes visual seed from character:', referenceImageData.characterId);
          console.log('🎨 Visual characteristics:', referenceImageData.analysis?.extractedCharacteristics);
          characterData = {
            characterId: referenceImageData.characterId,
            visualSeed: referenceImageData.analysis?.extractedCharacteristics
          };
        } else {
          // Call structure-theme-input to detect character references in description
          console.log('🔍 Analyzing description for character references...');
          
          try {
            const { data: structureData, error: structureError } = await supabase.functions.invoke(
              'structure-theme-input',
              {
                body: { description },
                headers: authHeader ? { Authorization: authHeader } : {}
              }
            );

            if (structureError) {
              console.error('❌ Error calling structure-theme-input:', structureError);
            } else if (structureData?.success && structureData?.hasCharacterReference) {
              console.log('✅ Character reference detected:', structureData.characterData);
              characterData = {
                characterId: structureData.characterData?.character_id,
                visualSeed: structureData.characterData?.analysis
              };
            } else {
              console.log('📝 No character reference detected in description');
            }
          } catch (error) {
            console.error('❌ Error during character detection:', error);
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