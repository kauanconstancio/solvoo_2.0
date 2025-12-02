import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="gradient-hero py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight">
              Encontre o Profissional
              <span className="block text-primary">Perfeito para Você</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Conectamos você com os melhores prestadores de serviços da sua região. 
              Rápido, seguro e confiável.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Qual serviço você precisa? Ex: Encanador, Fotógrafo..." 
                className="pl-12 h-14 text-base shadow-soft border-2 focus-visible:border-primary transition-smooth"
              />
            </div>
            <Button size="lg" className="gradient-primary hover:brightness-110 h-14 px-8 shadow-soft transition-smooth">
              Buscar
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
            <span>Populares:</span>
            {["Faxina", "Fotógrafo", "Mecânico", "Encanador", "Eletricista"].map((tag) => (
              <button
                key={tag}
                className="px-3 py-1 rounded-full bg-secondary hover:bg-secondary-hover transition-smooth"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
