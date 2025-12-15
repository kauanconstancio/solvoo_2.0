-- Recriar política de INSERT com ownership validation
DROP POLICY IF EXISTS "Users can upload their own service images" ON storage.objects;

CREATE POLICY "Users can upload their own service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);