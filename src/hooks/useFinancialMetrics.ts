import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface WithdrawalsByDate {
  date: string;
  approved: number;
  rejected: number;
}

interface RevenueBreakdown {
  totalRevenue: number;
  paidToProfessionals: number;
  platformProfit: number;
}

interface FinancialStats {
  totalWithdrawalsApproved: number;
  totalWithdrawalsRejected: number;
  totalWithdrawalsPending: number;
  amountApproved: number;
  amountRejected: number;
  amountPending: number;
}

export function useFinancialMetrics() {
  const [withdrawalsByDate, setWithdrawalsByDate] = useState<WithdrawalsByDate[]>([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown>({
    totalRevenue: 0,
    paidToProfessionals: 0,
    platformProfit: 0,
  });
  const [stats, setStats] = useState<FinancialStats>({
    totalWithdrawalsApproved: 0,
    totalWithdrawalsRejected: 0,
    totalWithdrawalsPending: 0,
    amountApproved: 0,
    amountRejected: 0,
    amountPending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      // Fetch all wallet transactions
      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Calculate revenue breakdown from credit transactions
      const credits = (transactions || []).filter(
        (tx) => tx.type === 'credit' && tx.status === 'completed'
      );
      
      const totalRevenue = credits.reduce((sum, tx) => sum + Number(tx.amount), 0);
      const platformProfit = credits.reduce((sum, tx) => sum + Number(tx.fee), 0);
      const paidToProfessionals = credits.reduce((sum, tx) => sum + Number(tx.net_amount), 0);

      setRevenueBreakdown({
        totalRevenue,
        paidToProfessionals,
        platformProfit,
      });

      // Filter withdrawal transactions
      const withdrawals = (transactions || []).filter((tx) => tx.type === 'withdrawal');

      // Calculate stats
      const approved = withdrawals.filter((w) => w.status === 'completed');
      const rejected = withdrawals.filter((w) => w.status === 'cancelled');
      const pending = withdrawals.filter((w) => w.status === 'pending');

      setStats({
        totalWithdrawalsApproved: approved.length,
        totalWithdrawalsRejected: rejected.length,
        totalWithdrawalsPending: pending.length,
        amountApproved: approved.reduce((sum, w) => sum + Number(w.amount), 0),
        amountRejected: rejected.reduce((sum, w) => sum + Number(w.amount), 0),
        amountPending: pending.reduce((sum, w) => sum + Number(w.amount), 0),
      });

      // Generate withdrawals by date for the last 30 days
      const last30Days: WithdrawalsByDate[] = [];
      const now = new Date();

      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const displayDate = format(date, 'dd/MM');

        const dayApproved = withdrawals.filter((w) => {
          if (w.status !== 'completed' || !w.processed_at) return false;
          const processedDate = format(new Date(w.processed_at), 'yyyy-MM-dd');
          return processedDate === dateStr;
        });

        const dayRejected = withdrawals.filter((w) => {
          if (w.status !== 'cancelled' || !w.processed_at) return false;
          const processedDate = format(new Date(w.processed_at), 'yyyy-MM-dd');
          return processedDate === dateStr;
        });

        last30Days.push({
          date: displayDate,
          approved: dayApproved.reduce((sum, w) => sum + Number(w.amount), 0),
          rejected: dayRejected.reduce((sum, w) => sum + Number(w.amount), 0),
        });
      }

      setWithdrawalsByDate(last30Days);
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    withdrawalsByDate,
    revenueBreakdown,
    stats,
    isLoading,
    refetch: fetchMetrics,
  };
}
