import ServiceCard from "./ServiceCard";

const services = [
  {
    id: 1,
    title: "Limpeza Residencial Completa",
    provider: "Maria Silva Limpeza",
    location: "São Paulo, SP",
    rating: 4.9,
    reviews: 127,
    price: "R$ 150",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop",
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
    image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=600&fit=crop",
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
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop",
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
    image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=600&fit=crop",
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
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop",
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
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&h=600&fit=crop",
    category: "Pintura",
    verified: false,
  },
];

const ServicesList = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-2">
              Serviços em Destaque
            </h2>
            <p className="text-muted-foreground text-lg">
              Profissionais avaliados e verificados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.id} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesList;
