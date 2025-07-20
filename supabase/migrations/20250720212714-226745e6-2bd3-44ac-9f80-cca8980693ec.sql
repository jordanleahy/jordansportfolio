-- Create a stored function for fuzzy search
CREATE OR REPLACE FUNCTION fuzzy_search_offerings(
  search_term text,
  similarity_threshold real DEFAULT 0.3
)
RETURNS TABLE (
  accessionnumber text,
  company_name text,
  similarity_score real
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.accessionnumber,
    mv.company_name,
    GREATEST(
      similarity(mv.company_name, search_term),
      similarity(mv.industrygrouptype, search_term),
      similarity(mv.company_city, search_term)
    ) as similarity_score
  FROM mv_offerings_enriched mv
  WHERE GREATEST(
    similarity(mv.company_name, search_term),
    similarity(mv.industrygrouptype, search_term), 
    similarity(mv.company_city, search_term)
  ) > similarity_threshold
  ORDER BY similarity_score DESC;
END;
$$;