import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Award, Gift, TrendingUp, Users, Settings, Plus, Sparkles } from 'lucide-react';
import { useAdminLoyalty } from '@/hooks/useAdminLoyalty';

const AdminLoyalty = () => {
  const { stats, config, topUsers, isLoading, updateConfig, addBonusPoints } = useAdminLoyalty();
  
  const [configForm, setConfigForm] = useState({
    points_per_real: config?.points_per_real || 1,
    min_points_redemption: config?.min_points_redemption || 100,
    point_value_in_reais: config?.point_value_in_reais || 0.01,
    is_active: config?.is_active ?? true
  });
  
  const [bonusDialog, setBonusDialog] = useState(false);
  const [bonusForm, setBonusForm] = useState({
    userId: '',
    points: '',
    description: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Update form when config loads
  useState(() => {
    if (config) {
      setConfigForm({
        points_per_real: config.points_per_real,
        min_points_redemption: config.min_points_redemption,
        point_value_in_reais: config.point_value_in_reais,
        is_active: config.is_active
      });
    }
  });

  const handleSaveConfig = async () => {
    setIsSaving(true);
    await updateConfig(configForm);
    setIsSaving(false);
  };

  const handleAddBonus = async () => {
    if (!bonusForm.userId || !bonusForm.points || !bonusForm.description) return;
    
    setIsSaving(true);
    const success = await addBonusPoints(
      bonusForm.userId,
      Number(bonusForm.points),
      bonusForm.description
    );
    
    if (success) {
      setBonusForm({ userId: '', points: '', description: '' });
      setBonusDialog(false);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Programa de Fidelidade" description="Gerencie o programa de pontos">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Programa de Fidelidade" 
      description="Gerencie o programa de pontos e recompensas"
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Distribuídos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.totalPointsDistributed.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total histórico</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Resgatados</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.totalPointsRedeemed.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Convertidos em desconto</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários com Pontos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsersWithPoints || 0}</div>
            <p className="text-xs text-muted-foreground">Participantes ativos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descontos Ativos</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              R$ {stats?.totalDiscountValue.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalActiveRedemptions || 0} resgates pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações
            </CardTitle>
            <CardDescription>Ajuste as regras do programa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Programa Ativo</Label>
                <p className="text-sm text-muted-foreground">Ativar/desativar acúmulo de pontos</p>
              </div>
              <Switch
                checked={configForm.is_active}
                onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="points_per_real">Pontos por R$ 1</Label>
              <Input
                id="points_per_real"
                type="number"
                min="0"
                step="0.1"
                value={configForm.points_per_real}
                onChange={(e) => setConfigForm(prev => ({ ...prev, points_per_real: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min_points">Mínimo para Resgate</Label>
              <Input
                id="min_points"
                type="number"
                min="1"
                value={configForm.min_points_redemption}
                onChange={(e) => setConfigForm(prev => ({ ...prev, min_points_redemption: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="point_value">Valor do Ponto (R$)</Label>
              <Input
                id="point_value"
                type="number"
                min="0.001"
                step="0.001"
                value={configForm.point_value_in_reais}
                onChange={(e) => setConfigForm(prev => ({ ...prev, point_value_in_reais: Number(e.target.value) }))}
              />
            </div>

            <Button onClick={handleSaveConfig} disabled={isSaving} className="w-full">
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Top Usuários
              </CardTitle>
              <CardDescription>Ranking por pontos acumulados</CardDescription>
            </div>
            <Dialog open={bonusDialog} onOpenChange={setBonusDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Bônus
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Pontos de Bônus</DialogTitle>
                  <DialogDescription>
                    Adicione pontos de bônus para um usuário específico
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>ID do Usuário</Label>
                    <Input
                      placeholder="UUID do usuário"
                      value={bonusForm.userId}
                      onChange={(e) => setBonusForm(prev => ({ ...prev, userId: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade de Pontos</Label>
                    <Input
                      type="number"
                      min="1"
                      value={bonusForm.points}
                      onChange={(e) => setBonusForm(prev => ({ ...prev, points: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      placeholder="Ex: Bônus de boas-vindas"
                      value={bonusForm.description}
                      onChange={(e) => setBonusForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBonusDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddBonus} disabled={isSaving}>
                    {isSaving ? 'Adicionando...' : 'Adicionar Pontos'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {topUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum usuário com pontos ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topUsers.map((user, index) => (
                  <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant={index < 3 ? "default" : "secondary"} className="w-6 h-6 p-0 flex items-center justify-center rounded-full">
                        {index + 1}
                      </Badge>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {user.profile?.full_name || 'Usuário'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.total_points.toLocaleString()} pontos disponíveis
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-600">
                        {user.lifetime_points.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">total</div>
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

export default AdminLoyalty;
