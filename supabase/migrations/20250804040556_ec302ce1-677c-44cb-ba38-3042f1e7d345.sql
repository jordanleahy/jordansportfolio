-- Check if social-media-images bucket exists, create if not
INSERT INTO storage.buckets (id, name, public)
VALUES ('social-media-images', 'social-media-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set permissive policies for the social-media-images bucket
DO $$
BEGIN
    -- Policy for SELECT (viewing images)
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'social-media-images' 
        AND operation = 'SELECT'
    ) THEN
        CREATE POLICY "Allow public read access" ON storage.objects
        FOR SELECT USING (bucket_id = 'social-media-images');
    END IF;

    -- Policy for INSERT (uploading images)
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'social-media-images' 
        AND operation = 'INSERT'
    ) THEN
        CREATE POLICY "Allow authenticated users to upload" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'social-media-images' 
            AND auth.uid() IS NOT NULL
        );
    END IF;

    -- Policy for UPDATE (updating images)
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'social-media-images' 
        AND operation = 'UPDATE'
    ) THEN
        CREATE POLICY "Allow users to update their own images" ON storage.objects
        FOR UPDATE USING (
            bucket_id = 'social-media-images' 
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Policy for DELETE (deleting images)
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'social-media-images' 
        AND operation = 'DELETE'
    ) THEN
        CREATE POLICY "Allow users to delete their own images" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'social-media-images' 
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;