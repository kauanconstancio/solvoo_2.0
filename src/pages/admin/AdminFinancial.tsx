import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useFinancialMetrics } from '@/hooks/useFinancialMetrics';
import { useSubscriptionPlans, useSubscriptionMetrics } from '@/hooks/useSubscriptionPlans';
import { AnimatedMetricCard } from '@/components/AnimatedMetricCard';
import { 
  TrendingUp, 
  Clock, 
  DollarSign,
  CheckCircle2,
  XCircle,
  Wallet,
  PiggyBank,
  CreditCard,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import { cn } from '@/lib/utils';

export default function AdminFinancial() {
  const { withdrawalsByDate, revenueByDate, revenueBreakdown, stats, isLoading } = useFinancialMetrics();
  const { plans } = useSubscriptionPlans();
  const { metrics: subscriptionMetrics, isLoading: isLoadingSubscriptions } = useSubscriptionMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
    return `R$${value}`;
  };

  const pieData = [
    { 
      name: 'Lucro (Taxas)', 
      value: revenueBreakdown.platformProfit - revenueBreakdown.subscriptionRevenue,
      percentage: revenueBreakdown.combinedTotal > 0 
        ? (((revenueBreakdown.platformProfit - revenueBreakdown.subscriptionRevenue) / revenueBreakdown.combinedTotal) * 100).toFixed(1)
        : 0,
    },
    { 
      name: 'Assinaturas', 
      value: revenueBreakdown.subscriptionRevenue,
      percentage: revenueBreakdown.combinedTotal > 0 
        ? ((revenueBreakdown.subscriptionRevenue / revenueBreakdown.combinedTotal) * 100).toFixed(1)
        : 0,
    },
    { 
      name: 'Profissionais', 
      value: revenueBreakdown.paidToProfessionals,
      percentage: revenueBreakdown.combinedTotal > 0 
        ? ((revenueBreakdown.paidToProfessionals / revenueBreakdown.combinedTotal) * 100).toFixed(1)
        : 0,
    },
  ];

  const COLORS_PIE = ['#10b981', '#8b5cf6', '#3b82f6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl">
          <p className="font-semibold text-foreground mb-3 text-sm">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-background"
                    style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}40` }}
                  />
                  <span className="text-muted-foreground text-sm">{entry.name}</span>
                </div>
                <span className="font-bold text-foreground">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            <span 
              className="w-3 h-3 rounded-full ring-2 ring-offset-1 ring-offset-background"
              style={{ backgroundColor: data.color ?? data.fill, boxShadow: `0 0 10px ${data.color ?? data.fill}40` }}
            />
            <span className="font-medium text-foreground text-sm">{data.name}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(data.value)}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-muted-foreground">{data.payload.percentage}% do total</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const approvalRate = stats.totalWithdrawalsApproved + stats.totalWithdrawalsRejected > 0
    ? Math.round((stats.totalWithdrawalsApproved / (stats.totalWithdrawalsApproved + stats.totalWithdrawalsRejected)) * 100)
    : 0;

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard Financeiro" description="Análise financeira da plataforma">
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[420px] rounded-2xl" />
            <Skeleton className="h-[420px] rounded-2xl" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard Financeiro" description="Visão completa das finanças da plataforma">
      {/* Hero Stats */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-blue-500/5 rounded-3xl blur-xl" />
        <div className="relative bg-gradient-to-br from-background via-background to-muted/30 border border-border/50 rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg shadow-primary/25">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Resumo Financeiro</h2>
              <p className="text-sm text-muted-foreground">Visão geral do período</p>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {/* Faturamento Total */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-5 transition-all hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/30">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:scale-150 transition-transform" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Faturamento Total</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(revenueBreakdown.combinedTotal)}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">
                    Serviços + Assinaturas
                  </Badge>
                </div>
              </div>
            </div>

            {/* Lucro */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 p-5 transition-all hover:shadow-lg hover:shadow-green-500/10 hover:border-green-500/30">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:scale-150 transition-transform" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-green-500/10 rounded-xl">
                    <PiggyBank className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lucro Total</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(revenueBreakdown.platformProfit)}</p>
                <div className="flex items-center gap-1 text-green-500">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs font-medium">Taxas + Assinaturas</span>
                </div>
              </div>
            </div>

            {/* Assinaturas */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 p-5 transition-all hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:scale-150 transition-transform" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-purple-500/10 rounded-xl">
                    <CreditCard className="h-4 w-4 text-purple-500" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assinaturas</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(revenueBreakdown.subscriptionRevenue)}</p>
                <div className="flex items-center gap-1 text-purple-500">
                  <Zap className="h-3 w-3" />
                  <span className="text-xs font-medium">{subscriptionMetrics.activeSubscribers} ativos</span>
                </div>
              </div>
            </div>

            {/* Pago aos Profissionais */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 p-5 transition-all hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-500/30">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:scale-150 transition-transform" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl">
                    <Wallet className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profissionais</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(revenueBreakdown.paidToProfessionals)}</p>
                <div className="flex items-center gap-1 text-blue-500">
                  <Users className="h-3 w-3" />
                  <span className="text-xs font-medium">Valor pago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="group relative overflow-hidden border-amber-500/20 hover:border-amber-500/40 transition-all hover:shadow-lg hover:shadow-amber-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-amber-500/10 rounded-xl">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/5">
                Pendente
              </Badge>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalWithdrawalsPending}</p>
            <p className="text-sm text-muted-foreground mb-2">Saques pendentes</p>
            <p className="text-lg font-semibold text-amber-600">{formatCurrency(stats.amountPending)}</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-green-500/20 hover:border-green-500/40 transition-all hover:shadow-lg hover:shadow-green-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-green-500/10 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <Badge variant="outline" className="border-green-500/30 text-green-600 bg-green-500/5">
                Aprovado
              </Badge>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalWithdrawalsApproved}</p>
            <p className="text-sm text-muted-foreground mb-2">Saques aprovados</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(stats.amountApproved)}</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-red-500/20 hover:border-red-500/40 transition-all hover:shadow-lg hover:shadow-red-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-red-500/10 rounded-xl">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <Badge variant="outline" className="border-red-500/30 text-red-600 bg-red-500/5">
                Recusado
              </Badge>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalWithdrawalsRejected}</p>
            <p className="text-sm text-muted-foreground mb-2">Saques recusados</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(stats.amountRejected)}</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                Taxa
              </Badge>
            </div>
            <p className="text-3xl font-bold mb-1">{approvalRate}%</p>
            <p className="text-sm text-muted-foreground mb-2">Taxa de aprovação</p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${approvalRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Withdrawals Over Time */}
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="pb-2 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-red-500 rounded-xl">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Saques ao Longo do Tempo</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Últimos 30 dias</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={withdrawalsByDate} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="rejectedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.4}
                  />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    interval={4}
                    dy={8}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={formatCompactCurrency}
                    width={55}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2, radius: 4 }} />
                  <Bar 
                    dataKey="approved" 
                    name="Aprovados"
                    fill="url(#approvedGradient)" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar 
                    dataKey="rejected" 
                    name="Recusados"
                    fill="url(#rejectedGradient)" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-b from-green-500 to-green-600 ring-2 ring-green-500/20" />
                <span className="text-sm text-muted-foreground">Aprovados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-b from-red-500 to-red-600 ring-2 ring-red-500/20" />
                <span className="text-sm text-muted-foreground">Recusados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown - Donut */}
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="pb-2 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                <PieChartIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Distribuição do Faturamento</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Serviços, Assinaturas e Profissionais</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {revenueBreakdown.combinedTotal > 0 ? (
              <>
                <div className="h-[260px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.1"/>
                        </filter>
                      </defs>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={105}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        filter="url(#shadow)"
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS_PIE[index]}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">Total</p>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(revenueBreakdown.combinedTotal)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-xl p-3 text-center hover:border-green-500/40 transition-colors">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-green-500/20" />
                      <span className="text-xs text-muted-foreground font-medium">Taxas</span>
                    </div>
                    <p className="text-base font-bold text-green-600">
                      {formatCurrency(revenueBreakdown.platformProfit - revenueBreakdown.subscriptionRevenue)}
                    </p>
                    <p className="text-xs text-green-600/70 font-medium">{pieData[0].percentage}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-xl p-3 text-center hover:border-purple-500/40 transition-colors">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-500/20" />
                      <span className="text-xs text-muted-foreground font-medium">Assinaturas</span>
                    </div>
                    <p className="text-base font-bold text-purple-600">
                      {formatCurrency(revenueBreakdown.subscriptionRevenue)}
                    </p>
                    <p className="text-xs text-purple-600/70 font-medium">{pieData[1].percentage}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-xl p-3 text-center hover:border-blue-500/40 transition-colors">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
                      <span className="text-xs text-muted-foreground font-medium">Profissionais</span>
                    </div>
                    <p className="text-base font-bold text-blue-600">
                      {formatCurrency(revenueBreakdown.paidToProfessionals)}
                    </p>
                    <p className="text-xs text-blue-600/70 font-medium">{pieData[2].percentage}%</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                  <DollarSign className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-sm font-medium">Nenhum dado disponível</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Os dados aparecerão quando houver transações</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Over Time */}
      <Card className="overflow-hidden border-border/50 mb-8">
        <CardHeader className="pb-2 bg-gradient-to-r from-muted/30 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-purple-500 rounded-xl">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Receita ao Longo do Tempo</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Serviços vs Assinaturas • Últimos 30 dias</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueByDate}>
                <defs>
                  <linearGradient id="serviceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="subscriptionAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false}
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.4}
                />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  interval={4}
                  dy={8}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatCompactCurrency}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="services"
                  name="Serviços"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#serviceAreaGradient)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="subscriptions"
                  name="Assinaturas"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#subscriptionAreaGradient)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
              <span className="text-sm text-muted-foreground">Serviços</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-purple-500/20" />
              <span className="text-sm text-muted-foreground">Assinaturas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 rounded-full bg-green-500" style={{ borderStyle: 'dashed' }} />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Receita por Planos</h2>
            <p className="text-sm text-muted-foreground">Detalhamento das assinaturas</p>
          </div>
        </div>
        
        {isLoadingSubscriptions ? (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card className="group relative overflow-hidden border-purple-500/20 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-5 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                      <Users className="h-4 w-4 text-purple-500" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ativos</span>
                  </div>
                  <p className="text-3xl font-bold">{subscriptionMetrics.activeSubscribers}</p>
                  <p className="text-sm text-muted-foreground">assinantes</p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-indigo-500/20 hover:border-indigo-500/40 transition-all hover:shadow-lg hover:shadow-indigo-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-5 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                      <DollarSign className="h-4 w-4 text-indigo-500" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mensal</span>
                  </div>
                  <p className="text-3xl font-bold text-indigo-600">{formatCurrency(subscriptionMetrics.monthlyRevenue)}</p>
                  <p className="text-sm text-muted-foreground">receita mensal</p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-cyan-500/20 hover:border-cyan-500/40 transition-all hover:shadow-lg hover:shadow-cyan-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-5 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-cyan-500/10 rounded-xl">
                      <TrendingUp className="h-4 w-4 text-cyan-500" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</span>
                  </div>
                  <p className="text-3xl font-bold">{subscriptionMetrics.totalSubscribers}</p>
                  <p className="text-sm text-muted-foreground">assinaturas</p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-amber-500/20 hover:border-amber-500/40 transition-all hover:shadow-lg hover:shadow-amber-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-5 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-amber-500/10 rounded-xl">
                      <CreditCard className="h-4 w-4 text-amber-500" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Planos</span>
                  </div>
                  <p className="text-3xl font-bold">{plans.length}</p>
                  <p className="text-sm text-muted-foreground">cadastrados</p>
                </CardContent>
              </Card>
            </div>

            {subscriptionMetrics.revenueByPlan.length > 0 && (
              <Card className="overflow-hidden border-border/50">
                <CardHeader className="pb-2 bg-gradient-to-r from-muted/30 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-base">Detalhamento por Plano</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {subscriptionMetrics.revenueByPlan.map((planData, index) => {
                      const colors = ['purple', 'indigo', 'blue', 'cyan'] as const;
                      const color = colors[index % colors.length];
                      const colorClasses = {
                        purple: 'from-purple-500/10 to-transparent border-purple-500/20 hover:border-purple-500/40',
                        indigo: 'from-indigo-500/10 to-transparent border-indigo-500/20 hover:border-indigo-500/40',
                        blue: 'from-blue-500/10 to-transparent border-blue-500/20 hover:border-blue-500/40',
                        cyan: 'from-cyan-500/10 to-transparent border-cyan-500/20 hover:border-cyan-500/40',
                      };
                      const dotClasses = {
                        purple: 'bg-purple-500',
                        indigo: 'bg-indigo-500',
                        blue: 'bg-blue-500',
                        cyan: 'bg-cyan-500',
                      };
                      
                      return (
                        <div
                          key={planData.planName}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl bg-gradient-to-r border transition-all",
                            colorClasses[color]
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("w-3 h-3 rounded-full ring-2 ring-offset-1 ring-offset-background", dotClasses[color], `ring-${color}-500/30`)} />
                            <div>
                              <p className="font-semibold">{planData.planName}</p>
                              <p className="text-sm text-muted-foreground">
                                {planData.subscribers} assinante{planData.subscribers !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <p className="text-xl font-bold">{formatCurrency(planData.revenue)}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {subscriptionMetrics.revenueByPlan.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <div className="p-4 bg-muted/50 rounded-full mb-4">
                      <CreditCard className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">Nenhuma assinatura ativa</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">As assinaturas aparecerão aqui quando houver</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
