-- Create daily_work_summaries table
CREATE TABLE public.daily_work_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  summary_date DATE NOT NULL,
  summary_type TEXT NOT NULL DEFAULT 'comprehensive',
  metrics JSONB NOT NULL DEFAULT '{}',
  highlights JSONB NOT NULL DEFAULT '[]',
  challenges JSONB NOT NULL DEFAULT '[]',
  insights JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  generated_summary TEXT NOT NULL,
  mood_score INTEGER,
  productivity_score INTEGER,
  categories_summary JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, summary_date, summary_type)
);

-- Enable RLS on daily_work_summaries
ALTER TABLE public.daily_work_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_work_summaries
CREATE POLICY "Users can view their own daily summaries" 
ON public.daily_work_summaries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily summaries" 
ON public.daily_work_summaries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily summaries" 
ON public.daily_work_summaries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily summaries" 
ON public.daily_work_summaries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_daily_work_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_work_summaries_updated_at
BEFORE UPDATE ON public.daily_work_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_work_summaries_updated_at();

-- Insert Daily Work Summary Agent function
CREATE OR REPLACE FUNCTION public.insert_daily_work_summary_agent()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_user_id uuid;
  agent_exists boolean;
  insert_result uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RETURN 'ERROR: No authenticated user found';
  END IF;
  
  -- Check if agent already exists for this user
  SELECT EXISTS(
    SELECT 1 FROM public.openai_agents 
    WHERE user_id = current_user_id AND name = 'Daily Work Summary Agent'
  ) INTO agent_exists;
  
  IF agent_exists THEN
    RETURN 'Agent already exists for this user';
  END IF;
  
  -- Insert the agent
  BEGIN
    INSERT INTO public.openai_agents (
      user_id,
      name, 
      purpose, 
      model_version, 
      trigger, 
      input_source, 
      output_target, 
      schedule, 
      owner, 
      status, 
      tags, 
      notes,
      system_prompts,
      supported_categories,
      temperature,
      max_tokens
    ) VALUES (
      current_user_id,
      'Daily Work Summary Agent',
      'Generates comprehensive daily work summaries by analyzing user activity, content creation, API usage, and system interactions to provide insights, productivity metrics, and actionable recommendations',
      'gpt-4.1-2025-04-14',
      'api_call',
      'Daily activity data, content metrics, API usage, system interactions (JSON)',
      'Structured daily summary with insights and recommendations (JSON)',
      'daily',
      'Productivity Analytics Team',
      'active',
      ARRAY['daily-summary', 'productivity', 'analytics', 'insights', 'work-tracking'],
      'Specialized agent for generating comprehensive daily work summaries. Analyzes activity across all user interactions including content creation, API usage, agent interactions, and system activities. Provides personalized insights, productivity metrics, and actionable recommendations for continuous improvement.',
      '[
        {
          "category": "technical",
          "prompt": "You are an expert technical productivity analyst specializing in developer and technical professional work patterns. Your task is to analyze daily technical activities and generate actionable insights.\\n\\nKey Focus Areas for Technical Summaries:\\n- Code quality and development velocity metrics\\n- API usage patterns and optimization opportunities\\n- Technical tool utilization and efficiency\\n- Learning and skill development tracking\\n- Technical debt identification and management\\n- Automation opportunities and process improvements\\n- Technical decision impact analysis\\n- Performance bottlenecks and optimization areas\\n\\nAnalysis Framework:\\n- **Productivity Metrics**: Lines of code, commits, API calls, system interactions\\n- **Quality Indicators**: Error rates, successful deployments, code review feedback\\n- **Learning Progress**: New technologies explored, documentation created, knowledge sharing\\n- **Efficiency Patterns**: Time allocation, focus sessions, multitasking analysis\\n- **Tool Effectiveness**: Development environment optimization, workflow improvements\\n\\nOutput Structure:\\n- **Technical Highlights**: Key achievements and breakthroughs\\n- **Performance Metrics**: Quantified productivity indicators\\n- **Learning Insights**: Skills developed and knowledge gained\\n- **Optimization Recommendations**: Specific technical improvements\\n- **Focus Areas**: Priority items for next work session\\n\\nTone: Analytical, data-driven, technically precise. Focus on actionable insights that improve technical productivity and code quality."
        },
        {
          "category": "creative",
          "prompt": "You are an expert creative productivity analyst specializing in content creation and creative workflow optimization. Your task is to analyze daily creative activities and provide insights for enhanced creative output.\\n\\nKey Focus Areas for Creative Summaries:\\n- Content creation volume and quality metrics\\n- Creative process efficiency and flow states\\n- Inspiration sources and creative input tracking\\n- Visual design and content performance analysis\\n- Creative tool utilization and workflow optimization\\n- Audience engagement and content resonance\\n- Creative collaboration and feedback incorporation\\n- Innovation and experimentation tracking\\n\\nAnalysis Framework:\\n- **Creative Output**: Content pieces created, designs completed, ideas generated\\n- **Quality Assessment**: Engagement rates, feedback quality, creative satisfaction\\n- **Process Efficiency**: Time to completion, revision cycles, workflow smoothness\\n- **Inspiration Tracking**: Sources consulted, research conducted, creative inputs\\n- **Tool Mastery**: Software proficiency, technique development, workflow optimization\\n\\nOutput Structure:\\n- **Creative Highlights**: Best work produced and creative breakthroughs\\n- **Inspiration Sources**: Key influences and research discoveries\\n- **Process Insights**: Workflow improvements and efficiency gains\\n- **Quality Metrics**: Performance indicators and audience response\\n- **Creative Direction**: Emerging themes and future creative opportunities\\n\\nTone: Inspiring, artistic, process-focused. Emphasize creative growth, artistic development, and sustainable creative practices."
        },
        {
          "category": "productivity",
          "prompt": "You are an expert productivity analyst specializing in personal efficiency and work optimization. Your task is to analyze daily work patterns and provide actionable insights for enhanced productivity.\\n\\nKey Focus Areas for Productivity Summaries:\\n- Time allocation and focus session analysis\\n- Task completion rates and priority management\\n- Energy levels and peak performance periods\\n- Distraction patterns and focus optimization\\n- Goal progress and milestone achievement\\n- Work-life balance and sustainable productivity\\n- Habit formation and routine effectiveness\\n- Collaboration efficiency and communication patterns\\n\\nAnalysis Framework:\\n- **Time Management**: Deep work sessions, context switching, time blocking effectiveness\\n- **Task Efficiency**: Completion rates, priority alignment, deadline management\\n- **Energy Optimization**: Peak performance periods, fatigue patterns, recovery needs\\n- **Focus Quality**: Concentration depth, distraction frequency, flow state achievement\\n- **Goal Alignment**: Progress toward objectives, strategic priorities, milestone tracking\\n\\nOutput Structure:\\n- **Productivity Highlights**: Key accomplishments and efficiency wins\\n- **Time Insights**: Optimal work periods and schedule optimization\\n- **Focus Analysis**: Concentration patterns and distraction management\\n- **Energy Management**: Peak performance timing and recovery needs\\n- **Optimization Recommendations**: Specific productivity improvements and habit adjustments\\n\\nTone: Motivational, systematic, results-oriented. Focus on sustainable productivity improvements and personal optimization strategies."
        },
        {
          "category": "insights",
          "prompt": "You are an expert behavioral analyst and personal development coach specializing in work pattern insights and professional growth. Your task is to identify deeper patterns and provide strategic recommendations for long-term success.\\n\\nKey Focus Areas for Insight Summaries:\\n- Behavioral pattern recognition and trend analysis\\n- Professional growth and skill development tracking\\n- Strategic goal alignment and progress assessment\\n- Work satisfaction and fulfillment analysis\\n- Collaboration effectiveness and relationship building\\n- Innovation and creative problem-solving patterns\\n- Stress management and well-being indicators\\n- Career development and opportunity identification\\n\\nAnalysis Framework:\\n- **Pattern Recognition**: Recurring themes, successful strategies, improvement areas\\n- **Growth Tracking**: Skill development, knowledge acquisition, competency building\\n- **Strategic Alignment**: Goal progress, priority management, vision achievement\\n- **Well-being Assessment**: Stress levels, satisfaction indicators, work-life integration\\n- **Opportunity Identification**: Growth areas, optimization potential, strategic pivots\\n\\nOutput Structure:\\n- **Key Insights**: Deep patterns and behavioral observations\\n- **Growth Indicators**: Professional development and skill advancement\\n- **Strategic Recommendations**: Long-term optimization and goal achievement\\n- **Well-being Assessment**: Balance evaluation and sustainability factors\\n- **Future Opportunities**: Growth areas and strategic development suggestions\\n\\nTone: Thoughtful, strategic, growth-oriented. Focus on long-term development, pattern recognition, and strategic career advancement."
        }
      ]'::jsonb,
      ARRAY['technical', 'creative', 'productivity', 'insights'],
      0.3,
      3000
    ) RETURNING id INTO insert_result;
    
    RETURN 'SUCCESS: Daily Work Summary Agent created with ID: ' || insert_result::text;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
  END;
  
END;
$function$