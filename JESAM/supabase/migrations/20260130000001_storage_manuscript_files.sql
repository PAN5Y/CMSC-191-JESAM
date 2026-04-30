-- JESAM: storage configuration for submission manuscript uploads
-- Creates public bucket and policies for manuscript file upload paths.

INSERT INTO storage.buckets (id, name, public)
VALUES ('manuscript-files', 'manuscript-files', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Read access for manuscript files.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Manuscript files are publicly readable'
  ) THEN
    CREATE POLICY "Manuscript files are publicly readable"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'manuscript-files');
  END IF;
END $$;

-- Authenticated users can upload under manuscripts/<uuid>/<filename>.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload manuscript files'
  ) THEN
    CREATE POLICY "Authenticated users can upload manuscript files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'manuscript-files'
      AND (storage.foldername(name))[1] = 'manuscripts'
    );
  END IF;
END $$;

-- Authenticated users can update files under manuscripts/ prefix.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can update manuscript files'
  ) THEN
    CREATE POLICY "Authenticated users can update manuscript files"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'manuscript-files'
      AND (storage.foldername(name))[1] = 'manuscripts'
    )
    WITH CHECK (
      bucket_id = 'manuscript-files'
      AND (storage.foldername(name))[1] = 'manuscripts'
    );
  END IF;
END $$;
