-- Create function to insert Cover Letter Generator agent
CREATE OR REPLACE FUNCTION public.insert_cover_letter_agent()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only insert if user is authenticated
  IF auth.uid() IS NOT NULL THEN
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
      auth.uid(),
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
    )
    ON CONFLICT (user_id, name) DO UPDATE SET
      purpose = EXCLUDED.purpose,
      system_prompts = EXCLUDED.system_prompts,
      supported_categories = EXCLUDED.supported_categories,
      notes = EXCLUDED.notes,
      updated_at = now();
  END IF;
END;
$function$;