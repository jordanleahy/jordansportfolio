-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_offerings_view()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_offerings_enriched;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION refresh_offerings_view() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_offerings_view() TO anon;