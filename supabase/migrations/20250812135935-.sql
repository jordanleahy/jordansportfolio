-- Drop the old version of the function that includes p_category parameter
DROP FUNCTION IF EXISTS public.publish_shared_collection_1_1(text, text, text, uuid[], text, uuid);

-- The new version without p_category should remain