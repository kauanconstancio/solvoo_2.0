import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Star,
  MapPin,
  Heart,
  Share2,
  BadgeCheck,
  Clock,
  Shield,
  MessageSquare,
  Calendar,
  Award,
  ThumbsUp,
  CheckCircle2,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Mock data - In production, this would come from an API based on the service ID
const serviceData = {
  id: 1,
  title: "Limpeza Residencial Completa",
  description:
    "Serviço completo de limpeza residencial com profissionais qualificados e produtos de alta qualidade. Realizamos limpeza de todos os ambientes, incluindo cozinha, banheiros, quartos, sala e áreas externas. Garantimos um ambiente limpo, organizado e higienizado.",
  category: "Limpeza",
  price: "R$ 150",
  priceDetails: "por visita (até 100m²)",
  rating: 4.9,
  reviews: 127,
  location: "São Paulo, SP",
  verified: true,
  images: [
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&h=600&fit=crop",
  ],
  features: [
    "Limpeza de todos os cômodos",
    "Produtos de limpeza inclusos",
    "Profissionais treinados",
    "Seguro contra danos",
    "Flexibilidade de horários",
    "Garantia de satisfação",
  ],
  provider: {
    name: "Maria Silva Limpeza",
    avatar:
      "https://ui-avatars.com/api/?name=Maria+Silva&background=3b82f6&color=fff&size=128",
    verified: true,
    memberSince: "2020",
    responseTime: "2 horas",
    completedJobs: 342,
    rating: 4.9,
    reviewCount: 127,
    bio: "Profissional de limpeza com mais de 10 anos de experiência. Especializada em limpeza residencial e comercial, sempre buscando a excelência no atendimento e satisfação dos clientes.",
    badges: ["Top Rated", "Verified Pro", "Quick Response"],
  },
  reviewsList: [
    {
      id: 1,
      author: "Ana Costa",
      avatar:
        "https://ui-avatars.com/api/?name=Ana+Costa&background=10b981&color=fff&size=128",
      rating: 5,
      date: "Há 2 semanas",
      comment:
        "Excelente serviço! A Maria é muito profissional e deixou minha casa impecável. Super recomendo!",
      helpful: 12,
    },
    {
      id: 2,
      author: "Carlos Mendes",
      avatar:
        "https://ui-avatars.com/api/?name=Carlos+Mendes&background=8b5cf6&color=fff&size=128",
      rating: 5,
      date: "Há 1 mês",
      comment:
        "Pontual, educada e faz um trabalho maravilhoso. Já contratei várias vezes e sempre fico satisfeito.",
      helpful: 8,
    },
    {
      id: 3,
      author: "Juliana Santos",
      avatar:
        "https://ui-avatars.com/api/?name=Juliana+Santos&background=f59e0b&color=fff&size=128",
      rating: 4,
      date: "Há 2 meses",
      comment:
        "Muito bom o serviço. Apenas uma pequena observação sobre a limpeza dos vidros, mas no geral foi ótimo!",
      helpful: 5,
    },
  ],
};

const ServiceDetails = () => {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <section className="py-4 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <a href="/" className="hover:text-primary transition-smooth">
                Início
              </a>
              <span>/</span>
              <a
                href="/categorias"
                className="hover:text-primary transition-smooth"
              >
                Categorias
              </a>
              <span>/</span>
              <span className="text-foreground">{serviceData.category}</span>
            </div>
          </div>
        </section>

        {/* Service Details */}
        <section className="py-8 md:py-12">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Images and Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Image Gallery */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-[16/10] bg-muted">
                      <img
                        src={serviceData.images[selectedImage]}
                        alt={serviceData.title}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-background/80 backdrop-blur hover:bg-background"
                          onClick={() => setIsFavorite(!isFavorite)}
                        >
                          <Heart
                            className={`h-5 w-5 ${
                              isFavorite ? "fill-red-500 text-red-500" : ""
                            }`}
                          />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-background/80 backdrop-blur hover:bg-background"
                        >
                          <Share2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 p-4">
                      {serviceData.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImage === index
                              ? "border-primary"
                              : "border-transparent hover:border-muted-foreground"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${serviceData.title} ${index + 1}`}
                            className="object-cover w-full h-full"
                          />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Service Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            {serviceData.category}
                          </Badge>
                          {serviceData.verified && (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                              <BadgeCheck className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-2xl md:text-3xl mb-2">
                          {serviceData.title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">
                              {serviceData.rating}
                            </span>
                            <span className="text-muted-foreground">
                              ({serviceData.reviews} avaliações)
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{serviceData.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        Sobre o Serviço
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {serviceData.description}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold text-lg mb-4">
                        O que está incluído
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {serviceData.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Avaliações ({serviceData.reviewsList.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {serviceData.reviewsList.map((review) => (
                      <div key={review.id} className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={review.avatar}
                              alt={review.author}
                            />
                            <AvatarFallback>{review.author[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-sm">
                                {review.author}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {review.date}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {review.comment}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-8 text-xs"
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Útil ({review.helpful})
                            </Button>
                          </div>
                        </div>
                        {review.id !==
                          serviceData.reviewsList[
                            serviceData.reviewsList.length - 1
                          ].id && <Separator />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Provider Info and Booking */}
              <div className="space-y-6">
                {/* Price Card */}
                <Card className="hidden md:flex ">
                  <CardContent className="p-6 space-y-4 w-full">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        A partir de
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        {serviceData.price}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {serviceData.priceDetails}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Button className="w-full h-12 text-base hover:brightness-110">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Solicitar Orçamento
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                      <Shield className="h-4 w-4" />
                      <span>Pagamento seguro e protegido</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:hidden fixed bottom-0 left-0 right-0 z-50 mx-auto  w-full rounded-t-2xl rounded-b-none shadow-2xl bg-background border-t-2 border-b-0">
                  <CardContent className="p-4 pb-6">
                    <div className="flex items-center justify-between gap-5 ">
                      <div className="flex flex-col w-full">
                        <p className="text-xs text-muted-foreground mb-1">
                          A partir de
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {serviceData.price}
                        </p>
                      </div>
                      <Button className="w-full h-12 text-sm hover:brightness-110">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Solicitar Orçamento
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Provider Card */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Sobre o Profissional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage
                          src={serviceData.provider.avatar}
                          alt={serviceData.provider.name}
                        />
                        <AvatarFallback>
                          {serviceData.provider.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {serviceData.provider.name}
                          </h3>
                          {serviceData.provider.verified && (
                            <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">
                            {serviceData.provider.rating}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({serviceData.provider.reviewCount} avaliações)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {serviceData.provider.badges.map((badge, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {serviceData.provider.bio}
                    </p>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Membro desde</span>
                        </div>
                        <p className="font-semibold">
                          {serviceData.provider.memberSince}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Tempo de resposta</span>
                        </div>
                        <p className="font-semibold">
                          {serviceData.provider.responseTime}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Award className="h-4 w-4" />
                          <span>Trabalhos concluídos</span>
                        </div>
                        <p className="font-semibold">
                          {serviceData.provider.completedJobs}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Star className="h-4 w-4" />
                          <span>Avaliação média</span>
                        </div>
                        <p className="font-semibold">
                          {serviceData.provider.rating}/5.0
                        </p>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      Ver Perfil Completo
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceDetails;
