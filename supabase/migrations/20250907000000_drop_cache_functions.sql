-- Drop cache-related functions if they exist
DROP FUNCTION IF EXISTS public.cleanup_expired_cache();
DROP FUNCTION IF EXISTS public.get_cache_stats(uuid);
DROP FUNCTION IF EXISTS public.get_cache_stats();
DROP FUNCTION IF EXISTS public.update_cache_hit(text);
