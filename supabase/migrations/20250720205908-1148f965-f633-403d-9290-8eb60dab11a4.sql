
-- Add sitemap analysis columns to vendors table
ALTER TABLE public.vendors 
ADD COLUMN sitemap_tree jsonb,
ADD COLUMN sitemap_fetched_at timestamp with time zone,
ADD COLUMN sitemap_agent_id uuid REFERENCES public.openai_agents(id);

-- Create index for faster sitemap queries
CREATE INDEX idx_vendors_sitemap_fetched ON public.vendors(sitemap_fetched_at);
