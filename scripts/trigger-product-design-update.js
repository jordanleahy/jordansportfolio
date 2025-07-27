#!/usr/bin/env node

// Script to manually trigger the context-aware visual prompt update for product-design category

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

const userId = '3e7858df-9613-4285-98d2-ffb818c26f6d';

async function triggerUpdate() {
  try {
    console.log('🚀 Triggering context-aware visual prompt update for product-design...');
    
    const response = await fetch('https://wgwmzfbnkovumqcvsxgd.supabase.co/functions/v1/generate-context-visual-prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnd216ZmJua292dW1xY3ZzeGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODg1MjcsImV4cCI6MjA2MTY2NDUyN30.HVv6TGHC5jDiEWChIyo_jp60Ef7Vtwc0x3zPKyDt4bE'
      },
      body: JSON.stringify({
        themeData,
        userId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Function response:', JSON.stringify(result, null, 2));

    // Verify the update worked by checking the agent
    console.log('🔍 Verifying agent update...');
    
    const agentResponse = await fetch('https://wgwmzfbnkovumqcvsxgd.supabase.co/rest/v1/openai_agents?select=supported_categories,system_prompts&name=eq.Blog Visual Prompt Generator&user_id=eq.' + userId, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnd216ZmJua292dW1xY3ZzeGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODg1MjcsImV4cCI6MjA2MTY2NDUyN30.HVv6TGHC5jDiEWChIyo_jp60Ef7Vtwc0x3zPKyDt4bE',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnd216ZmJua292dW1xY3ZzeGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODg1MjcsImV4cCI6MjA2MTY2NDUyN30.HVv6TGHC5jDiEWChIyo_jp60Ef7Vtwc0x3zPKyDt4bE'
      }
    });

    const agents = await agentResponse.json();
    const agent = agents[0];
    
    if (agent) {
      console.log('📊 Updated supported categories:', agent.supported_categories);
      
      const hasProductDesign = agent.supported_categories?.includes('product-design');
      console.log('🎯 Product Design category added:', hasProductDesign);
      
      if (hasProductDesign) {
        const productDesignPrompt = agent.system_prompts?.find(p => p.category === 'product-design');
        console.log('📝 Product Design prompt exists:', !!productDesignPrompt);
        
        if (productDesignPrompt) {
          console.log('📖 Prompt preview:', productDesignPrompt.prompt.substring(0, 200) + '...');
        }
      }
    } else {
      console.log('❌ Agent not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// If running in browser
if (typeof window !== 'undefined') {
  window.triggerUpdate = triggerUpdate;
  triggerUpdate();
} else {
  // Running in Node.js
  triggerUpdate();
}

console.log('Script loaded. Call triggerUpdate() to execute.');