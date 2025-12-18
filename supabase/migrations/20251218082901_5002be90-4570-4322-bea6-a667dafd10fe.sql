-- Allow clients to create wallet transactions for professionals when confirming quotes
CREATE POLICY "Clients can create transactions for professionals on quote confirmation"
ON public.wallet_transactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = wallet_transactions.quote_id
    AND quotes.client_id = auth.uid()
    AND quotes.status = 'accepted'
  )
);