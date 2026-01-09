import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Briefcase, 
  Star, 
  Flag, 
  MessageSquare, 
  UserPlus, 
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Area,
  AreaChart
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm p-3 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  gradient: string;
}

const MetricCard = ({ title, value, icon, change, changeType, gradient }: MetricCardProps) => {
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute inset-0 opacity-5 ${gradient}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold font-heading tracking-tight">{value.toLocaleString('pt-BR')}</p>
            {change && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                changeType === 'positive' ? 'text-green-500' :
                changeType === 'negative' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {changeType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
                {changeType === 'negative' && <ArrowDownRight className="h-3 w-3" />}
                {change}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${gradient} text-white group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AdminDashboard = () => {
  const { metrics, userGrowth, isLoading } = useAdminMetrics();

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard" description="Visão geral da plataforma">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" description="Visão geral da plataforma">
      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Usuários"
          value={metrics?.totalUsers || 0}
          icon={<Users className="h-5 w-5" />}
          change={`+${metrics?.newUsersToday || 0} hoje`}
          changeType="positive"
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Profissionais"
          value={metrics?.totalProfessionals || 0}
          icon={<Briefcase className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <MetricCard
          title="Clientes"
          value={metrics?.totalClients || 0}
          icon={<UserPlus className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <MetricCard
          title="Serviços Ativos"
          value={metrics?.activeServices || 0}
          icon={<FileText className="h-5 w-5" />}
          change={`+${metrics?.newServicesToday || 0} hoje`}
          changeType="positive"
          gradient="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <MetricCard
          title="Total de Avaliações"
          value={metrics?.totalReviews || 0}
          icon={<Star className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
        <MetricCard
          title="Denúncias Pendentes"
          value={metrics?.pendingReports || 0}
          icon={<Flag className="h-5 w-5" />}
          changeType={metrics?.pendingReports && metrics.pendingReports > 0 ? 'negative' : 'neutral'}
          gradient="bg-gradient-to-br from-red-500 to-red-600"
        />
        <MetricCard
          title="Total de Conversas"
          value={metrics?.totalConversations || 0}
          icon={<MessageSquare className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-cyan-500 to-cyan-600"
        />
        <MetricCard
          title="Serviços Pausados"
          value={metrics?.pausedServices || 0}
          icon={<Briefcase className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-slate-500 to-slate-600"
        />
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold">Crescimento de Usuários</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowth}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                    className="text-muted-foreground"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    className="text-muted-foreground" 
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#colorUsers)"
                    name="Novos usuários"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10">
                <Users className="h-4 w-4 text-purple-500" />
              </div>
              <CardTitle className="text-lg font-semibold">Distribuição de Usuários</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">Por tipo de conta</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Profissionais', value: metrics?.totalProfessionals || 0, fill: 'url(#gradientPro)' },
                    { name: 'Clientes', value: metrics?.totalClients || 0, fill: 'url(#gradientClient)' },
                  ]}
                  layout="vertical"
                >
                  <defs>
                    <linearGradient id="gradientPro" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="gradientClient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" horizontal={false} />
                  <XAxis type="number" className="text-muted-foreground" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" className="text-muted-foreground" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
