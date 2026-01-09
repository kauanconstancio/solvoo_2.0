import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialMetrics } from '@/hooks/useFinancialMetrics';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign,
  CheckCircle2,
  XCircle,
  Wallet,
  PiggyBank
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = {
  profit: 'hsl(142, 76%, 36%)', // green-600
  paid: 'hsl(221, 83%, 53%)', // blue-600
  approved: 'hsl(142, 76%, 36%)', // green
  rejected: 'hsl(0, 84%, 60%)', // red
};

export default function AdminFinancial() {
  const { withdrawalsByDate, revenueBreakdown, stats, isLoading } = useFinancialMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const pieData = [
    { 
      name: 'Lucro da Plataforma', 
      value: revenueBreakdown.platformProfit,
      color: COLORS.profit,
    },
    { 
      name: 'Pago aos Profissionais', 
      value: revenueBreakdown.paidToProfessionals,
      color: COLORS.paid,
    },
  ];

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
        {/* Withdrawals Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Saques ao Longo do Tempo (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={withdrawalsByDate}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    className="text-muted-foreground"
                    tick={{ fontSize: 11 }}
                    interval={4}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    tickFormatter={(value) => 
                      value >= 1000 ? `R$${(value / 1000).toFixed(0)}k` : `R$${value}`
                    }
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="approved" 
                    name="Aprovados"
                    fill={COLORS.approved} 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="rejected" 
                    name="Recusados"
                    fill={COLORS.rejected} 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição do Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {revenueBreakdown.totalRevenue > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => 
                        `${name}: ${(percent * 100).toFixed(1)}%`
                      }
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend 
                      verticalAlign="bottom"
                      formatter={(value, entry: any) => (
                        <span style={{ color: entry.color }}>
                          {value}: {formatCurrency(entry.payload.value)}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Nenhum dado de faturamento disponível</p>
                </div>
              )}
            </div>
            
            {/* Summary below pie chart */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(revenueBreakdown.totalRevenue)}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Lucro (10%)</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(revenueBreakdown.platformProfit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Profissionais (90%)</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(revenueBreakdown.paidToProfessionals)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
