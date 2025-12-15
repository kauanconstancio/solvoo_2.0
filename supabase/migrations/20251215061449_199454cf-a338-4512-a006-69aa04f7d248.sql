-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-files');

-- Policy to allow anyone to view chat files
CREATE POLICY "Anyone can view chat files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-files');

-- Policy to allow users to delete their own files
CREATE POLICY "Users can delete their own chat files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add message_type column to messages table for file messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';

-- Add file_url column for file messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS file_url text;

-- Add file_name column for file messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS file_name text;