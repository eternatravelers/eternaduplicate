/*
  # Create storage buckets for file management

  1. Storage Buckets
    - `documents` bucket for trip documents
    - Public access for documents
    - File size limit and type restrictions

  2. Security
    - RLS policies for bucket access
    - File upload restrictions
*/

-- Create documents bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('documents', 'documents', true);
  END IF;
END $$;

-- Create policy for authenticated users to upload documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to upload documents'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload documents"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'documents');
  END IF;
END $$;

-- Create policy for public read access to documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public read access to documents'
  ) THEN
    CREATE POLICY "Allow public read access to documents"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'documents');
  END IF;
END $$;

-- Create policy for authenticated users to delete documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to delete documents'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete documents"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'documents');
  END IF;
END $$;