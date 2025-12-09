import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import { Search, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dados de exemplo - futuramente virão do banco de dados
const allServices = [
  {
    id: 1,
    title: "Limpeza Residencial Completa",
    provider: "Maria Silva",
    location: "São Paulo, SP",
    rating: 4.9,
    reviews: 127,
    price: "R$ 150",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
    category: "limpeza",
    verified: true,
  },
  {
    id: 2,
    title: "Fotografia Profissional",
    provider: "João Santos",
    location: "Rio de Janeiro, RJ",
    rating: 4.8,
    reviews: 89,
    price: "R$ 300",
    image: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=400",
    category: "fotografia",
    verified: true,
  },
  {
    id: 3,
    title: "Mecânico Automotivo",
    provider: "Carlos Oliveira",
    location: "Belo Horizonte, MG",
    rating: 4.7,
    reviews: 156,
    price: "R$ 200",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400",
    category: "mecanica",
    verified: false,
  },
  {
    id: 4,
    title: "Encanador 24h",
    provider: "Pedro Costa",
    location: "Curitiba, PR",
    rating: 4.6,
    reviews: 78,
    price: "R$ 180",
    image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400",
    category: "encanador",
    verified: true,
  },
  {
    id: 5,
    title: "Eletricista Residencial",
    provider: "Ana Paula",
    location: "Porto Alegre, RS",
    rating: 4.9,
    reviews: 203,
    price: "R$ 160",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400",
    category: "eletricista",
    verified: true,
  },
  {
    id: 6,
    title: "Pintura de Interiores",
    provider: "Roberto Lima",
    location: "Brasília, DF",
    rating: 4.5,
    reviews: 64,
    price: "R$ 250",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400",
    category: "pintura",
    verified: false,
  },
  {
    id: 7,
    title: "Suporte Técnico em TI",
    provider: "Lucas Tech",
    location: "São Paulo, SP",
    rating: 4.8,
    reviews: 112,
    price: "R$ 120",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400",
    category: "ti",
    verified: true,
  },
  {
    id: 8,
    title: "Mudanças e Fretes",
    provider: "Transportes Express",
    location: "Rio de Janeiro, RJ",
    rating: 4.4,
    reviews: 95,
    price: "R$ 400",
    image: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400",
    category: "mudancas",
    verified: true,
  },
];

const cityLabels: Record<string, string> = {
  sp: "São Paulo, SP",
  rj: "Rio de Janeiro, RJ",
  mg: "Belo Horizonte, MG",
  pr: "Curitiba, PR",
  rs: "Porto Alegre, RS",
  df: "Brasília, DF",
};

const serviceLabels: Record<string, string> = {
  limpeza: "Limpeza",
  fotografia: "Fotografia",
  mecanica: "Mecânica",
  encanador: "Encanador",
  eletricista: "Eletricista",
  pintura: "Pintura",
  ti: "TI & Suporte",
  mudancas: "Mudanças",
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const serviceQuery = searchParams.get("servico") || "";
  const cityQuery = searchParams.get("cidade") || "";

  // Filtrar serviços baseado nos parâmetros de busca
  const filteredServices = allServices.filter((service) => {
    const matchesService = serviceQuery
      ? service.category.toLowerCase() === serviceQuery.toLowerCase()
      : true;
    const matchesCity = cityQuery
      ? service.location.toLowerCase().includes(cityLabels[cityQuery]?.toLowerCase() || cityQuery.toLowerCase())
      : true;
    return matchesService && matchesCity;
  });

  const serviceLabel = serviceQuery ? serviceLabels[serviceQuery] || serviceQuery : "";
  const cityLabel = cityQuery ? cityLabels[cityQuery] || cityQuery : "";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-muted/30">
        {/* Header da busca */}
        <div className="bg-background border-b">
          <div className="container px-4 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Resultados da Busca
                </h1>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  {serviceLabel && (
                    <span className="flex items-center gap-1">
                      <Search className="h-4 w-4" />
                      {serviceLabel}
                    </span>
                  )}
                  {serviceLabel && cityLabel && <span>•</span>}
                  {cityLabel && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {cityLabel}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <span className="text-sm text-muted-foreground">
                  {filteredServices.length} resultado(s) encontrado(s)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de resultados */}
        <div className="container px-4 py-8">
          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} {...service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Nenhum serviço encontrado
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Não encontramos serviços para sua busca. Tente alterar os filtros ou buscar por outro termo.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchResults;
