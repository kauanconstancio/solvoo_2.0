import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, Search, Wallet, Clock, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
  rejection_reason: string | null;
  bank_account_id: string | null;
  profile?: {
    full_name: string | null;
    email?: string;
  };
  bank_account?: {
    account_type: string;
    pix_key: string | null;
    pix_key_type: string | null;
    bank_name: string | null;
    agency: string | null;
    account_number: string | null;
    account_holder_name: string;
    account_holder_document: string;
  } | null;
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('pending');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchWithdrawals = async () => {
    try {
      let query = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('type', 'withdrawal')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles and bank accounts for each withdrawal
      const enrichedData = await Promise.all(
        (data || []).map(async (withdrawal) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', withdrawal.user_id)
            .single();

          let bankAccount = null;
          if (withdrawal.bank_account_id) {
            const { data: account } = await supabase
              .from('bank_accounts')
              .select('*')
              .eq('id', withdrawal.bank_account_id)
              .single();
            bankAccount = account;
          } else {
            // Try to get default bank account
            const { data: defaultAccount } = await supabase
              .from('bank_accounts')
              .select('*')
              .eq('user_id', withdrawal.user_id)
              .eq('is_default', true)
              .single();
            bankAccount = defaultAccount;
          }

          return {
            ...withdrawal,
            profile,
            bank_account: bankAccount,
          };
        })
      );

      setWithdrawals(enrichedData as WithdrawalRequest[]);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('wallet_transactions')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
        })
        .eq('id', selectedWithdrawal.id);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_logs').insert({
        admin_id: user?.id,
        action: 'approve_withdrawal',
        target_type: 'wallet_transaction',
        target_id: selectedWithdrawal.id,
        details: { amount: selectedWithdrawal.amount },
      });

      toast({
        title: 'Saque aprovado',
        description: `O saque de R$ ${selectedWithdrawal.amount.toFixed(2)} foi aprovado.`,
      });

      setShowApproveDialog(false);
      setSelectedWithdrawal(null);
      fetchWithdrawals();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar o saque.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) return;
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('wallet_transactions')
        .update({
          status: 'cancelled',
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
          rejection_reason: rejectionReason,
        })
        .eq('id', selectedWithdrawal.id);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_logs').insert({
        admin_id: user?.id,
        action: 'reject_withdrawal',
        target_type: 'wallet_transaction',
        target_id: selectedWithdrawal.id,
        details: { amount: selectedWithdrawal.amount, reason: rejectionReason },
      });

      toast({
        title: 'Saque recusado',
        description: 'O saque foi recusado e o saldo devolvido ao usuário.',
      });

      setShowRejectDialog(false);
      setSelectedWithdrawal(null);
      setRejectionReason('');
      fetchWithdrawals();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível recusar o saque.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600"><XCircle className="h-3 w-3 mr-1" />Recusado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => 
    w.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const totalPendingAmount = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  if (isLoading) {
    return (
      <AdminLayout title="Saques" description="Gerenciar solicitações de saque">
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Saques" description="Gerenciar solicitações de saque">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saques Pendentes</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total Pendente</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aprovados Hoje</p>
                <p className="text-2xl font-bold">
                  {withdrawals.filter(w => 
                    w.status === 'completed' && 
                    w.processed_at && 
                    new Date(w.processed_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'completed', 'cancelled'] as const).map(status => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'Todos' : status === 'pending' ? 'Pendentes' : status === 'completed' ? 'Aprovados' : 'Recusados'}
            </Button>
          ))}
        </div>
      </div>

      {/* Withdrawals List */}
      <div className="space-y-4">
        {filteredWithdrawals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma solicitação de saque encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          filteredWithdrawals.map(withdrawal => (
            <Card key={withdrawal.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{withdrawal.profile?.full_name || 'Usuário'}</p>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(withdrawal.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solicitado em {format(new Date(withdrawal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    
                    {/* Bank Account Info */}
                    {withdrawal.bank_account && (
                      <div className="mt-2 p-2 bg-muted/50 rounded-lg text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          {withdrawal.bank_account.account_type === 'pix' ? (
                            <span>PIX: {withdrawal.bank_account.pix_key}</span>
                          ) : (
                            <span>
                              {withdrawal.bank_account.bank_name} - Ag: {withdrawal.bank_account.agency} | 
                              Conta: {withdrawal.bank_account.account_number}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1">
                          Titular: {withdrawal.bank_account.account_holder_name} ({withdrawal.bank_account.account_holder_document})
                        </p>
                      </div>
                    )}

                    {withdrawal.rejection_reason && (
                      <p className="text-sm text-red-600 mt-2">
                        Motivo: {withdrawal.rejection_reason}
                      </p>
                    )}
                  </div>

                  {withdrawal.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setShowRejectDialog(true);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Recusar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setShowApproveDialog(true);
                        }}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Saque</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma a aprovação do saque de {selectedWithdrawal && formatCurrency(selectedWithdrawal.amount)} para {selectedWithdrawal?.profile?.full_name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Aprovar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Saque</DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa do saque de {selectedWithdrawal && formatCurrency(selectedWithdrawal.amount)}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Motivo da recusa..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Recusar Saque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
