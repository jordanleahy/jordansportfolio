// QA Test Script for System Prompts and Visual Agents
// Run this to test the system prompt generation and image prompt functionality

import { supabase } from '@/integrations/supabase/client';
import { triggerSystemPromptGeneration } from '@/utils/systemPromptTrigger';

const QA_RESULTS = {
  sepsis_theme_issues: {
    theme_id: '090de78e-aec7-44b9-a765-e1a4cb815626',
    theme_name: 'Understanding Sepsis: A Critical Health Issue',
    issues: [
      'No visual_prompt_system_prompt_id linked to theme',
      '1:1 images failed generation', 
      '16:9 images working (using fallback category prompts)',
      'Missing sepsis-awareness system prompt in database'
    ],
    posts_status: {
      total: 5,
      images_16_9: '5/5 complete', 
      images_1_1: '0/5 complete (all failed)'
    }
  },
  visual_prompt_agent: {
    agent_id: '159f87b8-a4bb-461f-86c4-a344c42c06a2',
    name: 'Visual Prompt Generator',
    working: 'Partially - fallback logic functional but theme linkage broken'
  },
  system_prompts: {
    available_themes: 10,
    missing_categories: ['sepsis-awareness'],
    working_themes: ['Bacterial Sepsis Recognition and Validation', 'Pancytopenia']
  }
};

// Function to test and fix the system
export async function qaAndFix() {
  console.log('🔍 QA: Testing System Prompts and Visual Agents');
  
  // Step 1: Generate missing system prompt for sepsis-awareness
  console.log('🛠️ STEP 1: Generating missing system prompt for sepsis-awareness');
  try {
    const result = await triggerSystemPromptGeneration('sepsis-awareness');
    console.log('✅ System prompt generation result:', result);
  } catch (error) {
    console.error('❌ System prompt generation failed:', error);
  }
  
  // Step 2: Fix theme linkage after prompt is created
  console.log('🛠️ STEP 2: Will need to update theme linkage after prompt creation');
  
  return QA_RESULTS;
}

export default QA_RESULTS;