import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BankAccount {
  id: string;
  user_id: string;
  account_type: 'pix' | 'conta_corrente' | 'conta_poupanca';
  pix_key_type: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria' | null;
  pix_key: string | null;
  bank_name: string | null;
  bank_code: string | null;
  agency: string | null;
  account_number: string | null;
  account_holder_name: string;
  account_holder_document: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountData {
  account_type: 'pix' | 'conta_corrente' | 'conta_poupanca';
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  pix_key?: string;
  bank_name?: string;
  bank_code?: string;
  agency?: string;
  account_number?: string;
  account_holder_name: string;
  account_holder_document: string;
  is_default?: boolean;
}

export function useBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAccounts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAccounts((data || []) as BankAccount[]);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (data: CreateBankAccountData): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: user.id,
          ...data,
        });

      if (error) throw error;

      toast({
        title: 'Conta cadastrada',
        description: 'Sua conta bancária foi cadastrada com sucesso.',
      });

      await fetchAccounts();
      return true;
    } catch (error: any) {
      console.error('Error creating bank account:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível cadastrar a conta.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateAccount = async (id: string, data: Partial<CreateBankAccountData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Conta atualizada',
        description: 'Sua conta bancária foi atualizada com sucesso.',
      });

      await fetchAccounts();
      return true;
    } catch (error: any) {
      console.error('Error updating bank account:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a conta.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteAccount = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Conta removida',
        description: 'Sua conta bancária foi removida com sucesso.',
      });

      await fetchAccounts();
      return true;
    } catch (error: any) {
      console.error('Error deleting bank account:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover a conta.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const setDefaultAccount = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Conta padrão definida',
        description: 'Esta conta será usada para saques.',
      });

      await fetchAccounts();
      return true;
    } catch (error: any) {
      console.error('Error setting default account:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível definir a conta padrão.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getDefaultAccount = (): BankAccount | null => {
    return accounts.find(a => a.is_default) || accounts[0] || null;
  };

  return {
    accounts,
    isLoading,
    createAccount,
    updateAccount,
    deleteAccount,
    setDefaultAccount,
    getDefaultAccount,
    refetch: fetchAccounts,
  };
}
