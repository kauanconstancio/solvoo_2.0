import { useState } from "react";
import { 
  Crown, 
  CheckCircle2, 
  Calendar, 
  CreditCard, 
  AlertCircle,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { SubscriptionCheckoutDialog } from "@/components/SubscriptionCheckoutDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) => {
  if (value === 0) return "Grátis";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { subscription, isLoading: isLoadingSub, cancelSubscription, createSubscription, hasActiveSubscription, refetch } = useUserSubscription();
  const { plans, isLoading: isLoadingPlans } = useSubscriptionPlans();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const activePlans = plans.filter(plan => plan.is_active);

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      await cancelSubscription();
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setIsCreating(true);
      setSelectedPlanId(planId);
      
      const result = await createSubscription(planId);
      
      if (result.isFree) {
        // Free plan activated, just refresh
        await refetch();
      } else if (result.pixData) {
        // Show PIX checkout
        setPixData(result.pixData);
        setShowCheckout(true);
      }
    } catch (error) {
      console.error("Error subscribing:", error);
    } finally {
      setIsCreating(false);
      setSelectedPlanId(null);
    }
  };

  const handlePaymentConfirmed = async () => {
    await refetch();
    setPixData(null);
    setShowCheckout(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="font-heading text-3xl font-bold mb-2">Minha Assinatura</h1>
          <p className="text-muted-foreground mb-8">
            Gerencie seu plano e veja os benefícios disponíveis
          </p>

          {/* Current Subscription */}
          {isLoadingSub ? (
            <Card className="mb-8">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ) : hasActiveSubscription && subscription ? (
            <Card className="mb-8 border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <CardTitle>Plano {subscription.plan?.name}</CardTitle>
                  </div>
                  <Badge variant="default" className="bg-primary">
                    Ativo
                  </Badge>
                </div>
                <CardDescription>
                  Sua assinatura está ativa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-medium">
                        {formatCurrency(subscription.plan?.price || 0)}/mês
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Próxima renovação</p>
                      <p className="font-medium">
                        {subscription.expires_at 
                          ? format(new Date(subscription.expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : "Sem data"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                {subscription.plan?.features && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Benefícios inclusos:</p>
                    <ul className="space-y-2">
                      {subscription.plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cancel Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="mt-4">
                      Cancelar assinatura
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Você perderá acesso aos benefícios do plano {subscription.plan?.name}. 
                        A assinatura permanecerá ativa até o final do período pago.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isCancelling ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Confirmar cancelamento
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8 bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Sem assinatura ativa</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Escolha um plano abaixo para desbloquear todos os recursos da plataforma.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Available Plans */}
          <div className="mt-12">
            <h2 className="font-heading text-2xl font-bold mb-6">
              {hasActiveSubscription ? "Trocar de plano" : "Escolha seu plano"}
            </h2>

            {isLoadingPlans ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="flex flex-col">
                    <CardHeader className="text-center pb-2">
                      <Skeleton className="h-6 w-24 mx-auto" />
                      <Skeleton className="h-4 w-32 mx-auto mt-2" />
                      <Skeleton className="h-10 w-20 mx-auto mt-4" />
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                      {[1, 2, 3, 4].map((j) => (
                        <Skeleton key={j} className="h-4 w-full" />
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {activePlans.map((plan) => {
                  const isCurrentPlan = subscription?.plan_id === plan.id;
                  
                  return (
                    <Card
                      key={plan.id}
                      className={`relative flex flex-col ${
                        plan.is_popular ? "border-primary border-2 shadow-xl" : ""
                      } ${isCurrentPlan ? "bg-primary/5" : ""}`}
                    >
                      {plan.is_popular && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-white">
                          Mais Popular
                        </Badge>
                      )}
                      {isCurrentPlan && (
                        <Badge className="absolute -top-3 right-4 bg-green-500 text-white">
                          Plano Atual
                        </Badge>
                      )}
                      <CardHeader className="text-center pb-2">
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="mt-4">
                          <span className="font-heading text-4xl font-bold">
                            {formatCurrency(plan.price)}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-muted-foreground">
                              /{plan.billing_period === "monthly" ? "mês" : "ano"}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-1">
                        <ul className="space-y-3 mb-6 flex-1">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="w-full"
                          variant={isCurrentPlan ? "secondary" : plan.is_popular ? "default" : "outline"}
                          disabled={isCurrentPlan || isCreating}
                          onClick={() => handleSubscribe(plan.id)}
                        >
                          {isCreating && selectedPlanId === plan.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {isCurrentPlan
                            ? "Plano Atual"
                            : plan.price === 0
                            ? "Começar Grátis"
                            : "Assinar Agora"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="font-medium mb-2">Informações importantes</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• A assinatura é renovada automaticamente todo mês</li>
              <li>• Você pode cancelar a qualquer momento</li>
              <li>• Ao cancelar, você mantém acesso até o final do período pago</li>
              <li>• Pagamentos são processados via PIX de forma segura</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Checkout Dialog */}
      <SubscriptionCheckoutDialog
        open={showCheckout}
        onOpenChange={setShowCheckout}
        pixData={pixData}
        isLoading={isCreating}
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      <Footer />
    </div>
  );
};

export default SubscriptionPage;
