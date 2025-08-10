-- Create shared collections for public sharing of 16:9 image posts
-- 1) Helper: generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Tables
CREATE TABLE public.shared_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  handle text NOT NULL,
  title text,
  description text,
  item_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft', -- 'draft' | 'published'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TABLE public.shared_collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.shared_collections(id) ON DELETE CASCADE,
  post_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_16_9_url text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Indexes
CREATE INDEX idx_shared_collections_status ON public.shared_collections(status);
CREATE INDEX idx_shared_collection_items_collection ON public.shared_collection_items(collection_id, position);

-- 4) RLS
ALTER TABLE public.shared_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_collection_items ENABLE ROW LEVEL SECURITY;

-- Owner can insert collections
CREATE POLICY "Users can create their shared collections"
ON public.shared_collections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Owner can update collections
CREATE POLICY "Users can update their shared collections"
ON public.shared_collections
FOR UPDATE
USING (auth.uid() = user_id);

-- Owner can delete collections
CREATE POLICY "Users can delete their shared collections"
ON public.shared_collections
FOR DELETE
USING (auth.uid() = user_id);

-- Public (and owners) can view collections: published are public; owners see theirs
CREATE POLICY "Public can view published shared collections and owners see theirs"
ON public.shared_collections
FOR SELECT
USING (status = 'published' OR auth.uid() = user_id);

-- Items: owners can insert/update/delete items for their collections
CREATE POLICY "Users can insert items for their collections"
ON public.shared_collection_items
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.shared_collections c 
  WHERE c.id = shared_collection_items.collection_id AND c.user_id = auth.uid()
));

CREATE POLICY "Users can update items for their collections"
ON public.shared_collection_items
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.shared_collections c 
  WHERE c.id = shared_collection_items.collection_id AND c.user_id = auth.uid()
));

CREATE POLICY "Users can delete items for their collections"
ON public.shared_collection_items
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.shared_collections c 
  WHERE c.id = shared_collection_items.collection_id AND c.user_id = auth.uid()
));

-- Public (and owners) can view items when collection is published or owned
CREATE POLICY "Public can view items for published collections and owners see theirs"
ON public.shared_collection_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.shared_collections c 
  WHERE c.id = shared_collection_items.collection_id 
    AND (c.status = 'published' OR c.user_id = auth.uid())
));

-- 5) Triggers
DROP TRIGGER IF EXISTS update_shared_collections_updated_at ON public.shared_collections;
CREATE TRIGGER update_shared_collections_updated_at
BEFORE UPDATE ON public.shared_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6) RPC to publish 16:9-only collection (exactly 10 posts)
CREATE OR REPLACE FUNCTION public.publish_shared_collection_16_9(
  p_handle text,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_post_ids uuid[] DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_theme_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_handle text;
  v_collection_id uuid;
  v_count integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- sanitize handle: letters, numbers, dash and underscore only
  v_handle := lower(regexp_replace(coalesce(p_handle, ''), '[^a-zA-Z0-9_-]+', '-', 'g'));
  IF v_handle IS NULL OR length(trim(v_handle)) = 0 THEN
    RAISE EXCEPTION 'Handle is required';
  END IF;

  -- Collect candidate posts limited to 10
  WITH candidates AS (
    SELECT id, title, description, image_16_9_url
    FROM public.social_media_posts
    WHERE user_id = v_user_id
      AND image_16_9_url IS NOT NULL
      AND (p_post_ids IS NULL OR id = ANY(p_post_ids))
      AND (p_category IS NULL OR category = p_category)
      AND (p_theme_id IS NULL OR theme_id = p_theme_id)
    ORDER BY COALESCE(day, 999999) ASC, created_at ASC
    LIMIT 10
  )
  SELECT COUNT(*) INTO v_count FROM candidates;

  IF v_count <> 10 THEN
    RAISE EXCEPTION 'Exactly 10 posts with 16:9 images are required (found: %).', v_count;
  END IF;

  -- Create collection as draft first
  INSERT INTO public.shared_collections (user_id, handle, title, description, item_count, status)
  VALUES (v_user_id, v_handle, NULLIF(p_title, ''), NULLIF(p_description, ''), 0, 'draft')
  RETURNING id INTO v_collection_id;

  -- Insert items preserving order
  INSERT INTO public.shared_collection_items (collection_id, post_id, title, description, image_16_9_url, position)
  SELECT v_collection_id, id, title, description, image_16_9_url, row_number() OVER (ORDER BY COALESCE(day, 999999) ASC, created_at ASC)
  FROM (
    SELECT id, title, description, image_16_9_url, day, created_at
    FROM public.social_media_posts
    WHERE user_id = v_user_id
      AND image_16_9_url IS NOT NULL
      AND (p_post_ids IS NULL OR id = ANY(p_post_ids))
      AND (p_category IS NULL OR category = p_category)
      AND (p_theme_id IS NULL OR theme_id = p_theme_id)
    ORDER BY COALESCE(day, 999999) ASC, created_at ASC
    LIMIT 10
  ) s;

  -- Publish collection
  UPDATE public.shared_collections 
  SET item_count = 10, status = 'published', published_at = now()
  WHERE id = v_collection_id;

  RETURN v_collection_id;
END;
$$;
