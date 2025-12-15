import { AdminLayout } from '@/components/admin/AdminLayout';
import { MetricCard } from '@/components/admin/MetricCard';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Briefcase, Star, Flag, MessageSquare, UserPlus, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const AdminDashboard = () => {
  const { metrics, userGrowth, isLoading } = useAdminMetrics();

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard" description="Visão geral da plataforma">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
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
          icon={<Users className="h-6 w-6 text-primary" />}
          change={`+${metrics?.newUsersToday || 0} hoje`}
          changeType="positive"
        />
        <MetricCard
          title="Profissionais"
          value={metrics?.totalProfessionals || 0}
          icon={<Briefcase className="h-6 w-6 text-primary" />}
        />
        <MetricCard
          title="Clientes"
          value={metrics?.totalClients || 0}
          icon={<UserPlus className="h-6 w-6 text-primary" />}
        />
        <MetricCard
          title="Serviços Ativos"
          value={metrics?.activeServices || 0}
          icon={<FileText className="h-6 w-6 text-primary" />}
          change={`+${metrics?.newServicesToday || 0} hoje`}
          changeType="positive"
        />
        <MetricCard
          title="Total de Avaliações"
          value={metrics?.totalReviews || 0}
          icon={<Star className="h-6 w-6 text-primary" />}
        />
        <MetricCard
          title="Denúncias Pendentes"
          value={metrics?.pendingReports || 0}
          icon={<Flag className="h-6 w-6 text-primary" />}
          changeType={metrics?.pendingReports && metrics.pendingReports > 0 ? 'negative' : 'neutral'}
        />
        <MetricCard
          title="Total de Conversas"
          value={metrics?.totalConversations || 0}
          icon={<MessageSquare className="h-6 w-6 text-primary" />}
        />
        <MetricCard
          title="Serviços Pausados"
          value={metrics?.pausedServices || 0}
          icon={<Briefcase className="h-6 w-6 text-primary" />}
        />
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Usuários (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                    className="text-muted-foreground"
                  />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR');
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    name="Novos usuários"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Profissionais', value: metrics?.totalProfessionals || 0 },
                    { name: 'Clientes', value: metrics?.totalClients || 0 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Quantidade" />
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
