import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialMetrics } from '@/hooks/useFinancialMetrics';
import { useSubscriptionPlans, useSubscriptionMetrics } from '@/hooks/useSubscriptionPlans';
import { 
  TrendingUp, 
  Clock, 
  DollarSign,
  CheckCircle2,
  XCircle,
  Wallet,
  PiggyBank,
  CreditCard,
  Users
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
} from 'recharts';

export default function AdminFinancial() {
  const { withdrawalsByDate, revenueBreakdown, stats, isLoading } = useFinancialMetrics();
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
      name: 'Lucro da Plataforma', 
      value: revenueBreakdown.platformProfit,
      percentage: revenueBreakdown.totalRevenue > 0 
        ? ((revenueBreakdown.platformProfit / revenueBreakdown.totalRevenue) * 100).toFixed(1)
        : 0,
    },
    { 
      name: 'Pago aos Profissionais', 
      value: revenueBreakdown.paidToProfessionals,
      percentage: revenueBreakdown.totalRevenue > 0 
        ? ((revenueBreakdown.paidToProfessionals / revenueBreakdown.totalRevenue) * 100).toFixed(1)
        : 0,
    },
  ];

  const COLORS_PIE = ['#22c55e', '#3b82f6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-xl p-4 shadow-xl">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-popover border border-border rounded-xl p-4 shadow-xl">
          <div className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color ?? data.fill ?? 'hsl(var(--muted-foreground))' }}
            />
            <span className="font-semibold text-foreground">{data.name}</span>
          </div>
          <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(data.value)}</p>
          <p className="text-sm text-muted-foreground">{data.payload.percentage}% do total</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard Financeiro" description="Análise financeira da plataforma">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard Financeiro" description="Análise financeira da plataforma">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
                <p className="text-2xl font-bold">{formatCurrency(revenueBreakdown.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <PiggyBank className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lucro (Taxas)</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(revenueBreakdown.platformProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pago aos Profissionais</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(revenueBreakdown.paidToProfessionals)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saques Pendentes</p>
                <p className="text-2xl font-bold">
                  {stats.totalWithdrawalsPending} ({formatCurrency(stats.amountPending)})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Stats */}
      <div className="grid gap-4 md:grid-cols-3 mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saques Aprovados</p>
                <p className="text-xl font-bold">
                  {stats.totalWithdrawalsApproved}
                </p>
                <p className="text-sm text-green-600 font-medium">
                  {formatCurrency(stats.amountApproved)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saques Recusados</p>
                <p className="text-xl font-bold">
                  {stats.totalWithdrawalsRejected}
                </p>
                <p className="text-sm text-red-600 font-medium">
                  {formatCurrency(stats.amountRejected)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
                <p className="text-xl font-bold">
                  {stats.totalWithdrawalsApproved + stats.totalWithdrawalsRejected > 0
                    ? Math.round(
                        (stats.totalWithdrawalsApproved /
                          (stats.totalWithdrawalsApproved + stats.totalWithdrawalsRejected)) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Withdrawals Over Time - Bar Chart */}
        <Card className="overflow-visible">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-red-500 rounded-full" />
              Saques ao Longo do Tempo
            </CardTitle>
            <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[320px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={withdrawalsByDate} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="rejectedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.5}
                  />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    interval={4}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={formatCompactCurrency}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 50 }} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                  <Bar 
                    dataKey="approved" 
                    name="Aprovados"
                    fill="url(#approvedGradient)" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar 
                    dataKey="rejected" 
                    name="Recusados"
                    fill="url(#rejectedGradient)" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-b from-green-500 to-green-600" />
                <span className="text-sm text-muted-foreground">Aprovados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-b from-red-500 to-red-600" />
                <span className="text-sm text-muted-foreground">Recusados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown - Donut Chart */}
        <Card className="overflow-visible">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-green-500 rounded-full" />
              Distribuição do Faturamento
            </CardTitle>
            <p className="text-sm text-muted-foreground">Divisão entre plataforma e profissionais</p>
          </CardHeader>
          <CardContent className="pt-0">
            {revenueBreakdown.totalRevenue > 0 ? (
              <>
                <div className="h-[280px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#16a34a" />
                        </linearGradient>
                        <linearGradient id="paidGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15"/>
                        </filter>
                      </defs>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        filter="url(#shadow)"
                      >
                        <Cell fill="url(#profitGradient)" />
                        <Cell fill="url(#paidGradient)" />
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} wrapperStyle={{ zIndex: 50 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(revenueBreakdown.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-green-500 to-green-600" />
                      <span className="text-xs text-muted-foreground font-medium">Lucro</span>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(revenueBreakdown.platformProfit)}
                    </p>
                    <p className="text-xs text-green-600/80 mt-0.5">{pieData[0].percentage}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600" />
                      <span className="text-xs text-muted-foreground font-medium">Profissionais</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(revenueBreakdown.paidToProfessionals)}
                    </p>
                    <p className="text-xs text-blue-600/80 mt-0.5">{pieData[1].percentage}%</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                <DollarSign className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Nenhum dado de faturamento disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Receita por Planos
        </h2>
        
        {isLoadingSubscriptions ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <>
            {/* Subscription Summary */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Assinantes Ativos</p>
                      <p className="text-2xl font-bold">{subscriptionMetrics.activeSubscribers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <DollarSign className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Receita Mensal (Planos)</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {formatCurrency(subscriptionMetrics.monthlyRevenue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Assinaturas</p>
                      <p className="text-2xl font-bold">{subscriptionMetrics.totalSubscribers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <CreditCard className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Planos Cadastrados</p>
                      <p className="text-2xl font-bold">{plans.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Plan */}
            {subscriptionMetrics.revenueByPlan.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="h-8 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
                    Detalhamento por Plano
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subscriptionMetrics.revenueByPlan.map((planData, index) => {
                      const colors = ['bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500'];
                      const colorClass = colors[index % colors.length];
                      
                      return (
                        <div
                          key={planData.planName}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                            <div>
                              <p className="font-medium">{planData.planName}</p>
                              <p className="text-sm text-muted-foreground">
                                {planData.subscribers} assinante{planData.subscribers !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <p className="text-lg font-bold">{formatCurrency(planData.revenue)}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {subscriptionMetrics.revenueByPlan.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <CreditCard className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma assinatura ativa ainda</p>
                    <p className="text-xs mt-1">As assinaturas aparecerão aqui quando houver</p>
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