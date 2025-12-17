import {
  Search,
  UserCheck,
  MessageSquare,
  Star,
  Shield,
  Clock,
  CreditCard,
  Headphones,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";
import { AnimatedCounter, formatLargeNumber } from "@/components/AnimatedCounter";
import { ParallaxHero } from "@/components/ParallaxHero";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Busque o serviço",
    description:
      "Digite o serviço que você precisa na barra de busca ou navegue pelas categorias disponíveis.",
    color: "bg-blue-500",
  },
  {
    number: "02",
    icon: UserCheck,
    title: "Escolha o profissional",
    description:
      "Compare avaliações, preços, portfólio e localização. Encontre o profissional ideal para você.",
    color: "bg-green-500",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Entre em contato",
    description:
      "Converse diretamente com o profissional, tire suas dúvidas e agende o serviço.",
    color: "bg-purple-500",
  },
  {
    number: "04",
    icon: Star,
    title: "Avalie o serviço",
    description:
      "Após a conclusão, avalie o profissional e ajude outros usuários na escolha.",
    color: "bg-amber-500",
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Profissionais Verificados",
    description:
      "Todos os profissionais passam por um processo de verificação de identidade e qualificação.",
  },
  {
    icon: Clock,
    title: "Agilidade",
    description:
      "Encontre profissionais disponíveis na sua região em poucos minutos.",
  },
  {
    icon: CreditCard,
    title: "Pagamento Seguro",
    description:
      "Pague pelo serviço de forma segura através da nossa plataforma com diversas opções.",
  },
  {
    icon: Headphones,
    title: "Suporte 24/7",
    description:
      "Nossa equipe está sempre disponível para ajudar você em qualquer etapa.",
  },
];

const faqs = [
  {
    question: "Como funciona a contratação de um profissional?",
    answer:
      "Basta buscar pelo serviço desejado, comparar os profissionais disponíveis, entrar em contato para alinhar detalhes e agendar o serviço. Todo o processo é feito pela plataforma de forma segura.",
  },
  {
    question: "Os profissionais são verificados?",
    answer:
      "Sim! Todos os profissionais passam por um processo de verificação que inclui validação de documentos, checagem de antecedentes e confirmação de qualificações profissionais.",
  },
  {
    question: "Posso cancelar um serviço agendado?",
    answer:
      "Sim, você pode cancelar um serviço agendado até 24 horas antes sem custo. Cancelamentos com menos de 24 horas podem ter uma taxa, dependendo da política do profissional.",
  },
  {
    question: "Como funciona o pagamento?",
    answer:
      "Oferecemos diversas formas de pagamento: cartão de crédito, débito, PIX e boleto. O pagamento é processado de forma segura e o profissional só recebe após a confirmação do serviço.",
  },
  {
    question: "O que fazer se tiver problemas com o serviço?",
    answer:
      "Entre em contato com nosso suporte através do chat ou WhatsApp. Analisaremos o caso e, se necessário, intermediaremos a solução junto ao profissional, podendo incluir reembolso.",
  },
  {
    question: "Preciso pagar para usar a plataforma?",
    answer:
      "Não! A plataforma é totalmente gratuita para clientes. Você só paga pelo serviço contratado diretamente ao profissional, sem taxas adicionais.",
  },
];

const HowItWorks = () => {
  const { metrics, isLoading } = usePlatformMetrics();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <ParallaxHero className="py-12 md:py-16 lg:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto space-y-4 md:space-y-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold tracking-tight">
                Como <span className="text-primary">Funciona</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Contratar um profissional qualificado nunca foi tão fácil. Veja
                como funciona nossa plataforma em 4 passos simples.
              </p>
            </div>
          </div>
        </ParallaxHero>

        {/* Steps Section */}
        <section className="py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-4 mb-2">
                        <div
                          className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center text-white`}
                        >
                          <step.icon className="h-6 w-6" />
                        </div>
                        <span className="text-4xl font-bold text-muted-foreground/30">
                          {step.number}
                        </span>
                      </div>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-4">
                Por que usar o Solvoo?
              </h2>
              <p className="text-muted-foreground">
                Confira as vantagens de contratar serviços pela nossa plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.icon className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works for professionals */}
        <section className="py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold">
                  Você é <span className="text-primary">profissional</span>?
                </h2>
                <p className="text-muted-foreground text-base md:text-lg">
                  Cadastre-se gratuitamente e comece a receber novos clientes
                  ainda hoje. Milhares de pessoas estão buscando serviços como o
                  seu na sua região.
                </p>
                <ul className="space-y-3">
                  {[
                    "Cadastro gratuito e sem mensalidade",
                    "Perfil profissional completo",
                    "Alcance milhares de clientes",
                    "Receba avaliações e destaque-se",
                    "Gerencie sua agenda pela plataforma",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="mt-4" asChild>
                  <a href="/para-profissionais">
                    Saiba mais
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 md:p-12">
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-background rounded-xl p-4 md:p-6 text-center shadow-sm">
                    <p className="text-2xl md:text-3xl font-bold text-primary">
                      <AnimatedCounter
                        value={formatLargeNumber(metrics.totalProfessionals).displayValue}
                        suffix={formatLargeNumber(metrics.totalProfessionals).suffix}
                        isLoading={isLoading}
                      />
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      Profissionais
                    </p>
                  </div>
                  <div className="bg-background rounded-xl p-4 md:p-6 text-center shadow-sm">
                    <p className="text-2xl md:text-3xl font-bold text-primary">
                      <AnimatedCounter
                        value={formatLargeNumber(metrics.totalServices).displayValue}
                        suffix={formatLargeNumber(metrics.totalServices).suffix}
                        isLoading={isLoading}
                      />
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      Serviços
                    </p>
                  </div>
                  <div className="bg-background rounded-xl p-4 md:p-6 text-center shadow-sm">
                    <p className="text-2xl md:text-3xl font-bold text-primary">
                      <AnimatedCounter
                        value={metrics.averageRating}
                        decimals={1}
                        isLoading={isLoading}
                      />
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      Avaliação Média
                    </p>
                  </div>
                  <div className="bg-background rounded-xl p-4 md:p-6 text-center shadow-sm">
                    <p className="text-2xl md:text-3xl font-bold text-primary">
                      <AnimatedCounter
                        value={formatLargeNumber(metrics.totalConversations).displayValue}
                        suffix={formatLargeNumber(metrics.totalConversations).suffix}
                        isLoading={isLoading}
                      />
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      Contatos
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-4">
                Perguntas Frequentes
              </h2>
              <p className="text-muted-foreground">
                Tire suas dúvidas sobre como usar nossa plataforma.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-background rounded-lg px-6 border"
                  >
                    <AccordionTrigger className="text-left hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 lg:py-20 gradient-primary text-primary-foreground">
          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold">
                Pronto para começar?
              </h2>
              <p className="text-primary-foreground/80 text-base md:text-lg">
                Encontre o profissional ideal ou comece a oferecer seus serviços
                ainda hoje.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="hover:bg-secondary/90"
                  asChild
                >
                  <a href="/categorias">Buscar Serviços</a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <a href="/para-profissionais">Sou Profissional</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
