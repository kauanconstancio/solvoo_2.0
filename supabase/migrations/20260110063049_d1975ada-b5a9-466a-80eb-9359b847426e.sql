-- Add columns for AbacatePay withdrawal tracking
ALTER TABLE wallet_transactions 
ADD COLUMN IF NOT EXISTS abacatepay_withdrawal_id TEXT,
ADD COLUMN IF NOT EXISTS abacatepay_status TEXT,
ADD COLUMN IF NOT EXISTS abacatepay_receipt_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_abacatepay_id 
ON wallet_transactions(abacatepay_withdrawal_id) 
WHERE abacatepay_withdrawal_id IS NOT NULL;