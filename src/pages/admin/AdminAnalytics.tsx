import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnalyticsDashboard } from "@/hooks/useAnalyticsDashboard";
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Users, 
  Eye, 
  FileText, 
  CheckCircle2,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

const PERIOD_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '14', label: 'Últimos 14 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
];

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm p-3 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.name.includes('R$') || entry.name.includes('Receita') || entry.name.includes('Taxa') 
            ? formatCurrency(entry.value) 
            : entry.value}
        </p>
      ))}
    </div>
  );
};

export const AdminAnalytics = () => {
  const [periodDays, setPeriodDays] = useState(30);
  const { data, isLoading, error } = useAnalyticsDashboard(periodDays);

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard Analítico" description="Métricas e análises detalhadas">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  if (!data) return null;

  return (
    <AdminLayout title="Dashboard Analítico" description="Métricas e análises detalhadas">
      {/* Period Selector */}
      <div className="flex justify-end mb-6">
        <Select value={String(periodDays)} onValueChange={(v) => setPeriodDays(Number(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxas Arrecadadas</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totalFees)}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transações</p>
                <p className="text-2xl font-bold">{data.totalTransactions}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(data.averageTransactionValue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10">
                <BarChart3 className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Revenue Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Receita por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueByDay}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis 
                    tickFormatter={(v) => `R$${v}`} 
                    tick={{ fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    name="Receita"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Top Serviços por Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topServices} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis 
                    dataKey="title" 
                    type="category" 
                    width={120} 
                    tick={{ fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + '...' : v}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Receita" radius={[0, 4, 4, 0]}>
                    {data.topServices.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion & User Metrics */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Conversion Funnel */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-blue-500" />
                <span>Visualizações</span>
              </div>
              <span className="font-bold text-lg">{data.conversionMetrics.totalViews}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-yellow-500" />
                <span>Orçamentos Criados</span>
              </div>
              <span className="font-bold text-lg">{data.conversionMetrics.totalQuotes}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Serviços Concluídos</span>
              </div>
              <span className="font-bold text-lg">{data.conversionMetrics.completedQuotes}</span>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-primary/10 text-center">
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-3xl font-bold text-primary">{data.conversionMetrics.conversionRate.toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>

        {/* User Metrics */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Métricas de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-accent">
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">{data.userMetrics.activeUsers}</p>
              </div>
              <div className="p-4 rounded-lg bg-accent">
                <p className="text-sm text-muted-foreground">% Profissionais</p>
                <p className="text-2xl font-bold">{data.userMetrics.professionalRatio.toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10">
                <p className="text-sm text-muted-foreground">Novos (7 dias)</p>
                <p className="text-2xl font-bold text-green-600">{data.userMetrics.newUsers7d}</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10">
                <p className="text-sm text-muted-foreground">Novos (30 dias)</p>
                <p className="text-2xl font-bold text-blue-600">{data.userMetrics.newUsers30d}</p>
              </div>
            </div>

            {/* Top Professionals */}
            <div className="mt-4">
              <h4 className="font-medium mb-3">Top Profissionais</h4>
              <div className="space-y-2">
                {data.topProfessionals.slice(0, 3).map((prof, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{i + 1}º</Badge>
                      <span className="font-medium">{prof.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(prof.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
