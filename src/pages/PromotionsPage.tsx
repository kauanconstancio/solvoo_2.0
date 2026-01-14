import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useServicePromotions } from "@/hooks/useServicePromotions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tag, Trash2, Calendar, Package, Edit, XCircle, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PromotionsPage = () => {
  const navigate = useNavigate();
  const { promotions, isLoading, updatePromotion, deletePromotion } = useServicePromotions();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleActive = async (id: string, currentActive: boolean) => {
    await updatePromotion(id, { is_active: !currentActive });
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
                <h1 className="text-2xl md:text-3xl font-bold">Minhas Promoções</h1>
              </div>
              <p className="text-muted-foreground mt-2">
                Visualize e gerencie as promoções dos seus serviços
              </p>
            </div>

            <Button onClick={() => navigate("/anunciar")}>
              <Package className="h-4 w-4 mr-2" />
              Gerenciar Anúncios
            </Button>
          </div>

          {/* Info Alert */}
          <Alert className="mb-6 border-primary/30 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Dica</AlertTitle>
            <AlertDescription>
              Para criar ou editar promoções, acesse o anúncio do serviço e ative o desconto na seção de preço.
            </AlertDescription>
          </Alert>

          {/* Empty State */}
          {promotions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Tag className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhuma promoção ativa</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  Adicione descontos promocionais nos seus anúncios para atrair mais clientes.
                </p>
                <Button onClick={() => navigate("/anunciar")}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Ir para Meus Anúncios
                </Button>
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
                        Até {format(new Date(promo.ends_at), "dd/MM/yyyy", { locale: ptBR })}
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        asChild
                      >
                        <Link to={`/editar-servico/${promo.service_id}`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar Anúncio
                        </Link>
                      </Button>
                      {!isExpired(promo.ends_at) && (
                        <Button 
                          variant="outline" 
                          size="sm"
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
