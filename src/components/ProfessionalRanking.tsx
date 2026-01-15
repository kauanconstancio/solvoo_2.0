import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, TrendingUp } from 'lucide-react';
import { useProfessionalRanking } from '@/hooks/useProfessionalGamification';

interface ProfessionalRankingProps {
  limit?: number;
  showTitle?: boolean;
}

export function ProfessionalRanking({ limit = 10, showTitle = true }: ProfessionalRankingProps) {
  const { ranking, isLoading } = useProfessionalRanking(limit);

  if (isLoading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (ranking.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Ranking
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum profissional no ranking</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return (
          <span className="h-5 w-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
            {position}
          </span>
        );
    }
  };

  const getPositionBg = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/40 dark:to-gray-700/40 border-gray-200 dark:border-gray-600';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700';
      default:
        return 'bg-muted/30';
    }
  };

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Ranking de Profissionais
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        {ranking.map((professional, index) => (
          <div
            key={professional.user_id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${getPositionBg(index + 1)}`}
          >
            <div className="w-8 flex items-center justify-center">
              {getPositionIcon(index + 1)}
            </div>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={professional.avatar_url || undefined} />
              <AvatarFallback
                style={{ backgroundColor: professional.level_color }}
                className="text-white text-sm"
              >
                {professional.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{professional.full_name}</span>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: professional.level_color,
                    color: professional.level_color
                  }}
                >
                  {professional.level_name}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  R$ {professional.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span>{professional.total_services} serviços</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
