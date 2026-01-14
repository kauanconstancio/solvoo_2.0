import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowDownCircle, ArrowUpCircle, Gift, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { useLoyaltyTransactions } from '@/hooks/useLoyalty';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeConfig = {
  earn: {
    icon: ArrowUpCircle,
    label: 'Ganhou',
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-900/20'
  },
  redeem: {
    icon: Gift,
    label: 'Resgatou',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20'
  },
  expire: {
    icon: Clock,
    label: 'Expirou',
    color: 'text-gray-600',
    bg: 'bg-gray-50 dark:bg-gray-900/20'
  },
  bonus: {
    icon: Sparkles,
    label: 'Bônus',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20'
  },
  adjustment: {
    icon: AlertCircle,
    label: 'Ajuste',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20'
  }
};

export const LoyaltyHistory = () => {
  const { transactions, isLoading } = useLoyaltyTransactions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Pontos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma movimentação ainda</p>
            <p className="text-sm">Complete serviços para ganhar pontos!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Pontos</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {transactions.map((tx) => {
              const config = typeConfig[tx.type] || typeConfig.adjustment;
              const Icon = config.icon;
              const isPositive = tx.type === 'earn' || tx.type === 'bonus';
              
              return (
                <div 
                  key={tx.id} 
                  className={`p-4 rounded-lg ${config.bg} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-white dark:bg-gray-800 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{tx.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : '-'}{Math.abs(tx.points).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LoyaltyHistory;
