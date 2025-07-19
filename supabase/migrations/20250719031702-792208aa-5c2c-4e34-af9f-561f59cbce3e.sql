
-- Create investment_research table for storing AI-generated due diligence briefs
CREATE TABLE IF NOT EXISTS investment_research (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    accessionnumber TEXT NOT NULL REFERENCES mv_offerings_enriched(accessionnumber),
    research_data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(accessionnumber)
);

-- Add RLS policies for investment_research
ALTER TABLE investment_research ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read investment research
CREATE POLICY "Users can view investment research" ON investment_research
    FOR SELECT TO authenticated
    USING (true);

-- Policy to allow authenticated users to insert investment research
CREATE POLICY "Users can create investment research" ON investment_research
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Policy to allow users to update their own investment research
CREATE POLICY "Users can update their own investment research" ON investment_research
    FOR UPDATE TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_investment_research_accessionnumber ON investment_research(accessionnumber);
CREATE INDEX IF NOT EXISTS idx_investment_research_generated_at ON investment_research(generated_at DESC);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_investment_research_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER investment_research_updated_at
    BEFORE UPDATE ON investment_research
    FOR EACH ROW
    EXECUTE FUNCTION update_investment_research_updated_at();
