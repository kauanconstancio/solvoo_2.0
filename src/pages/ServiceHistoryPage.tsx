import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useServiceHistory } from "@/hooks/useServiceHistory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, CheckCircle2, Clock, XCircle, Star, ArrowRight, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ServiceHistoryPage = () => {
  const { history, isLoading, error } = useServiceHistory();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Concluído</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">Histórico de Serviços</h1>
              </div>
              <p className="text-muted-foreground mt-2">
                Veja todos os serviços que você contratou
              </p>
            </div>
          </div>

          {/* Empty State */}
          {history.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Package className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhum serviço contratado</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  Você ainda não contratou nenhum serviço. Explore nossa plataforma para encontrar profissionais.
                </p>
                <Button onClick={() => navigate("/busca")}>
                  Explorar Serviços
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Service Image or Avatar */}
                      <div className="flex-shrink-0">
                        {item.service?.images?.[0] ? (
                          <img 
                            src={item.service.images[0]} 
                            alt={item.service_title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <Avatar className="h-20 w-20 rounded-lg">
                            <AvatarImage src={item.professional?.avatar_url || ''} />
                            <AvatarFallback className="rounded-lg text-lg">
                              {item.professional?.full_name?.charAt(0) || 'P'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg truncate">{item.service_title}</h3>
                            <p className="text-sm text-muted-foreground">
                              por {item.professional?.full_name || 'Profissional'}
                            </p>
                            {item.service_category && (
                              <Badge variant="outline" className="mt-1">{item.service_category}</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(item.amount_paid)}
                            </p>
                            {getStatusBadge(item.status)}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(item.completed_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                          {item.service_id && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate(`/servico/${item.service_id}`)}
                            >
                              Ver Serviço
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
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

export default ServiceHistoryPage;
