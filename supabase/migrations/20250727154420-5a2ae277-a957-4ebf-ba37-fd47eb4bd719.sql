-- Drop and recreate the function with detailed logging
DROP FUNCTION IF EXISTS public.insert_cover_letter_agent();

CREATE OR REPLACE FUNCTION public.insert_cover_letter_agent()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_user_id uuid;
  agent_exists boolean;
  insert_result uuid;
BEGIN
  -- Log the start of function execution
  RAISE NOTICE 'Starting insert_cover_letter_agent function';
  
  -- Get current user ID and log it
  current_user_id := auth.uid();
  RAISE NOTICE 'Current auth.uid(): %', current_user_id;
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No authenticated user found';
    RETURN 'ERROR: No authenticated user found';
  END IF;
  
  -- Check if agent already exists for this user
  SELECT EXISTS(
    SELECT 1 FROM public.openai_agents 
    WHERE user_id = current_user_id AND name = 'Cover Letter Generator'
  ) INTO agent_exists;
  
  RAISE NOTICE 'Agent already exists: %', agent_exists;
  
  IF agent_exists THEN
    RETURN 'Agent already exists for this user';
  END IF;
  
  -- Attempt to insert the agent
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
      supported_categories
    ) VALUES (
      current_user_id,
      'Cover Letter Generator',
      'Generates personalized cover letters for Product Manager and Product Designer roles by analyzing job descriptions and incorporating user''s resume and case studies',
      'gpt-4o-mini',
      'api_call',
      'Job description, company info, user resume, case studies (JSON)',
      'Structured cover letter (JSON)',
      'on-demand',
      'Career Development Team',
      'active',
      ARRAY['cover-letter', 'job-application', 'product-manager', 'product-designer', 'career'],
      'Specialized agent for generating personalized cover letters. Analyzes job descriptions and tailors content based on role type (Product Manager or Product Designer). Incorporates user''s resume, case studies, and background to create compelling career transition narratives.',
      '[
        {
          "category": "product_manager",
          "prompt": "You are an expert career coach specializing in Product Manager roles. Your task is to create a compelling, personalized cover letter that positions the candidate as an ideal fit for the Product Manager position.\\n\\nKey Focus Areas for Product Manager Cover Letters:\\n- Emphasize the transition story from technical/healthcare background to product management\\n- Highlight leadership experience and cross-functional collaboration skills\\n- Demonstrate product strategy thinking and user-centered approach\\n- Show ability to work effectively with engineering, design, and business teams\\n- Reference specific PM frameworks (Agile, Scrum, OKRs, etc.)\\n- Connect domain expertise (healthcare, technology) to product insights\\n- Showcase data-driven decision making and analytical skills\\n- Highlight experience with product roadmaps, feature prioritization, and stakeholder management\\n\\nStructure Requirements:\\n- Opening hook that immediately connects their unique background to the PM role\\n- Key achievements section highlighting relevant PM-adjacent experience\\n- Strategic fit explanation showing understanding of the company''s product challenges\\n- Call to action that reinforces their value proposition\\n\\nTone: Professional, confident, results-oriented. Show passion for product management and understanding of the role''s impact on business outcomes."
        },
        {
          "category": "product_designer",
          "prompt": "You are an expert career coach specializing in Product Designer roles. Your task is to create a compelling, personalized cover letter that showcases the candidate''s design expertise and user-centered approach.\\n\\nKey Focus Areas for Product Designer Cover Letters:\\n- Showcase design process methodology and user research experience\\n- Highlight visual design skills and design system creation\\n- Demonstrate usability testing and user feedback incorporation\\n- Show collaboration with product managers and engineering teams\\n- Reference modern design tools (Figma, Sketch, Adobe Creative Suite)\\n- Connect technical/healthcare background to design thinking advantages\\n- Emphasize accessibility and inclusive design principles\\n- Highlight experience with responsive design and mobile-first approaches\\n- Show understanding of design''s impact on business metrics\\n\\nStructure Requirements:\\n- Opening hook that connects their unique perspective to design challenges\\n- Key achievements showcasing design impact and user satisfaction\\n- Strategic fit showing understanding of the company''s design philosophy\\n- Call to action that invites portfolio review and design discussion\\n\\nTone: Creative yet professional, user-focused, detail-oriented. Show passion for solving user problems through thoughtful design and demonstrate understanding of design''s strategic value."
        }
      ]'::jsonb,
      ARRAY['product_manager', 'product_designer']
    ) RETURNING id INTO insert_result;
    
    RAISE NOTICE 'Successfully inserted agent with ID: %', insert_result;
    RETURN 'SUCCESS: Cover Letter Generator agent created with ID: ' || insert_result::text;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting agent: % %', SQLERRM, SQLSTATE;
    RETURN 'ERROR: ' || SQLERRM;
  END;
  
END;
$function$;