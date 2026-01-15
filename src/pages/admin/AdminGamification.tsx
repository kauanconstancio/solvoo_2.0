import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Users, TrendingUp, Award, Target, BarChart3 } from 'lucide-react';
import { useAdminGamification } from '@/hooks/useAdminGamification';
import { ProfessionalRanking } from '@/components/ProfessionalRanking';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

const AdminGamification = () => {
  const { stats, levels, badges, goals, isLoading } = useAdminGamification();

  if (isLoading) {
    return (
      <AdminLayout title="Gamificação" description="Gerenciar sistema de níveis e conquistas">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gamificação" description="Gerenciar sistema de níveis e conquistas">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalProfessionalsWithStats || 0}</p>
                <p className="text-sm text-muted-foreground">Profissionais Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  R$ {(stats?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Award className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalBadgesAwarded || 0}</p>
                <p className="text-sm text-muted-foreground">Badges Concedidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeGoals || 0}</p>
                <p className="text-sm text-muted-foreground">Metas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Distribution Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Distribuição de Profissionais por Nível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer
              config={
                stats?.levelDistribution.reduce((acc, item) => {
                  acc[item.level] = { label: item.level, color: item.color };
                  return acc;
                }, {} as Record<string, { label: string; color: string }>) || {}
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={stats?.levelDistribution || []} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <XAxis 
                    dataKey="level" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`${value} profissionais`, 'Quantidade']}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[4, 4, 0, 0]}
                  >
                    {(stats?.levelDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Níveis Configurados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {levels.map(level => (
              <div 
                key={level.id} 
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ borderLeftColor: level.color, borderLeftWidth: 4 }}
              >
                <div>
                  <span className="font-medium">{level.name}</span>
                  <p className="text-sm text-muted-foreground">
                    Mín: R$ {level.min_revenue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">-{level.commission_discount}% taxa</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.levelDistribution.find(l => l.level === level.name)?.count || 0} profissionais
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Professionals */}
        <ProfessionalRanking limit={10} />
      </div>

      {/* Badges and Goals */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Badges ({badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {badges.map(badge => (
                <div key={badge.id} className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="font-medium text-sm">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {badge.requirement_type === 'services' 
                      ? `${badge.requirement_value} serviços`
                      : `R$ ${badge.requirement_value}`
                    }
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Metas ({goals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhuma meta configurada</p>
            ) : (
              <div className="space-y-2">
                {goals.slice(0, 5).map(goal => (
                  <div key={goal.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{goal.title}</span>
                      <Badge variant={goal.is_active ? 'default' : 'secondary'}>
                        {goal.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminGamification;
