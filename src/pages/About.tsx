import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Users, Target, Heart, Award } from "lucide-react";
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";
import { AnimatedCounter, formatLargeNumber } from "@/components/AnimatedCounter";

const About = () => {
  const { metrics, isLoading } = usePlatformMetrics();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-heading font-bold mb-6">
                Sobre a Solvoo
              </h1>
              <p className="text-lg text-muted-foreground">
                Conectamos pessoas aos melhores profissionais, facilitando a vida de quem precisa de serviços de qualidade.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
                  Nossa Missão
                </h2>
                <p className="text-muted-foreground mb-4">
                  A Solvoo nasceu com o objetivo de revolucionar a forma como as pessoas encontram e contratam serviços. Acreditamos que todo profissional merece visibilidade e que todo cliente merece encontrar o serviço ideal.
                </p>
                <p className="text-muted-foreground">
                  Nossa plataforma conecta milhares de profissionais qualificados a clientes que buscam serviços de qualidade, criando uma comunidade baseada em confiança e excelência.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card p-6 rounded-xl border">
                  <Users className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">
                    <AnimatedCounter
                      value={formatLargeNumber(metrics.totalProfessionals).displayValue}
                      suffix={formatLargeNumber(metrics.totalProfessionals).suffix}
                      isLoading={isLoading}
                    />
                  </h3>
                  <p className="text-sm text-muted-foreground">Profissionais</p>
                </div>
                <div className="bg-card p-6 rounded-xl border">
                  <Target className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">
                    <AnimatedCounter
                      value={formatLargeNumber(metrics.totalServices).displayValue}
                      suffix={formatLargeNumber(metrics.totalServices).suffix}
                      isLoading={isLoading}
                    />
                  </h3>
                  <p className="text-sm text-muted-foreground">Serviços</p>
                </div>
                <div className="bg-card p-6 rounded-xl border">
                  <Heart className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">
                    <AnimatedCounter
                      value={formatLargeNumber(metrics.totalUsers).displayValue}
                      suffix={formatLargeNumber(metrics.totalUsers).suffix}
                      isLoading={isLoading}
                    />
                  </h3>
                  <p className="text-sm text-muted-foreground">Usuários</p>
                </div>
                <div className="bg-card p-6 rounded-xl border">
                  <Award className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">
                    <AnimatedCounter
                      value={metrics.averageRating}
                      suffix="/5"
                      decimals={1}
                      isLoading={isLoading}
                    />
                  </h3>
                  <p className="text-sm text-muted-foreground">Avaliação</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container px-4">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-12">
              Nossos Valores
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Confiança</h3>
                <p className="text-sm text-muted-foreground">
                  Construímos relações baseadas em transparência e honestidade entre profissionais e clientes.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Qualidade</h3>
                <p className="text-sm text-muted-foreground">
                  Buscamos sempre os melhores profissionais e garantimos a satisfação dos nossos clientes.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Comunidade</h3>
                <p className="text-sm text-muted-foreground">
                  Acreditamos no poder da comunidade para transformar o mercado de serviços.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
