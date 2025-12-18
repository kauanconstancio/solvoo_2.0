-- 1. Add client confirmation columns to quotes table (escrow system)
ALTER TABLE public.quotes 
ADD COLUMN client_confirmed boolean DEFAULT false,
ADD COLUMN client_confirmed_at timestamp with time zone;

-- 2. Create bank_accounts table for withdrawal details
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text NOT NULL DEFAULT 'pix', -- 'pix', 'conta_corrente', 'conta_poupanca'
  pix_key_type text, -- 'cpf', 'cnpj', 'email', 'telefone', 'aleatoria'
  pix_key text,
  bank_name text,
  bank_code text,
  agency text,
  account_number text,
  account_holder_name text NOT NULL,
  account_holder_document text NOT NULL, -- CPF or CNPJ
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, pix_key),
  UNIQUE(user_id, bank_code, agency, account_number)
);

-- Enable RLS on bank_accounts
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_accounts
CREATE POLICY "Users can view their own bank accounts"
ON public.bank_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank accounts"
ON public.bank_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank accounts"
ON public.bank_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank accounts"
ON public.bank_accounts FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add admin approval fields to wallet_transactions
ALTER TABLE public.wallet_transactions
ADD COLUMN bank_account_id uuid REFERENCES public.bank_accounts(id),
ADD COLUMN processed_by uuid,
ADD COLUMN processed_at timestamp with time zone,
ADD COLUMN rejection_reason text;

-- 4. Add RLS policy for admins to view and update wallet_transactions
CREATE POLICY "Admins can view all transactions"
ON public.wallet_transactions FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update transactions"
ON public.wallet_transactions FOR UPDATE
USING (is_admin(auth.uid()));

-- 5. Function to ensure only one default bank account per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_bank_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.bank_accounts
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER ensure_single_default_bank_account_trigger
BEFORE INSERT OR UPDATE ON public.bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_bank_account();