-- Create function to insert SIRS Diagnostic agent
CREATE OR REPLACE FUNCTION public.insert_sirs_agent()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only insert if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.openai_agents (
      user_id, name, purpose, model_version, trigger, input_source, 
      output_target, schedule, owner, status, metrics, tags, notes
    ) VALUES
    (
      auth.uid(), 
      'SIRS Diagnostic Agent', 
      'Rules-based clinical agent that determines if a patient meets the criteria for Systemic Inflammatory Response Syndrome (SIRS) using structured vital signs and lab data within the first 48 hours of admission.',
      'gpt-4o',
      'api_call',
      'Structured vital signs and lab data (JSON)',
      'SIRS evaluation report (JSON)',
      'on-demand',
      'Clinical Decision Support Team',
      'active',
      '{"latencyMs": 800, "errorRate": 0.00}',
      ARRAY['clinical', 'diagnostic', 'sirs', 'sepsis', 'medical'],
      'Deterministic clinical decision support agent for SIRS diagnosis. Uses temperature 0.0 for consistent medical evaluations. Evaluates 4 clinical criteria: temperature, heart rate, respiratory rate, and WBC count within 48-hour admission window.'
    );
  END IF;
END;
$function$