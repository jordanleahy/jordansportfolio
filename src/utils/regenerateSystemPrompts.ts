import { triggerMissingSystemPrompts } from './systemPromptTrigger';

/**
 * Regenerate all missing system prompts for categories that have posts
 */
export const regenerateAllSystemPrompts = async () => {
  console.log('🔄 Starting system prompt regeneration process...');
  
  try {
    const results = await triggerMissingSystemPrompts();
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('✅ Regeneration Summary:');
    console.log(`   - Successful: ${successful.length}`);
    console.log(`   - Failed: ${failed.length}`);
    console.log(`   - Total categories processed: ${results.length}`);
    
    if (successful.length > 0) {
      console.log('✅ Successfully generated system prompts for:');
      successful.forEach(r => console.log(`   - ${r.category}`));
    }
    
    if (failed.length > 0) {
      console.log('❌ Failed to generate system prompts for:');
      failed.forEach(r => console.log(`   - ${r.category}: ${r.error}`));
    }
    
    return {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      results
    };
    
  } catch (error) {
    console.error('💥 Regeneration process failed:', error);
    throw error;
  }
};