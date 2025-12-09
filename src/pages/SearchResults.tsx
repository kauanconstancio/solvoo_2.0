import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import { Search, MapPin, Filter, ChevronsUpDownIcon, CheckIcon, Star, BadgeCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

const cities = [
  { value: "sp", label: "São Paulo, SP" },
  { value: "rj", label: "Rio de Janeiro, RJ" },
  { value: "mg", label: "Belo Horizonte, MG" },
  { value: "pr", label: "Curitiba, PR" },
  { value: "rs", label: "Porto Alegre, RS" },
  { value: "df", label: "Brasília, DF" },
];

const cityLabels: Record<string, string> = {
  sp: "São Paulo, SP",
  rj: "Rio de Janeiro, RJ",
  mg: "Belo Horizonte, MG",
  pr: "Curitiba, PR",
  rs: "Porto Alegre, RS",
  df: "Brasília, DF",
};

const services = [
  { value: "limpeza", label: "Limpeza" },
  { value: "fotografia", label: "Fotografia" },
  { value: "mecanica", label: "Mecânica" },
  { value: "encanador", label: "Encanador" },
  { value: "eletricista", label: "Eletricista" },
  { value: "pintura", label: "Pintura" },
  { value: "ti", label: "TI & Suporte" },
  { value: "mudancas", label: "Mudanças" },
];

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceQuery = searchParams.get("servico") || "";
  const cityQuery = searchParams.get("cidade") || "";

  // Estados para os popovers
  const [openService, setOpenService] = useState(false);
  const [valueService, setValueService] = useState(serviceQuery);
  const [openCity, setOpenCity] = useState(false);
  const [valueCity, setValueCity] = useState(cityQuery);

  // Estados para os filtros
  const [openFilters, setOpenFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [minRating, setMinRating] = useState(0);
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Atualizar estados quando os parâmetros da URL mudarem
  useEffect(() => {
    setValueService(serviceQuery);
    setValueCity(cityQuery);
  }, [serviceQuery, cityQuery]);

  const clearFilters = () => {
    setPriceRange([0, 500]);
    setMinRating(0);
    setOnlyVerified(false);
  };

  const hasActiveFilters = priceRange[0] > 0 || priceRange[1] < 500 || minRating > 0 || onlyVerified;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (valueService) params.set("servico", valueService);
    if (valueCity) params.set("cidade", valueCity);
    navigate(`/busca?${params.toString()}`);
  };

  // Extrair valor numérico do preço
  const extractPrice = (priceStr: string) => {
    const match = priceStr.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  // Filtrar serviços baseado nos parâmetros de busca e filtros
  const filteredServices = allServices.filter((service) => {
    const matchesService = serviceQuery
      ? service.category.toLowerCase() === serviceQuery.toLowerCase()
      : true;
    const matchesCity = cityQuery
      ? service.location.toLowerCase().includes(cityLabels[cityQuery]?.toLowerCase() || cityQuery.toLowerCase())
      : true;
    
    const servicePrice = extractPrice(service.price);
    const matchesPrice = servicePrice >= priceRange[0] && servicePrice <= priceRange[1];
    const matchesRating = service.rating >= minRating;
    const matchesVerified = onlyVerified ? service.verified : true;

    return matchesService && matchesCity && matchesPrice && matchesRating && matchesVerified;
  });

  const serviceLabel = serviceQuery ? serviceLabels[serviceQuery] || serviceQuery : "";
  const cityLabel = cityQuery ? cityLabels[cityQuery] || cityQuery : "";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-muted/30">
        {/* Barra de busca */}
        <div className="bg-primary/5 border-b">
          <div className="container px-4 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {/* Popover de Serviço */}
              <Popover open={openService} onOpenChange={setOpenService}>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 border border-input rounded-md bg-background px-3 py-2 flex-1 min-w-0 hover:border-primary transition-colors cursor-pointer">
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Button
                      variant="ghost"
                      role="combobox"
                      aria-expanded={openService}
                      className="w-full justify-between hover:bg-transparent hover:text-muted-foreground p-0 h-auto font-normal text-left"
                    >
                      <span className="truncate">
                        {valueService
                          ? services.find((s) => s.value === valueService)?.label
                          : "Que serviço você precisa?"}
                      </span>
                      <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Procurar serviço..." />
                    <CommandList>
                      <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                      <CommandGroup>
                        {services.map((service) => (
                          <CommandItem
                            key={service.value}
                            value={service.value}
                            onSelect={(currentValue) => {
                              setValueService(currentValue === valueService ? "" : currentValue);
                              setOpenService(false);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                valueService === service.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {service.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Popover de Localização */}
              <Popover open={openCity} onOpenChange={setOpenCity}>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 border border-input rounded-md bg-background px-3 py-2 flex-1 min-w-0 hover:border-primary transition-colors md:max-w-[250px] cursor-pointer">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Button
                      variant="ghost"
                      role="combobox"
                      aria-expanded={openCity}
                      className="w-full justify-between hover:bg-transparent hover:text-muted-foreground p-0 h-auto font-normal text-left"
                    >
                      <span className="truncate">
                        {valueCity
                          ? cities.find((c) => c.value === valueCity)?.label
                          : "Localização"}
                      </span>
                      <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Procurar localização..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma localização encontrada.</CommandEmpty>
                      <CommandGroup>
                        {cities.map((city) => (
                          <CommandItem
                            key={city.value}
                            value={city.value}
                            onSelect={(currentValue) => {
                              setValueCity(currentValue === valueCity ? "" : currentValue);
                              setOpenCity(false);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                valueCity === city.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {city.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Botão de Buscar */}
              <Button
                onClick={handleSearch}
                className="w-full md:w-auto md:px-8 gradient-primary hover:brightness-110 transition-smooth"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </div>

        {/* Header da busca */}
        <div className="bg-background border-b">
          <div className="container px-4 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
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
                {!serviceLabel && !cityLabel && (
                  <span>Todos os serviços</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Sheet open={openFilters} onOpenChange={setOpenFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                      {hasActiveFilters && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          !
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle className="flex items-center justify-between">
                        Filtros
                        {hasActiveFilters && (
                          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                            <X className="h-4 w-4 mr-1" />
                            Limpar
                          </Button>
                        )}
                      </SheetTitle>
                      <SheetDescription>
                        Refine sua busca com os filtros abaixo
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="space-y-6 py-6">
                      {/* Filtro de Preço */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Faixa de Preço</Label>
                        <div className="px-2">
                          <Slider
                            value={priceRange}
                            onValueChange={setPriceRange}
                            max={500}
                            min={0}
                            step={10}
                            className="w-full"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>R$ {priceRange[0]}</span>
                          <span>R$ {priceRange[1]}+</span>
                        </div>
                      </div>

                      {/* Filtro de Avaliação */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Avaliação Mínima</Label>
                        <div className="flex flex-wrap gap-2">
                          {[0, 3, 3.5, 4, 4.5].map((rating) => (
                            <Button
                              key={rating}
                              variant={minRating === rating ? "default" : "outline"}
                              size="sm"
                              onClick={() => setMinRating(rating)}
                              className="flex items-center gap-1"
                            >
                              {rating === 0 ? (
                                "Todas"
                              ) : (
                                <>
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {rating}+
                                </>
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Filtro de Verificados */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Profissionais</Label>
                        <div className="flex items-center space-x-3 rounded-lg border p-4">
                          <Checkbox
                            id="verified"
                            checked={onlyVerified}
                            onCheckedChange={(checked) => setOnlyVerified(checked as boolean)}
                          />
                          <div className="flex-1">
                            <Label htmlFor="verified" className="flex items-center gap-2 cursor-pointer">
                              <BadgeCheck className="h-4 w-4 text-primary" />
                              Apenas verificados
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Mostrar apenas profissionais com identidade verificada
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <SheetFooter>
                      <SheetClose asChild>
                        <Button className="w-full gradient-primary">
                          Aplicar Filtros
                        </Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
                <span className="text-sm text-muted-foreground">
                  {filteredServices.length} resultado(s)
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
