-- Add DELETE policy for conversations
CREATE POLICY "Users can delete their conversations" 
ON public.conversations 
FOR DELETE 
USING (auth.uid() = client_id OR auth.uid() = professional_id);