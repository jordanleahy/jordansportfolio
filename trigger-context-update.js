// Temporary script to trigger context-aware visual prompt generation
// This will be deleted after use

import { supabase } from './src/integrations/supabase/client.js';

async function triggerContextUpdate() {
  const themeData = {
    category: 'product-design',
    theme: 'Product Design Communication Skills',
    description: 'Essential communication and collaboration skills for product designers working in cross-functional teams',
    posts: [
      {
        day: 1,
        title: 'Speak Their Language',
        description: 'Communication is more than talking—it\'s about clarity across functions. Designers must adapt their language for PMs, engineers, and marketers. For example, use business impact with execs and technical rationale with engineers.'
      },
      {
        day: 2,
        title: 'Active Listening Wins Trust',
        description: 'Listening with intent—not just to respond—helps designers truly understand stakeholder goals. Mirror language, ask clarifying questions, and summarize back.'
      },
      {
        day: 3,
        title: 'Empathy for Non-Designers',
        description: 'Empathy isn\'t just for users—it\'s for teammates. Understand engineering constraints or PM pressure points to drive alignment.'
      },
      {
        day: 4,
        title: 'Navigate Ambiguity',
        description: 'In early product discovery or shifting roadmaps, ambiguity is the norm. Show comfort with "gray zones" and drive decisions with partial data.'
      },
      {
        day: 5,
        title: 'Influence Without Authority',
        description: 'You don\'t need a title to lead. Persuasion based on insight, timing, and trust is a designer\'s secret weapon.'
      }
    ]
  };

  try {
    console.log('Calling generate-context-visual-prompts with theme data...');
    
    const { data, error } = await supabase.functions.invoke('generate-context-visual-prompts', {
      body: {
        themeData: themeData,
        userId: '3e7858df-9613-4285-98d2-ffb818c26f6d' // Replace with actual user ID
      }
    });

    if (error) {
      console.error('Error calling function:', error);
      return;
    }

    console.log('Function response:', data);
    
    // Verify the update worked
    const { data: agent, error: agentError } = await supabase
      .from('openai_agents')
      .select('supported_categories, system_prompts')
      .eq('name', 'Blog Visual Prompt Generator')
      .eq('user_id', '3e7858df-9613-4285-98d2-ffb818c26f6d')
      .single();

    if (agentError) {
      console.error('Error fetching updated agent:', agentError);
      return;
    }

    console.log('Updated agent supported categories:', agent.supported_categories);
    console.log('Number of system prompts:', agent.system_prompts?.length || 0);
    
    // Check if product-design was added
    const hasProductDesign = agent.supported_categories?.includes('product-design');
    console.log('Product Design category added:', hasProductDesign);
    
    if (hasProductDesign) {
      const productDesignPrompt = agent.system_prompts?.find(p => p.category === 'product-design');
      console.log('Product Design prompt exists:', !!productDesignPrompt);
    }
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

triggerContextUpdate();