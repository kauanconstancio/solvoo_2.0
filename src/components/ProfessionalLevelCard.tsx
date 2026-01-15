import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp, Star, Sparkles } from 'lucide-react';
import { useProfessionalStats, useProfessionalLevels } from '@/hooks/useProfessionalGamification';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ProfessionalLevelCard() {
  const { stats, nextLevel, isLoading } = useProfessionalStats();
  const { levels } = useProfessionalLevels();

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const currentLevel = stats.current_level || levels[0];
  const progressToNext = nextLevel
    ? Math.min(100, (stats.total_revenue / nextLevel.min_revenue) * 100)
    : 100;

  const revenueToNext = nextLevel
    ? Math.max(0, nextLevel.min_revenue - stats.total_revenue)
    : 0;

  return (
    <Card className="overflow-hidden relative">
      {/* Level gradient background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{ 
          background: `linear-gradient(135deg, ${currentLevel?.color || '#CD7F32'} 0%, transparent 50%)` 
        }}
      />
      
      <CardContent className="p-6 relative">
        <div className="flex items-start gap-4">
          {/* Level badge */}
          <div 
            className="h-16 w-16 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: currentLevel?.color || '#CD7F32' }}
          >
            <Trophy className="h-8 w-8 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold">Nível {currentLevel?.name || 'Bronze'}</h3>
              {currentLevel?.commission_discount ? (
                <Badge variant="secondary" className="text-xs">
                  -{currentLevel.commission_discount}% taxa
                </Badge>
              ) : null}
            </div>
            
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                R$ {stats.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {stats.total_services} serviços
              </span>
            </div>

            {nextLevel && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Próximo nível: {nextLevel.name}
                  </span>
                  <span className="font-medium">
                    {progressToNext.toFixed(0)}%
                  </span>
                </div>
                <Progress value={progressToNext} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Faltam R$ {revenueToNext.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para o próximo nível
                </p>
              </div>
            )}

            {!nextLevel && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Você atingiu o nível máximo!</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <Link to="/conquistas">
            <Button variant="outline" size="sm" className="w-full">
              <Trophy className="h-4 w-4 mr-2" />
              Ver Conquistas e Ranking
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
