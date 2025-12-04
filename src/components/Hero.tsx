import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const Hero = () => {
  return (
    <section className="gradient-hero py-12 md:py-20 lg:py-28">
      <div className="container px-4">
        <div className="mx-auto max-w-3xl text-center space-y-6 md:space-y-8">
          <div className="space-y-3 md:space-y-4">
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Encontre o Profissional
              <span className="block text-primary">Perfeito para Você</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Conectamos você com os melhores prestadores de serviços da sua
              região. Rápido, seguro e confiável.
            </p>
          </div>

          <div className="flex gap-3 items-center justify-center">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 md:h-5 w-4 md:w-5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Que serviço você precisa?"
                  className="pl-10 md:pl-12 h-12 md:h-14 text-sm md:text-base shadow-soft border-2 focus-visible:border-primary transition-smooth"
                />
              </div>
              <Select>
                <SelectTrigger className="w-full sm:w-[200px] h-12 md:h-14 text-sm md:text-base shadow-soft border-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Localização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sp">São Paulo, SP</SelectItem>
                  <SelectItem value="rj">Rio de Janeiro, RJ</SelectItem>
                  <SelectItem value="mg">Belo Horizonte, MG</SelectItem>
                  <SelectItem value="pr">Curitiba, PR</SelectItem>
                  <SelectItem value="rs">Porto Alegre, RS</SelectItem>
                  <SelectItem value="df">Brasília, DF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="lg"
              className="gradient-primary hover:brightness-110 md:h-14 shadow-soft transition-smooth text-sm md:text-base sm:w-auto sm:self-center rounded-full p-5"
            >
              <Search />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-2 px-4">
            <span className="hidden sm:inline text-xs md:text-sm text-muted-foreground">
              Populares:
            </span>
            {[
              "Faxina",
              "Fotógrafo",
              "Mecânico",
              "Encanador",
              "Eletricista",
            ].map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary-hover transition-smooth"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
