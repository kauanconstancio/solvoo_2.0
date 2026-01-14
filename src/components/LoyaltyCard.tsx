import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Award, Gift, History, Sparkles, TrendingUp } from 'lucide-react';
import { useUserLoyaltyPoints, useLoyaltyConfig, useLoyaltyRedemptions } from '@/hooks/useLoyalty';
import { useToast } from '@/hooks/use-toast';

export const LoyaltyCard = () => {
  const { points, isLoading: pointsLoading, refetch: refetchPoints } = useUserLoyaltyPoints();
  const { config, isLoading: configLoading } = useLoyaltyConfig();
  const { pendingRedemption, createRedemption, cancelRedemption } = useLoyaltyRedemptions();
  const { toast } = useToast();
  
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const isLoading = pointsLoading || configLoading;
  const totalPoints = points?.total_points || 0;
  const lifetimePoints = points?.lifetime_points || 0;
  const minPoints = config?.min_points_redemption || 100;
  const pointValue = config?.point_value_in_reais || 0.01;

  const canRedeem = totalPoints >= minPoints;
  const maxRedeemable = totalPoints;
  const redeemValue = Number(pointsToRedeem) * pointValue;

  const handleRedeem = async () => {
    const pts = Number(pointsToRedeem);
    if (pts < minPoints) {
      toast({
        title: 'Pontos insuficientes',
        description: `Mínimo de ${minPoints} pontos para resgate`,
        variant: 'destructive'
      });
      return;
    }

    if (pts > totalPoints) {
      toast({
        title: 'Pontos insuficientes',
        description: 'Você não tem pontos suficientes',
        variant: 'destructive'
      });
      return;
    }

    setIsRedeeming(true);
    const result = await createRedemption(pts, pts * pointValue);
    setIsRedeeming(false);
    
    if (result) {
      setIsRedeemOpen(false);
      setPointsToRedeem('');
      refetchPoints();
    }
  };

  const handleCancelPending = async () => {
    if (pendingRedemption) {
      await cancelRedemption(pendingRedemption.id);
      refetchPoints();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
        <div className="flex items-center gap-2 text-white">
          <Award className="h-6 w-6" />
          <span className="font-bold text-lg">Programa de Fidelidade</span>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="grid gap-6">
          {/* Saldo de pontos */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">Seus pontos</span>
            </div>
            <div className="text-4xl font-bold text-amber-600">{totalPoints.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">
              = R$ {(totalPoints * pointValue).toFixed(2)} em descontos
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <div className="font-semibold">{lifetimePoints.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Pontos totais</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Gift className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <div className="font-semibold">R$ {(lifetimePoints * pointValue).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Valor acumulado</div>
            </div>
          </div>

          {/* Resgate pendente */}
          {pendingRedemption && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 mb-2">
                    Desconto disponível
                  </Badge>
                  <div className="font-bold text-green-700 dark:text-green-400">
                    R$ {pendingRedemption.discount_value.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expira em {new Date(pendingRedemption.expires_at).toLocaleString('pt-BR')}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleCancelPending}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Botão de resgate */}
          <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                disabled={!canRedeem || !!pendingRedemption}
              >
                <Gift className="h-4 w-4 mr-2" />
                {pendingRedemption ? 'Você tem um desconto ativo' : 'Resgatar Pontos'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resgatar Pontos</DialogTitle>
                <DialogDescription>
                  Troque seus pontos por desconto. Mínimo: {minPoints} pontos.
                  Cada ponto vale R$ {pointValue.toFixed(2)}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Quantidade de pontos</Label>
                  <Input
                    id="points"
                    type="number"
                    min={minPoints}
                    max={maxRedeemable}
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(e.target.value)}
                    placeholder={`${minPoints} - ${maxRedeemable}`}
                  />
                </div>
                
                <div className="p-4 rounded-lg bg-muted text-center">
                  <div className="text-sm text-muted-foreground">Valor do desconto</div>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {redeemValue.toFixed(2)}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  O desconto ficará disponível por 24 horas para uso em qualquer serviço.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRedeemOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleRedeem} 
                  disabled={isRedeeming || !pointsToRedeem || Number(pointsToRedeem) < minPoints}
                >
                  {isRedeeming ? 'Resgatando...' : 'Confirmar Resgate'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Info */}
          {!canRedeem && !pendingRedemption && (
            <p className="text-sm text-center text-muted-foreground">
              Acumule mais {minPoints - totalPoints} pontos para resgatar
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LoyaltyCard;
