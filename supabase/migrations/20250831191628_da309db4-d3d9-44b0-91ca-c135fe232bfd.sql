UPDATE openai_agents 
SET purpose = 'The System Prompt Generator agent takes user queries, structures them into themes with social media posts, and creates comprehensive Visual System Prompts. These system prompts enable downstream agents to convert post titles and descriptions into detailed image generation prompts. Uses hard-coded templates for enhanced reliability and performance, with theme-first organization and integrated color theme support for visual consistency.',
    updated_at = NOW()
WHERE name = 'System Prompt Generator';