import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useServicePromotions } from "@/hooks/useServicePromotions";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tag, Plus, Trash2, Percent, Calendar, Package, Loader2, Edit, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface UserService {
  id: string;
  title: string;
  price: string;
  images: string[] | null;
  category: string;
}

const PromotionsPage = () => {
  const navigate = useNavigate();
  const { promotions, isLoading, createPromotion, updatePromotion, deletePromotion } = useServicePromotions();
  const [services, setServices] = useState<UserService[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [promotionalPrice, setPromotionalPrice] = useState("");
  const [endsAt, setEndsAt] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchUserServices();
  }, []);

  const fetchUserServices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('services')
      .select('id, title, price, images, category')
      .eq('user_id', user.id)
      .eq('status', 'active');

    setServices(data || []);
  };

  const handleCreate = async () => {
    const service = services.find(s => s.id === selectedServiceId);
    if (!service || !promotionalPrice || !endsAt) {
      toast.error('Preencha todos os campos');
      return;
    }

    const originalPrice = parseFloat(service.price.replace(/[^\d,]/g, '').replace(',', '.'));
    const promoPrice = parseFloat(promotionalPrice.replace(/[^\d,]/g, '').replace(',', '.'));
    
    if (promoPrice >= originalPrice) {
      toast.error('O preço promocional deve ser menor que o original');
      return;
    }

    const discountPercentage = ((originalPrice - promoPrice) / originalPrice) * 100;

    setIsSubmitting(true);
    const success = await createPromotion({
      service_id: selectedServiceId,
      original_price: service.price,
      promotional_price: `R$ ${promoPrice.toFixed(2).replace('.', ',')}`,
      discount_percentage: discountPercentage,
      ends_at: new Date(endsAt).toISOString()
    });

    if (success) {
      setIsDialogOpen(false);
      setSelectedServiceId("");
      setPromotionalPrice("");
      setEndsAt("");
    }
    setIsSubmitting(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await updatePromotion(id, { is_active: !currentActive });
  };

  const formatCurrency = (value: string) => {
    return value.startsWith('R$') ? value : `R$ ${value}`;
  };

  const isExpired = (endsAt: string) => {
    return new Date(endsAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-hero">
        <Header />
        <main className="flex-1 py-6 md:py-10">
          <div className="container px-4 md:px-6">
            <div className="mb-8">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full mb-4" />
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <Header />

      <main className="flex-1 py-6 md:py-10">
        <div className="container px-4 md:px-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">Promoções</h1>
              </div>
              <p className="text-muted-foreground mt-2">
                Crie promoções temporárias para atrair mais clientes
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={services.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Promoção
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Criar Promoção
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Serviço</Label>
                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.title} - {service.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Preço Promocional</Label>
                    <Input
                      placeholder="Ex: 150,00"
                      value={promotionalPrice}
                      onChange={(e) => setPromotionalPrice(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Término</Label>
                    <Input
                      type="datetime-local"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Promoção
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Empty State */}
          {promotions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Tag className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhuma promoção ativa</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  {services.length === 0 
                    ? "Você precisa ter serviços ativos para criar promoções."
                    : "Crie sua primeira promoção para atrair mais clientes."}
                </p>
                {services.length === 0 ? (
                  <Button onClick={() => navigate("/anunciar")}>
                    <Package className="h-4 w-4 mr-2" />
                    Criar Serviço
                  </Button>
                ) : (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Promoção
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {promotions.map((promo) => (
                <Card key={promo.id} className={`relative overflow-hidden ${!promo.is_active || isExpired(promo.ends_at) ? 'opacity-60' : ''}`}>
                  {/* Discount Badge */}
                  {promo.discount_percentage && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-red-500 text-white">
                        -{Math.round(promo.discount_percentage)}%
                      </Badge>
                    </div>
                  )}

                  {/* Service Image */}
                  {promo.service?.images?.[0] && (
                    <div className="h-32 overflow-hidden">
                      <img 
                        src={promo.service.images[0]} 
                        alt={promo.service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{promo.service?.title || 'Serviço'}</h3>
                    <Badge variant="outline" className="mt-1">{promo.service?.category}</Badge>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground line-through">{promo.original_price}</span>
                      <span className="text-lg font-bold text-primary">{promo.promotional_price}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Até {format(new Date(promo.ends_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="mt-3">
                      {isExpired(promo.ends_at) ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" /> Expirada
                        </Badge>
                      ) : promo.is_active ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Ativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Pausada
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      {!isExpired(promo.ends_at) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => toggleActive(promo.id, promo.is_active)}
                        >
                          {promo.is_active ? 'Pausar' : 'Ativar'}
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover promoção?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. A promoção será removida permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePromotion(promo.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PromotionsPage;
