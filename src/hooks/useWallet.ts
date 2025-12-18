import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WalletTransaction {
  id: string;
  user_id: string;
  quote_id: string | null;
  type: 'credit' | 'debit' | 'withdrawal';
  amount: number;
  fee: number;
  net_amount: number;
  description: string;
  customer_name: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

interface WalletStats {
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  lastWithdrawalDate: string | null;
  grossRevenue: number;
  totalFees: number;
}

interface ChartDataPoint {
  date: string;
  amount: number;
}

const PLATFORM_FEE_RATE = 0.10; // 10% platform fee

export function useWallet() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [stats, setStats] = useState<WalletStats>({
    availableBalance: 0,
    pendingBalance: 0,
    totalWithdrawn: 0,
    lastWithdrawalDate: null,
    grossRevenue: 0,
    totalFees: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []).map(tx => ({
        ...tx,
        type: tx.type as 'credit' | 'debit' | 'withdrawal',
        status: tx.status as 'pending' | 'completed' | 'cancelled',
      }));

      setTransactions(typedData);
      calculateStats(typedData);
      generateChartData(typedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (txs: WalletTransaction[]) => {
    const completedCredits = txs.filter(tx => tx.type === 'credit' && tx.status === 'completed');
    const pendingCredits = txs.filter(tx => tx.type === 'credit' && tx.status === 'pending');
    const withdrawals = txs.filter(tx => tx.type === 'withdrawal' && tx.status === 'completed');

    const availableBalance = completedCredits.reduce((sum, tx) => sum + tx.net_amount, 0) - 
                             withdrawals.reduce((sum, tx) => sum + tx.amount, 0);
    const pendingBalance = pendingCredits.reduce((sum, tx) => sum + tx.net_amount, 0);
    const totalWithdrawn = withdrawals.reduce((sum, tx) => sum + tx.amount, 0);
    const grossRevenue = completedCredits.reduce((sum, tx) => sum + tx.amount, 0);
    const totalFees = completedCredits.reduce((sum, tx) => sum + tx.fee, 0);

    const lastWithdrawal = withdrawals[0];

    setStats({
      availableBalance,
      pendingBalance,
      totalWithdrawn,
      lastWithdrawalDate: lastWithdrawal?.created_at || null,
      grossRevenue,
      totalFees,
    });
  };

  const generateChartData = (txs: WalletTransaction[], days: number = 7) => {
    const now = new Date();
    const data: ChartDataPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayAmount = txs
        .filter(tx => {
          const txDate = new Date(tx.created_at);
          return tx.type === 'credit' && 
                 tx.status === 'completed' &&
                 txDate >= dayStart && 
                 txDate <= dayEnd;
        })
        .reduce((sum, tx) => sum + tx.net_amount, 0);

      data.push({ date: dateStr, amount: dayAmount });
    }

    setChartData(data);
  };

  const updateChartPeriod = (days: number) => {
    generateChartData(transactions, days);
  };

  const createTransactionFromQuote = async (
    quoteId: string,
    amount: number,
    description: string,
    customerName: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fee = amount * PLATFORM_FEE_RATE;
      const netAmount = amount - fee;

      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          quote_id: quoteId,
          type: 'credit',
          amount,
          fee,
          net_amount: netAmount,
          description,
          customer_name: customerName,
          status: 'completed',
        });

      if (error) throw error;

      await fetchTransactions();
      toast({
        title: 'Pagamento recebido!',
        description: `R$ ${netAmount.toFixed(2)} foram adicionados à sua carteira`,
      });

      return true;
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar o pagamento',
        variant: 'destructive',
      });
      return false;
    }
  };

  const requestWithdrawal = async (amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (amount > stats.availableBalance) {
        toast({
          title: 'Saldo insuficiente',
          description: 'Você não tem saldo suficiente para este saque',
          variant: 'destructive',
        });
        return false;
      }

      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount,
          fee: 0,
          net_amount: amount,
          description: 'Saque para conta bancária',
          status: 'pending',
        });

      if (error) throw error;

      await fetchTransactions();
      toast({
        title: 'Saque solicitado!',
        description: 'Seu saque será processado em até 2 dias úteis',
      });

      return true;
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível solicitar o saque',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('wallet-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    transactions,
    stats,
    chartData,
    isLoading,
    updateChartPeriod,
    createTransactionFromQuote,
    requestWithdrawal,
    refetch: fetchTransactions,
  };
}
