import ServiceCard from "./ServiceCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const services = [
  {
    id: 1,
    title: "Limpeza Residencial Completa",
    provider: "Maria Silva Limpeza",
    location: "São Paulo, SP",
    rating: 4.9,
    reviews: 127,
    price: "R$ 150",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop",
    category: "Limpeza",
    verified: true,
  },
  {
    id: 2,
    title: "Fotografia para Eventos",
    provider: "João Fotografias Pro",
    location: "Rio de Janeiro, RJ",
    rating: 5.0,
    reviews: 89,
    price: "R$ 800",
    image:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=600&fit=crop",
    category: "Fotografia",
    verified: true,
  },
  {
    id: 3,
    title: "Conserto e Manutenção Automotiva",
    provider: "Auto Mecânica Express",
    location: "Belo Horizonte, MG",
    rating: 4.8,
    reviews: 156,
    price: "R$ 120",
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop",
    category: "Mecânica",
    verified: true,
  },
  {
    id: 4,
    title: "Serviços de Encanamento",
    provider: "Encanador 24h",
    location: "Curitiba, PR",
    rating: 4.7,
    reviews: 203,
    price: "R$ 90",
    image:
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=600&fit=crop",
    category: "Encanador",
    verified: false,
  },
  {
    id: 5,
    title: "Instalações Elétricas",
    provider: "Eletro Serviços Premium",
    location: "Porto Alegre, RS",
    rating: 4.9,
    reviews: 178,
    price: "R$ 100",
    image:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop",
    category: "Eletricista",
    verified: true,
  },
  {
    id: 6,
    title: "Pintura Residencial e Comercial",
    provider: "Tintas & Arte",
    location: "Brasília, DF",
    rating: 4.6,
    reviews: 145,
    price: "R$ 200",
    image:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&h=600&fit=crop",
    category: "Pintura",
    verified: false,
  },
];

const ServicesList = () => {
  const allServices = services;
  const limpezaServices = services.filter((s) => s.category === "Limpeza");
  const fotografiaServices = services.filter(
    (s) => s.category === "Fotografia"
  );
  const mecanicaServices = services.filter((s) => s.category === "Mecânica");
  const encanadorServices = services.filter((s) => s.category === "Encanador");
  const eletricistaServices = services.filter(
    (s) => s.category === "Eletricista"
  );
  const tiServices = services.filter((s) => s.category === "TI & Suporte");
  const mudancasServices = services.filter((s) => s.category === "Mudanças");
  const pinturaServices = services.filter((s) => s.category === "Pintura");

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 md:mb-12">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-1 md:mb-2">
              Serviços em Destaque
            </h2>
            <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
              Profissionais avaliados e verificados
            </p>
          </div>
          <Select defaultValue="relevance">
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Mais Relevantes</SelectItem>
              <SelectItem value="rating">Melhor Avaliado</SelectItem>
              <SelectItem value="price-low">Menor Preço</SelectItem>
              <SelectItem value="price-high">Maior Preço</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full sm:w-auto mb-6 flex-wrap h-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="limpeza">Limpeza</TabsTrigger>
            <TabsTrigger value="fotografia">Fotografia</TabsTrigger>
            <TabsTrigger value="mecanica">Mecânica</TabsTrigger>
            <TabsTrigger value="encanador">Encanador</TabsTrigger>
            <TabsTrigger value="pintura">Pintura</TabsTrigger>
            <TabsTrigger value="eletricista">Eletricista</TabsTrigger>
            <TabsTrigger value="ti">TI & Suporte</TabsTrigger>
            <TabsTrigger value="mudancas">Mudanças</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {allServices.map((service) => (
                <ServiceCard key={service.id} {...service} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="limpeza" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {limpezaServices.map((service) => (
                <ServiceCard key={service.id} {...service} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fotografia" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {fotografiaServices.map((service) => (
                <ServiceCard key={service.id} {...service} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mecanica" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {mecanicaServices.map((service) => (
                <ServiceCard key={service.id} {...service} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="encanador" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {encanadorServices.map((service) => (
                <ServiceCard key={service.id} {...service} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pintura" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {pinturaServices.map((service) => (
                <ServiceCard key={service.id} {...service} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="eletricista" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {eletricistaServices.map((service) => (
                <ServiceCard key={service.id} {...service} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ti" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {tiServices.map((service) => (
                <ServiceCard key={service.id} {...service} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mudancas" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {mudancasServices.map((service) => (
                <ServiceCard key={service.id} {...service} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default ServicesList;
