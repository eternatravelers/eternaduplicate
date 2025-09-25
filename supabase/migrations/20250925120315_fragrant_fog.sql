/*
  # Create transaction proofs storage bucket

  1. Storage Bucket
    - Create `transaction-proofs` bucket for storing transaction proof files
    
  2. Security
    - Enable RLS on storage bucket
    - Add policies for authenticated users to upload and view files
    - Add policy for public read access to files
*/

-- Create storage bucket for transaction proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transaction-proofs',
  'transaction-proofs',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage bucket
CREATE POLICY "Allow authenticated users to upload transaction proofs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'transaction-proofs');

CREATE POLICY "Allow authenticated users to view transaction proofs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'transaction-proofs');

CREATE POLICY "Allow public read access to transaction proofs"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'transaction-proofs');

CREATE POLICY "Allow authenticated users to delete transaction proofs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'transaction-proofs');