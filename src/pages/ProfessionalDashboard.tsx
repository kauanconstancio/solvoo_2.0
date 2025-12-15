import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Heart,
  MessageSquare,
  Star,
  TrendingUp,
  Package,
  Loader2,
  ArrowUpRight,
  ArrowRight,
  BarChart3,
  Users,
  Zap,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useProfessionalMetrics } from "@/hooks/useProfessionalMetrics";
import { getServiceLabel } from "@/data/services";

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  const { metrics, serviceMetrics, isLoading, error } = useProfessionalMetrics();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gradient-hero">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando métricas...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gradient-hero">
          <Card className="max-w-md">
            <CardContent className="py-8 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Erro ao carregar</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {error || "Não foi possível carregar suas métricas."}
              </p>
              <Button onClick={() => navigate("/anunciar")}>
                Ir para Meus Anúncios
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate conversion rate
  const conversionRate = metrics.total_views > 0
    ? ((metrics.total_conversations / metrics.total_views) * 100).toFixed(1)
    : "0";

  // Prepare bar chart data
  const serviceChartData = serviceMetrics
    .slice(0, 5)
    .map(s => ({
      name: s.title.length > 15 ? s.title.slice(0, 15) + "..." : s.title,
      visualizações: s.views_count,
      contatos: s.conversations_count,
    }));

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <Header />

      <main className="flex-1 py-6 md:py-10">
        <div className="container px-4 md:px-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Acompanhe o desempenho dos seus serviços
              </p>
            </div>
            <Button onClick={() => navigate("/anunciar")} className="w-fit">
              <Package className="h-4 w-4 mr-2" />
              Gerenciar Anúncios
            </Button>
          </div>

          {/* Empty State */}
          {metrics.total_services === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Você ainda não tem serviços
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  Crie seu primeiro anúncio para começar a acompanhar suas métricas e desempenho.
                </p>
                <Button onClick={() => navigate("/anunciar")}>
                  Criar Primeiro Anúncio
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="hover:shadow-soft transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Total
                      </Badge>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold">{metrics.total_views.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Visualizações</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-soft transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      {metrics.recent_conversations > 0 && (
                        <Badge className="text-xs bg-green-500">
                          +{metrics.recent_conversations} esta semana
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl md:text-3xl font-bold">{metrics.total_conversations}</p>
                    <p className="text-sm text-muted-foreground">Contatos</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-soft transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-red-500" />
                      </div>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold">{metrics.total_favorites}</p>
                    <p className="text-sm text-muted-foreground">Favoritos</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-soft transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-500" />
                      </div>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold">
                      {metrics.average_rating > 0 ? metrics.average_rating : "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Avaliação ({metrics.total_reviews} reviews)
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Views Trend Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Tendência de Visualizações
                    </CardTitle>
                    <CardDescription>Últimos 7 dias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics.views_trend}>
                          <defs>
                            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="date" 
                            className="text-xs" 
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis 
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
                            allowDecimals={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="views"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#viewsGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Conversion Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Taxa de Conversão
                    </CardTitle>
                    <CardDescription>Visualizações → Contatos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center py-4">
                      <p className="text-5xl font-bold text-primary">{conversionRate}%</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        dos visitantes entram em contato
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Visualizações</span>
                        <span className="font-medium">{metrics.total_views}</span>
                      </div>
                      <Progress value={100} className="h-2" />

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Contatos</span>
                        <span className="font-medium">{metrics.total_conversations}</span>
                      </div>
                      <Progress 
                        value={metrics.total_views > 0 ? (metrics.total_conversations / metrics.total_views) * 100 : 0} 
                        className="h-2" 
                      />

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Avaliações</span>
                        <span className="font-medium">{metrics.total_reviews}</span>
                      </div>
                      <Progress 
                        value={metrics.total_conversations > 0 ? (metrics.total_reviews / metrics.total_conversations) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Services Performance */}
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Desempenho por Serviço
                      </CardTitle>
                      <CardDescription>
                        {metrics.active_services} de {metrics.total_services} serviços ativos
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {serviceChartData.length > 0 && (
                    <div className="h-[250px] mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={serviceChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                          <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={100}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar dataKey="visualizações" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="contatos" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Services List */}
                  <div className="space-y-3">
                    {serviceMetrics.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/servico/${service.id}`)}
                      >
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {service.images?.[0] ? (
                            <img
                              src={service.images[0]}
                              alt={service.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/10" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                              {service.title}
                            </h4>
                            <Badge 
                              variant={service.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs flex-shrink-0"
                            >
                              {service.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {getServiceLabel(service.category)}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{service.views_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{service.conversations_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            <span>{service.favorites_count}</span>
                          </div>
                          {service.average_rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{service.average_rating}</span>
                            </div>
                          )}
                        </div>

                        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Dicas para melhorar seu desempenho</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Adicione fotos de alta qualidade aos seus serviços</li>
                        <li>• Responda rapidamente às mensagens dos clientes</li>
                        <li>• Mantenha descrições detalhadas e atualizadas</li>
                        <li>• Peça avaliações aos clientes satisfeitos</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfessionalDashboard;
