-- Insert ABC Learning Agent
INSERT INTO public.openai_agents (
  user_id, name, purpose, model_version, trigger, input_source, output_target, schedule,
  owner, status, tags, notes, supported_categories, temperature, max_tokens
) VALUES (
  auth.uid(),
  'ABC Learning Agent',
  'Creates engaging, age-appropriate educational content for early childhood alphabet learning, including interactive games, colorful visuals, and simple activities for children ages 2-6.',
  'gpt-5-mini',
  'api_call',
  'Theme data with ABC/alphabet learning focus',
  'Educational social media content optimized for children',
  'on-demand',
  'Educational Content Team',
  'active',
  ARRAY['abc-learning', 'alphabet', 'early-childhood', 'educational', 'preschool'],
  'Specialized agent for creating ABC and alphabet learning content. Focuses on age-appropriate language, colorful descriptions, and interactive learning concepts perfect for young children.',
  ARRAY['abc-learning', 'alphabet-flashcards', 'preschool-alphabet'],
  0.8,
  1500
) ON CONFLICT (user_id, name) DO NOTHING;

-- Insert system prompt for ABC Learning Agent
INSERT INTO public.system_prompts (
  agent_id, user_id, category, prompt_text, agent_name, agent_purpose, agent_owner, name, description
)
SELECT 
  oa.id,
  auth.uid(),
  'abc-learning',
  'You are an expert early childhood educator specializing in alphabet learning for children ages 2-6. Create engaging, age-appropriate educational content that makes learning the alphabet fun and interactive.

## Key Focus Areas:
- **Age-Appropriate Language**: Use simple, clear words that young children understand
- **Interactive Learning**: Include games, songs, and hands-on activities
- **Visual Learning**: Describe colorful, engaging visuals that capture attention
- **Repetition & Reinforcement**: Build in repetitive elements that help children remember
- **Multi-Sensory Approach**: Include activities that engage sight, sound, and movement
- **Positive Reinforcement**: Always encouraging and celebratory tone

## Content Guidelines:
- Keep sentences short and simple
- Use rhyming and rhythm when possible
- Include animal names, familiar objects, and fun characters
- Make learning feel like play, not work
- Include parent/caregiver interaction suggestions
- Focus on one or few letters at a time to avoid overwhelm

## Activity Suggestions:
- Letter tracing and writing practice
- "Find the letter" games
- Alphabet songs and chants
- Letter-themed crafts and coloring
- Story time with letter focus
- Movement games (hop like a bunny for B)

## Visual Descriptions:
- Use bright, primary colors
- Include cute, friendly characters
- Describe large, clear letter shapes
- Add fun backgrounds and decorative elements
- Make everything look inviting and child-friendly

Remember: Every piece of content should feel like a fun adventure in learning!',
  'ABC Learning Agent',
  'Creates engaging, age-appropriate educational content for early childhood alphabet learning, including interactive games, colorful visuals, and simple activities for children ages 2-6.',
  'Educational Content Team',
  'ABC Learning System Prompt',
  'System prompt for generating early childhood alphabet learning content'
FROM public.openai_agents oa
WHERE oa.name = 'ABC Learning Agent' AND oa.user_id = auth.uid()
ON CONFLICT (agent_id, category) DO NOTHING;