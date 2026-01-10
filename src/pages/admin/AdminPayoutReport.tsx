import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  FileSpreadsheet, 
  Calendar as CalendarIcon, 
  Search,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
  RefreshCw,
  User
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface PayoutRecord {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
  abacatepay_withdrawal_id: string | null;
  abacatepay_status: string | null;
  profile?: {
    full_name: string | null;
  };
  bank_account?: {
    pix_key: string | null;
    pix_key_type: string | null;
    bank_name: string | null;
    account_holder_name: string;
  } | null;
}

interface Professional {
  user_id: string;
  full_name: string | null;
}

type PeriodPreset = 'today' | 'this_week' | 'this_month' | 'last_month' | 'last_3_months' | 'custom';

export default function AdminPayoutReport() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filters
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('this_month');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [professionalFilter, setProfessionalFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProfessionals = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .eq('account_type', 'profissional');
    
    if (data) {
      setProfessionals(data);
    }
  };

  const fetchPayouts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('type', 'withdrawal')
        .order('created_at', { ascending: false });

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (professionalFilter !== 'all') {
        query = query.eq('user_id', professionalFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with profile data
      const enrichedData = await Promise.all(
        (data || []).map(async (payout) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', payout.user_id)
            .single();

          let bankAccount = null;
          if (payout.bank_account_id) {
            const { data: account } = await supabase
              .from('bank_accounts')
              .select('pix_key, pix_key_type, bank_name, account_holder_name')
              .eq('id', payout.bank_account_id)
              .single();
            bankAccount = account;
          }

          return {
            ...payout,
            profile,
            bank_account: bankAccount,
          };
        })
      );

      setPayouts(enrichedData);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [dateRange, statusFilter, professionalFilter]);

  const handlePeriodPreset = (preset: PeriodPreset) => {
    setPeriodPreset(preset);
    const now = new Date();
    
    switch (preset) {
      case 'today':
        setDateRange({ from: now, to: now });
        break;
      case 'this_week':
        setDateRange({ from: startOfWeek(now, { locale: ptBR }), to: endOfWeek(now, { locale: ptBR }) });
        break;
      case 'this_month':
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case 'last_3_months':
        setDateRange({ from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) });
        break;
      case 'custom':
        // Keep current range
        break;
    }
  };

  const filteredPayouts = useMemo(() => {
    return payouts.filter(p => 
      p.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.abacatepay_withdrawal_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [payouts, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const pending = filteredPayouts.filter(p => p.status === 'pending');
    const processing = filteredPayouts.filter(p => p.status === 'processing');
    const completed = filteredPayouts.filter(p => p.status === 'completed');
    const cancelled = filteredPayouts.filter(p => p.status === 'cancelled');

    return {
      total: filteredPayouts.length,
      totalAmount: filteredPayouts.reduce((sum, p) => sum + p.amount, 0),
      pending: pending.length,
      pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
      processing: processing.length,
      processingAmount: processing.reduce((sum, p) => sum + p.amount, 0),
      completed: completed.length,
      completedAmount: completed.reduce((sum, p) => sum + p.amount, 0),
      cancelled: cancelled.length,
      cancelledAmount: cancelled.reduce((sum, p) => sum + p.amount, 0),
      totalFees: filteredPayouts.reduce((sum, p) => sum + (p.fee || 0), 0),
    };
  }, [filteredPayouts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string, abacatepayStatus?: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processando</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Concluído</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Recusado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      const headers = [
        'ID',
        'Data Solicitação',
        'Profissional',
        'Valor Bruto',
        'Taxa',
        'Valor Líquido',
        'Status',
        'Data Processamento',
        'Chave PIX',
        'ID AbacatePay',
      ];

      const rows = filteredPayouts.map(p => [
        p.id,
        format(new Date(p.created_at), 'dd/MM/yyyy HH:mm'),
        p.profile?.full_name || 'N/A',
        p.amount.toFixed(2).replace('.', ','),
        (p.fee || 0).toFixed(2).replace('.', ','),
        p.net_amount.toFixed(2).replace('.', ','),
        p.status === 'pending' ? 'Pendente' : 
          p.status === 'processing' ? 'Processando' :
          p.status === 'completed' ? 'Concluído' : 'Recusado',
        p.processed_at ? format(new Date(p.processed_at), 'dd/MM/yyyy HH:mm') : '-',
        p.bank_account?.pix_key || '-',
        p.abacatepay_withdrawal_id || '-',
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';')),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio-repasses-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminLayout title="Relatório de Repasses" description="Análise detalhada de todos os saques">
      <div className="space-y-6">
        {/* Filters Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Filtros</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fetchPayouts()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button size="sm" onClick={exportToCSV} disabled={isExporting || filteredPayouts.length === 0}>
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Period Presets */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'today', label: 'Hoje' },
                { value: 'this_week', label: 'Esta Semana' },
                { value: 'this_month', label: 'Este Mês' },
                { value: 'last_month', label: 'Mês Passado' },
                { value: 'last_3_months', label: 'Últimos 3 Meses' },
                { value: 'custom', label: 'Personalizado' },
              ].map(preset => (
                <Button
                  key={preset.value}
                  variant={periodPreset === preset.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodPreset(preset.value as PeriodPreset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Date Range Picker */}
              <div className="space-y-2">
                <Label>Período</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateRange && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                          </>
                        ) : (
                          format(dateRange.from, 'dd/MM/yyyy')
                        )
                      ) : (
                        <span>Selecione o período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => {
                        setDateRange(range);
                        setPeriodPreset('custom');
                      }}
                      locale={ptBR}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Recusado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Professional Filter */}
              <div className="space-y-2">
                <Label>Profissional</Label>
                <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os profissionais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os profissionais</SelectItem>
                    {professionals.map(prof => (
                      <SelectItem key={prof.user_id} value={prof.user_id}>
                        {prof.full_name || 'Sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome, ID ou transação..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm font-medium text-primary">{formatCurrency(stats.totalAmount)}</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-muted-foreground">Pendentes</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm font-medium text-yellow-600">{formatCurrency(stats.pendingAmount)}</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Processando</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              <p className="text-sm font-medium text-blue-600">{formatCurrency(stats.processingAmount)}</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-muted-foreground">Concluídos</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
              <p className="text-sm font-medium text-emerald-600">{formatCurrency(stats.completedAmount)}</p>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Recusados</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-sm font-medium text-red-600">{formatCurrency(stats.cancelledAmount)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Fee Summary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Taxas Cobradas no Período</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalFees)}</p>
                </div>
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary">
                Taxa: 10% + R$ 0,80
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Detalhamento</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredPayouts.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">Nenhum repasse encontrado para os filtros selecionados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead className="text-right">Valor Bruto</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Valor Líquido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processado em</TableHead>
                      <TableHead>ID Transação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(payout.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{payout.profile?.full_name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payout.amount)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(payout.fee || 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(payout.net_amount)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(payout.status, payout.abacatepay_status)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {payout.processed_at 
                            ? format(new Date(payout.processed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {payout.abacatepay_withdrawal_id 
                            ? payout.abacatepay_withdrawal_id.slice(0, 8) + '...'
                            : payout.id.slice(0, 8) + '...'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
