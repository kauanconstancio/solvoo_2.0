-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload service images
CREATE POLICY "Authenticated users can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-images');

-- Allow anyone to view service images
CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');

-- Allow users to delete their own service images
CREATE POLICY "Users can delete their own service images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own service images
CREATE POLICY "Users can update their own service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);