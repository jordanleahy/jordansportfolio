-- Create function to insert Engineering Work Report Agent for the current user
CREATE OR REPLACE FUNCTION public.insert_engineering_work_report_agent()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  agent_exists boolean;
  insert_result uuid;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN 'ERROR: No authenticated user found';
  END IF;

  -- Prevent duplicates per user
  SELECT EXISTS(
    SELECT 1 FROM public.openai_agents 
    WHERE user_id = current_user_id AND name = 'Engineering Work Report Agent'
  ) INTO agent_exists;

  IF agent_exists THEN
    RETURN 'Agent already exists for this user';
  END IF;

  -- Insert agent
  INSERT INTO public.openai_agents (
    user_id, name, purpose, model_version, trigger, input_source, output_target, schedule,
    owner, status, tags, notes, supported_categories, temperature, max_tokens
  ) VALUES (
    current_user_id,
    'Engineering Work Report Agent',
    'Generates comprehensive daily engineering work reports focused on coding, development, user stories, bugs, deployments, and technical decisions. Summarizes activity, quantifies impact, confirms intent, and proposes next actions.',
    'gpt-5-mini',
    'api_call',
    'App telemetry, engineering activity (stories, features, bugs, deployments), API usage, logs (JSON)',
    'Structured engineering daily report (JSON sections + Markdown summary)',
    'on-demand',
    'Engineering Analytics',
    'active',
    ARRAY['engineering', 'work-report', 'daily-summary', 'bugs', 'planning', 'deployment', 'qa'],
    'Agent specialized in transforming engineering signals (stories, bug reports, feature work, API usage, logs) into a clear, actionable daily report. Includes confirmation of intent, decisions, blockers, and prioritized next steps.',
    ARRAY['engineering', 'bugs', 'planning', 'qa', 'deployment'],
    0.3,
    3000
  ) RETURNING id INTO insert_result;

  -- Seed system prompts for key categories
  INSERT INTO public.system_prompts (
    agent_id, user_id, category, prompt_text, agent_name, agent_purpose, agent_owner, name, description
  ) VALUES 
  (
    insert_result,
    current_user_id,
    'engineering',
    'You are an expert Engineering Work Report generator for a product team. Your job is to turn raw activity (features shipped, code changes, user stories, tickets, API calls, logs) into a clear, actionable daily report.\n\nCore Goals:\n- Report what was built, changed, or shipped today\n- Confirm original intent and whether the outcome matched it\n- Call out bugs found/fixed with context and severity\n- Capture technical decisions and tradeoffs\n- Quantify impact (metrics, user value) when possible\n- Propose prioritized next actions for tomorrow\n\nOutput Structure (JSON + Markdown):\n- summary_markdown: Executive summary (3-6 bullets)\n- user_stories: [ { id, title, intent, outcome, status, notes } ]\n- features: [ { name, scope, changes, metrics, status } ]\n- technical_changes: [ { area, description, rationale, risk } ]\n- bugs: [ { id, title, severity, status, reproduction, fix_summary } ]\n- decisions: [ { topic, options_considered, decision, rationale } ]\n- deployments: [ { env, version, changes, rollback_plan } ]\n- metrics: { prs: number, bugs_fixed: number, incidents: number, api_calls: number }\n- blockers: [ { description, owner, dependency } ]\n- next_actions: [ { title, priority: ''high''|''medium''|''low'', owner, due } ]\n\nStyle: precise, engineering-focused, no fluff. Include only what is present in the provided data; do not invent details.',
    'Engineering Work Report Agent',
    'Generates comprehensive daily engineering work reports focused on coding, development, user stories, bugs, deployments, and technical decisions. Summarizes activity, quantifies impact, confirms intent, and proposes next actions.',
    'Engineering Analytics',
    'Engineering Daily Report System Prompt',
    'Primary prompt for generating engineering-focused daily reports'
  ),
  (
    insert_result,
    current_user_id,
    'bugs',
    'You specialize in bug triage summaries. Given bug reports and logs, produce a concise list of bugs with severity, reproduction steps, root-cause hypothesis, fix status, and test coverage notes. Prioritize by user impact and risk.',
    'Engineering Work Report Agent',
    'Generates comprehensive daily engineering work reports focused on coding, development, user stories, bugs, deployments, and technical decisions. Summarizes activity, quantifies impact, confirms intent, and proposes next actions.',
    'Engineering Analytics',
    'Bug Summary System Prompt',
    'Focused prompt for bug identification and resolution context'
  ),
  (
    insert_result,
    current_user_id,
    'planning',
    'You generate next-step plans from today''s activity. Align next actions to user value and delivery risk. Include dependencies, owners, and clear acceptance criteria for each proposed task.',
    'Engineering Work Report Agent',
    'Generates comprehensive daily engineering work reports focused on coding, development, user stories, bugs, deployments, and technical decisions. Summarizes activity, quantifies impact, confirms intent, and proposes next actions.',
    'Engineering Analytics',
    'Planning System Prompt',
    'Focused prompt for turning activity into actionable plans'
  ),
  (
    insert_result,
    current_user_id,
    'qa',
    'You verify that fixes and features include adequate test coverage. Produce a QA checklist including unit/integration/e2e needs, edge cases, and monitoring alerts for post-deploy verification.',
    'Engineering Work Report Agent',
    'Generates comprehensive daily engineering work reports focused on coding, development, user stories, bugs, deployments, and technical decisions. Summarizes activity, quantifies impact, confirms intent, and proposes next actions.',
    'Engineering Analytics',
    'QA System Prompt',
    'Focused prompt for quality assurance and test coverage'
  ),
  (
    insert_result,
    current_user_id,
    'deployment',
    'You summarize deployments and release notes. Clearly list version, environments, changes included, linked tickets, risks, rollback plan, and any manual steps.',
    'Engineering Work Report Agent',
    'Generates comprehensive daily engineering work reports focused on coding, development, user stories, bugs, deployments, and technical decisions. Summarizes activity, quantifies impact, confirms intent, and proposes next actions.',
    'Engineering Analytics',
    'Deployment Summary System Prompt',
    'Focused prompt for deployments and release documentation'
  );

  RETURN 'SUCCESS: Engineering Work Report Agent created with ID: ' || insert_result::text;
EXCEPTION WHEN OTHERS THEN
  RETURN 'ERROR: ' || SQLERRM;
END;
$function$;