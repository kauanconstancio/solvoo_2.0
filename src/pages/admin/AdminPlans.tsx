import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Star, 
  CheckCircle2, 
  DollarSign,
  Package,
  X,
  GripVertical
} from 'lucide-react';
import { useSubscriptionPlans, SubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { toast } from 'sonner';

const AdminPlans = () => {
  const { plans, isLoading, createPlan, updatePlan, deletePlan } = useSubscriptionPlans();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    features: [''],
    is_active: true,
    is_popular: false,
    display_order: 0,
    max_services: null as number | null,
    billing_period: 'monthly',
    currency: 'BRL',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      features: [''],
      is_active: true,
      is_popular: false,
      display_order: plans.length + 1,
      max_services: null,
      billing_period: 'monthly',
      currency: 'BRL',
    });
    setSelectedPlan(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price: plan.price,
      features: plan.features.length > 0 ? plan.features : [''],
      is_active: plan.is_active,
      is_popular: plan.is_popular,
      display_order: plan.display_order,
      max_services: plan.max_services,
      billing_period: plan.billing_period,
      currency: plan.currency,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Nome e slug são obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedFeatures = formData.features.filter(f => f.trim() !== '');
      const planData = {
        ...formData,
        features: cleanedFeatures,
      };

      if (selectedPlan) {
        await updatePlan(selectedPlan.id, planData);
        toast.success('Plano atualizado com sucesso');
      } else {
        await createPlan(planData);
        toast.success('Plano criado com sucesso');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar plano');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;

    setIsSubmitting(true);
    try {
      await deletePlan(selectedPlan.id);
      toast.success('Plano excluído com sucesso');
      setIsDeleteDialogOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      toast.error('Erro ao excluir plano');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <AdminLayout title="Gerenciar Planos" description="Configure os planos de assinatura da plataforma">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Plano
          </Button>
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-20" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(j => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map(plan => (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.is_popular ? 'border-primary border-2 shadow-lg' : ''
                } ${!plan.is_active ? 'opacity-60' : ''}`}
              >
                {plan.is_popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-white gap-1">
                    <Star className="h-3 w-3" />
                    Mais Popular
                  </Badge>
                )}
                
                {!plan.is_active && (
                  <Badge variant="secondary" className="absolute -top-3 right-4">
                    Inativo
                  </Badge>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {plan.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(plan)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(plan)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="font-heading text-4xl font-bold">
                      {plan.price === 0 ? 'Grátis' : formatCurrency(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">
                        /{plan.billing_period === 'monthly' ? 'mês' : 'ano'}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.max_services && (
                    <p className="mt-4 text-xs text-muted-foreground">
                      Limite: {plan.max_services} serviços
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPlan ? 'Editar Plano' : 'Criar Novo Plano'}
              </DialogTitle>
              <DialogDescription>
                {selectedPlan
                  ? 'Atualize as informações do plano'
                  : 'Configure um novo plano de assinatura'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Profissional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      }))
                    }
                    placeholder="Ex: profissional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o plano brevemente"
                  rows={2}
                />
              </div>

              {/* Pricing */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                      }
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_period">Período</Label>
                  <select
                    id="billing_period"
                    value={formData.billing_period}
                    onChange={e => setFormData(prev => ({ ...prev, billing_period: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_services">Limite de Serviços</Label>
                  <Input
                    id="max_services"
                    type="number"
                    min="0"
                    value={formData.max_services || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        max_services: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Recursos do Plano</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex items-center text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <Input
                        value={feature}
                        onChange={e => updateFeature(index, e.target.value)}
                        placeholder="Ex: Anúncios ilimitados"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(index)}
                        disabled={formData.features.length === 1}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Plano Ativo</Label>
                    <p className="text-xs text-muted-foreground">
                      Planos inativos não aparecem para novos usuários
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, is_active: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Destacar como Popular</Label>
                    <p className="text-xs text-muted-foreground">
                      Adiciona badge "Mais Popular" ao plano
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_popular}
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, is_popular: checked }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))
                    }
                    className="w-24"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : selectedPlan ? 'Salvar Alterações' : 'Criar Plano'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o plano "{selectedPlan?.name}"? Esta ação não pode
                ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPlans;
