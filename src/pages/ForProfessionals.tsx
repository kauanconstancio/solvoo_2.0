import {
  CheckCircle2,
  TrendingUp,
  Users,
  Shield,
  Star,
  Zap,
  BarChart3,
  MessageSquare,
  Calendar,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const benefits = [
  {
    icon: Users,
    title: "Milhares de Clientes",
    description:
      "Acesse uma base crescente de clientes ativos buscando serviços todos os dias.",
  },
  {
    icon: TrendingUp,
    title: "Aumente sua Renda",
    description:
      "Profissionais ativos aumentam sua renda em até 40% nos primeiros 3 meses.",
  },
  {
    icon: Shield,
    title: "Pagamentos Seguros",
    description:
      "Receba seus pagamentos de forma segura e garantida pela plataforma.",
  },
  {
    icon: Star,
    title: "Construa Reputação",
    description:
      "Sistema de avaliações que valoriza seu trabalho e atrai mais clientes.",
  },
  {
    icon: Zap,
    title: "Ferramentas Profissionais",
    description:
      "Agenda, chat, orçamentos e relatórios para gerenciar seu negócio.",
  },
  {
    icon: BarChart3,
    title: "Análises Detalhadas",
    description: "Acompanhe métricas de desempenho e otimize seus serviços.",
  },
];

const features = [
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description:
      "Gerencie seus horários e disponibilidade de forma simples e eficiente.",
  },
  {
    icon: MessageSquare,
    title: "Chat Integrado",
    description:
      "Comunique-se diretamente com clientes sem sair da plataforma.",
  },
  {
    icon: Wallet,
    title: "Gestão Financeira",
    description: "Controle seus ganhos, extratos e histórico de pagamentos.",
  },
];

const plans = [
  {
    name: "Básico",
    price: "Grátis",
    description: "Ideal para começar",
    features: [
      "Até 5 anúncios ativos",
      "Perfil básico",
      "Chat com clientes",
      "Suporte por email",
    ],
    popular: false,
  },
  {
    name: "Profissional",
    price: "R$ 49",
    period: "/mês",
    description: "Para profissionais em crescimento",
    features: [
      "Anúncios ilimitados",
      "Perfil verificado",
      "Destaque nas buscas",
      "Análises avançadas",
      "Suporte prioritário",
      "Selo de profissional",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "R$ 99",
    period: "/mês",
    description: "Máxima visibilidade",
    features: [
      "Tudo do Profissional",
      "Posição premium nas buscas",
      "Campanhas promocionais",
      "Gerente de conta dedicado",
      "API para integrações",
      "Relatórios personalizados",
    ],
    popular: false,
  },
];

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Eletricista",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    content:
      "Em 6 meses na Solvoo, dobrei minha carteira de clientes. A plataforma é muito fácil de usar.",
    rating: 5,
  },
  {
    name: "Ana Paula Santos",
    role: "Fotógrafa",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    content:
      "O sistema de agendamento e os pagamentos seguros fizeram toda diferença no meu negócio.",
    rating: 5,
  },
  {
    name: "Roberto Mendes",
    role: "Encanador",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    content:
      "Recebi meu primeiro cliente em menos de uma semana. Recomendo para todos os profissionais!",
    rating: 5,
  },
];

const ForProfessionals = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 gradient-primary text-white">
              Para Profissionais
            </Badge>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Transforme seu talento em um{" "}
              <span className="text-primary">negócio de sucesso</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de profissionais que já estão conquistando
              novos clientes e aumentando sua renda na Solvoo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="text-base md:text-lg px-8">
                  Começar Agora - É Grátis
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-base md:text-lg px-8"
              >
                Ver Planos
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              ✓ Sem taxa de adesão ✓ Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-heading text-3xl md:text-4xl font-bold text-primary">
                50k+
              </p>
              <p className="text-sm md:text-base text-muted-foreground">
                Profissionais Ativos
              </p>
            </div>
            <div>
              <p className="font-heading text-3xl md:text-4xl font-bold text-primary">
                200k+
              </p>
              <p className="text-sm md:text-base text-muted-foreground">
                Serviços Realizados
              </p>
            </div>
            <div>
              <p className="font-heading text-3xl md:text-4xl font-bold text-primary">
                4.8
              </p>
              <p className="text-sm md:text-base text-muted-foreground">
                Avaliação Média
              </p>
            </div>
            <div>
              <p className="font-heading text-3xl md:text-4xl font-bold text-primary">
                R$ 5M+
              </p>
              <p className="text-sm md:text-base text-muted-foreground">
                Pagos aos Profissionais
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Por que escolher a Solvoo?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Oferecemos tudo que você precisa para crescer profissionalmente e
              conquistar mais clientes.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
                Ferramentas poderosas para{" "}
                <span className="text-primary">gerenciar seu negócio</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Nossa plataforma oferece tudo que você precisa para organizar
                sua agenda, comunicar com clientes e acompanhar seus ganhos em
                um só lugar.
              </p>
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl gradient-primary opacity-10 absolute inset-0" />
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=600&fit=crop"
                alt="Profissional trabalhando"
                className="rounded-2xl relative z-10 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Planos para cada fase do seu negócio
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comece gratuitamente e evolua conforme seu negócio cresce.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative flex flex-col ${
                  plan.popular ? "border-primary border-2 shadow-xl" : ""
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-white">
                    Mais Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="font-heading text-4xl font-bold">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground">
                        {plan.period}
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
                    className="w-full hover:bg-primary hover:text-primary-foreground transition-smooth"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.price === "Grátis"
                      ? "Começar Grátis"
                      : "Assinar Agora"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              O que dizem nossos profissionais
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Histórias reais de profissionais que transformaram suas carreiras.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-background">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
              Pronto para começar?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Cadastre-se gratuitamente e comece a receber propostas de clientes
              hoje mesmo.
            </p>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-10">
                Criar Minha Conta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ForProfessionals;
