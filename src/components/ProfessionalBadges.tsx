import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Rocket, 
  Star, 
  Award, 
  Crown, 
  Coins, 
  Banknote, 
  Gem, 
  Sparkles,
  Lock
} from 'lucide-react';
import { useProfessionalBadges } from '@/hooks/useProfessionalGamification';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  rocket: Rocket,
  star: Star,
  award: Award,
  crown: Crown,
  coins: Coins,
  banknote: Banknote,
  gem: Gem,
  sparkles: Sparkles,
};

interface ProfessionalBadgesProps {
  showUnavailable?: boolean;
}

export function ProfessionalBadges({ showUnavailable = true }: ProfessionalBadgesProps) {
  const { earnedBadges, availableBadges, isLoading } = useProfessionalBadges();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Conquistas
          <Badge variant="secondary" className="ml-2">
            {earnedBadges.length} conquistadas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Earned badges */}
          {earnedBadges.map(award => {
            const IconComponent = iconMap[award.badge?.icon || 'trophy'] || Trophy;
            return (
              <div
                key={award.id}
                className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-700 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-2">
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-sm">{award.badge?.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(award.awarded_at), "dd 'de' MMM", { locale: ptBR })}
                </p>
              </div>
            );
          })}

          {/* Available badges (locked) */}
          {showUnavailable && availableBadges.map(badge => {
            const IconComponent = iconMap[badge.icon] || Trophy;
            return (
              <div
                key={badge.id}
                className="p-4 rounded-lg bg-muted/50 border border-dashed text-center opacity-60"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 relative">
                  <IconComponent className="h-6 w-6 text-muted-foreground" />
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
                <h4 className="font-semibold text-sm text-muted-foreground">{badge.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {badge.requirement_type === 'services' 
                    ? `${badge.requirement_value} serviços`
                    : badge.requirement_type === 'revenue'
                    ? `R$ ${badge.requirement_value.toLocaleString('pt-BR')}`
                    : badge.description
                  }
                </p>
              </div>
            );
          })}
        </div>

        {earnedBadges.length === 0 && availableBadges.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma conquista disponível</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
