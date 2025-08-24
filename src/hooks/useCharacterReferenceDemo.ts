import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Demo hook to show character reference detection in action
 * This demonstrates the end-to-end flow:
 * 1. User inputs text like "Create a How to stop on the snowboard by DanDan"
 * 2. System detects "DanDan" as character reference
 * 3. Looks up character in database  
 * 4. Creates theme with character visual seed applied
 */
export const useCharacterReferenceDemo = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testCharacterReference = async (inputText: string) => {
    setIsProcessing(true);
    setResult(null);

    try {
      console.log('🎭 Testing character reference detection:', inputText);
      
      // Step 1: Structure the input to detect character references
      const { data: structuredData, error: structureError } = await supabase.functions.invoke('structure-theme-input', {
        body: { text: inputText }
      });

      if (structureError || !structuredData?.success) {
        throw new Error(structureError?.message || 'Failed to structure input');
      }

      console.log('📊 Structured data:', structuredData.data);
      
      // Check if character was detected
      const hasCharacterReference = !!structuredData.data.referenced_character;
      const characterName = structuredData.data.referenced_character;
      
      if (hasCharacterReference) {
        console.log(`✅ Character "${characterName}" detected!`);
        toast.success(`Character "${characterName}" detected and will be applied to theme visuals`);
      } else {
        console.log('ℹ️ No character reference detected');
        toast.info('No character reference detected in input');
      }

      // Step 2: Process and import the theme with character reference
      const { data: importResult, error: importError } = await supabase.functions.invoke('process-and-import-theme', {
        body: {
          rawJson: structuredData.data,
          idempotencyKey: `demo-${Date.now()}`
        }
      });

      if (importError || !importResult?.success) {
        throw new Error(importError?.message || 'Failed to import theme');
      }

      console.log('🎉 Theme created successfully:', importResult);
      
      // Verify character reference was stored
      const { data: createdTheme } = await supabase
        .from('themes')
        .select('*')
        .eq('id', importResult.themeId)
        .single();

      setResult({
        success: true,
        characterDetected: hasCharacterReference,
        characterName,
        themeId: importResult.themeId,
        themeName: createdTheme?.theme_name,
        hasCharacterReference: createdTheme?.has_character_reference,
        characterAnalysis: createdTheme?.reference_character_analysis,
        warnings: structuredData.warnings || []
      });

      toast.success('Demo completed successfully! Check the result below.');

    } catch (error) {
      console.error('Demo failed:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('Demo failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    testCharacterReference,
    isProcessing,
    result
  };
};