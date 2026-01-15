import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, Gift, Calendar, CheckCircle2 } from 'lucide-react';
import { useProfessionalGoals, useProfessionalStats } from '@/hooks/useProfessionalGamification';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function GoalProgress() {
  const { goals, isLoading } = useProfessionalGoals();
  const { stats } = useProfessionalStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Metas Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma meta ativa no momento</p>
            <p className="text-sm">Volte em breve para novos desafios!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getGoalProgress = (goal: typeof goals[0]) => {
    if (!stats) return 0;
    
    const goalData = goal.goal;
    if (!goalData) return 0;

    let currentValue = 0;
    switch (goalData.goal_type) {
      case 'total_revenue':
        currentValue = stats.total_revenue;
        break;
      case 'monthly_revenue':
        currentValue = stats.current_month_revenue;
        break;
      case 'total_services':
        currentValue = stats.total_services;
        break;
      case 'monthly_services':
        currentValue = stats.current_month_services;
        break;
      default:
        currentValue = goal.current_value || 0;
    }

    return Math.min(100, (currentValue / goalData.target_value) * 100);
  };

  const getCurrentValue = (goal: typeof goals[0]) => {
    if (!stats) return 0;
    
    const goalData = goal.goal;
    if (!goalData) return 0;

    switch (goalData.goal_type) {
      case 'total_revenue':
        return stats.total_revenue;
      case 'monthly_revenue':
        return stats.current_month_revenue;
      case 'total_services':
        return stats.total_services;
      case 'monthly_services':
        return stats.current_month_services;
      default:
        return goal.current_value || 0;
    }
  };

  const formatValue = (value: number, goalType: string) => {
    if (goalType.includes('revenue')) {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return value.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Metas Ativas
          <Badge variant="secondary" className="ml-2">
            {goals.length} {goals.length === 1 ? 'meta' : 'metas'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map(goal => {
          const goalData = goal.goal;
          if (!goalData) return null;

          const progress = getGoalProgress(goal);
          const currentValue = getCurrentValue(goal);
          const isCompleted = goal.completed_at || progress >= 100;

          return (
            <div
              key={goal.id || goalData.id}
              className={`p-4 rounded-lg border ${
                isCompleted 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                  : 'bg-muted/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {goalData.title}
                  </h4>
                  {goalData.description && (
                    <p className="text-sm text-muted-foreground">{goalData.description}</p>
                  )}
                </div>
                {goalData.reward_value && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    {goalData.reward_value}
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatValue(currentValue, goalData.goal_type)} / {formatValue(goalData.target_value, goalData.goal_type)}
                  </span>
                  <span className="font-medium">{progress.toFixed(0)}%</span>
                </div>
                <Progress 
                  value={progress} 
                  className={`h-2 ${isCompleted ? '[&>div]:bg-green-500' : ''}`}
                />
              </div>

              {goalData.end_date && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Até {format(new Date(goalData.end_date), "dd 'de' MMMM", { locale: ptBR })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
