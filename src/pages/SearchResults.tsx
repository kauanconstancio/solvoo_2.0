import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import {
  Search,
  MapPin,
  Filter,
  ChevronsUpDownIcon,
  CheckIcon,
  Star,
  BadgeCheck,
  X,
  Loader2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { serviceCategories, serviceCategoryLabels } from "@/data/services";
import { getCategoryConfig } from "@/data/categoryIcons";
import { states } from "@/data/locations";
import { supabase } from "@/integrations/supabase/client";

interface ServiceFromDB {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  price: string;
  city: string;
  state: string;
  images: string[];
  verified: boolean;
  provider_name: string | null;
}

const SearchResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceQuery = searchParams.get("servico") || "";
  const cityQuery = searchParams.get("cidade") || "";

  const subcategoryQuery = searchParams.get("subcategoria") || "";

  // Estados para os popovers
  const [openService, setOpenService] = useState(false);
  const [valueService, setValueService] = useState(serviceQuery);
  const [openSubcategory, setOpenSubcategory] = useState(false);
  const [valueSubcategory, setValueSubcategory] = useState(subcategoryQuery);
  const [openCity, setOpenCity] = useState(false);
  const [valueCity, setValueCity] = useState(cityQuery);

  // Estados para os filtros
  const [openFilters, setOpenFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [minRating, setMinRating] = useState(0);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [filterSubcategory, setFilterSubcategory] = useState("");

  // Obter subcategorias disponíveis baseado na categoria selecionada
  const availableSubcategories = valueService
    ? getCategoryConfig(valueService)?.subcategories || []
    : [];

  // Estados para dados do banco
  const [services, setServices] = useState<ServiceFromDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar serviços do banco de dados
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("services")
          .select("id, title, category, subcategory, price, city, state, images, verified, user_id")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        // Filtrar por categoria se especificado
        if (serviceQuery) {
          query = query.eq("category", serviceQuery);
        }

        // Filtrar por subcategoria se especificado
        if (subcategoryQuery) {
          query = query.eq("subcategory", subcategoryQuery);
        }

        // Filtrar por cidade se especificado (formato: "Cidade, UF")
        if (cityQuery) {
          const [cityName, stateCode] = cityQuery.split(", ");
          if (cityName) {
            query = query.ilike("city", `%${cityName}%`);
          }
          if (stateCode) {
            query = query.eq("state", stateCode);
          }
        }

        const { data: servicesData, error } = await query;

        if (error) throw error;

        // Fetch profiles for each service
        const servicesWithProfiles: ServiceFromDB[] = await Promise.all(
          (servicesData || []).map(async (service) => {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", service.user_id)
              .maybeSingle();
            
            return {
              id: service.id,
              title: service.title,
              category: service.category,
              subcategory: service.subcategory,
              price: service.price,
              city: service.city,
              state: service.state,
              images: service.images || [],
              verified: service.verified,
              provider_name: profileData?.full_name || null,
            };
          })
        );

        setServices(servicesWithProfiles);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [serviceQuery, cityQuery, subcategoryQuery]);

  // Atualizar estados quando os parâmetros da URL mudarem
  useEffect(() => {
    setValueService(serviceQuery);
    setValueSubcategory(subcategoryQuery);
    setValueCity(cityQuery);
  }, [serviceQuery, subcategoryQuery, cityQuery]);

  // Limpar subcategoria quando categoria mudar
  useEffect(() => {
    if (valueService !== serviceQuery) {
      setValueSubcategory("");
    }
  }, [valueService, serviceQuery]);

  const clearFilters = () => {
    setPriceRange([0, 500]);
    setMinRating(0);
    setOnlyVerified(false);
    setFilterSubcategory("");
  };

  const hasActiveFilters =
    priceRange[0] > 0 || priceRange[1] < 500 || minRating > 0 || onlyVerified || filterSubcategory;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (valueService) params.set("servico", valueService);
    if (valueSubcategory) params.set("subcategoria", valueSubcategory);
    if (valueCity) params.set("cidade", valueCity);
    navigate(`/busca?${params.toString()}`);
  };

  // Extrair valor numérico do preço
  const extractPrice = (priceStr: string) => {
    const match = priceStr.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  // Filtrar serviços baseado nos filtros locais
  const filteredServices = services.filter((service) => {
    const servicePrice = extractPrice(service.price);
    const matchesPrice =
      servicePrice >= priceRange[0] && servicePrice <= priceRange[1];
    const matchesVerified = onlyVerified ? service.verified : true;
    const matchesSubcategory = filterSubcategory 
      ? service.subcategory === filterSubcategory 
      : true;

    return matchesPrice && matchesVerified && matchesSubcategory;
  });

  // Obter subcategorias para filtro baseado na categoria buscada
  const filterAvailableSubcategories = serviceQuery
    ? getCategoryConfig(serviceQuery)?.subcategories || []
    : [];

  const serviceLabel = serviceQuery
    ? serviceCategoryLabels[serviceQuery] || serviceQuery
    : "";
  const cityLabel = cityQuery || "";

  const getLocation = (city: string, state: string) => {
    return `${city}, ${state.toUpperCase()}`;
  };

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
                          ? serviceCategories.find((s) => s.value === valueService)
                              ?.label
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
                        {serviceCategories.map((service) => (
                          <CommandItem
                            key={service.value}
                            value={service.value}
                            onSelect={(currentValue) => {
                              setValueService(
                                currentValue === valueService
                                  ? ""
                                  : currentValue
                              );
                              setOpenService(false);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                valueService === service.value
                                  ? "opacity-100"
                                  : "opacity-0"
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

              {/* Popover de Subcategoria - só aparece se categoria selecionada */}
              {valueService && availableSubcategories.length > 0 && (
                <Popover open={openSubcategory} onOpenChange={setOpenSubcategory}>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-2 border border-input rounded-md bg-background px-3 py-2 flex-1 min-w-0 hover:border-primary transition-colors md:max-w-[200px] cursor-pointer overflow-hidden">
                      <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 truncate text-sm">
                        {valueSubcategory || "Subcategoria"}
                      </span>
                      <ChevronsUpDownIcon className="h-4 w-4 flex-shrink-0 opacity-50" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Procurar subcategoria..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma subcategoria encontrada.</CommandEmpty>
                        <CommandGroup>
                          {availableSubcategories.map((subcategory) => (
                            <CommandItem
                              key={subcategory}
                              value={subcategory}
                              onSelect={(currentValue) => {
                                setValueSubcategory(
                                  currentValue === valueSubcategory ? "" : currentValue
                                );
                                setOpenSubcategory(false);
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  valueSubcategory === subcategory
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {subcategory}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}

              {/* Popover de Localização */}
              <Popover open={openCity} onOpenChange={setOpenCity}>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 border border-input rounded-md bg-background px-3 py-2 flex-1 min-w-0 hover:border-primary transition-colors md:max-w-[250px] cursor-pointer overflow-hidden">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">
                      {valueCity || "Localização"}
                    </span>
                    <ChevronsUpDownIcon className="h-4 w-4 flex-shrink-0 opacity-50" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Procurar cidade..." />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>
                        Nenhuma localização encontrada.
                      </CommandEmpty>
                      {states.map((state) => (
                        <CommandGroup key={state.value} heading={state.label}>
                          {state.cities.map((city) => {
                            const cityValue = `${city.label}, ${state.value}`;
                            return (
                              <CommandItem
                                key={`${state.value}-${city.value}`}
                                value={`${city.label} ${state.label}`}
                                onSelect={() => {
                                  setValueCity(
                                    cityValue === valueCity ? "" : cityValue
                                  );
                                  setOpenCity(false);
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    valueCity === cityValue
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {city.label}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      ))}
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
              <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                {serviceLabel && (
                  <span className="flex items-center gap-1">
                    <Search className="h-4 w-4" />
                    {serviceLabel}
                  </span>
                )}
                {subcategoryQuery && (
                  <>
                    <span>›</span>
                    <span className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      {subcategoryQuery}
                    </span>
                  </>
                )}
                {(serviceLabel || subcategoryQuery) && cityLabel && <span>•</span>}
                {cityLabel && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {cityLabel}
                  </span>
                )}
                {!serviceLabel && !subcategoryQuery && !cityLabel && <span>Todos os serviços</span>}
              </div>

              <div className="flex items-center gap-2">
                <Sheet open={openFilters} onOpenChange={setOpenFilters}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="relative hover:gradient-primary"
                    >
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
                      </SheetTitle>
                      <SheetDescription>
                        Refine sua busca com os filtros abaixo
                      </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 py-6">
                      {/* Filtro de Preço */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">
                          Faixa de Preço
                        </Label>
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

                      {/* Filtro de Subcategoria */}
                      {filterAvailableSubcategories.length > 0 && (
                        <div className="space-y-4">
                          <Label className="text-base font-semibold">
                            Subcategoria
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant={filterSubcategory === "" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setFilterSubcategory("")}
                              className={filterSubcategory === "" ? "gradient-primary" : ""}
                            >
                              Todas
                            </Button>
                            {filterAvailableSubcategories.map((sub) => (
                              <Button
                                key={sub}
                                variant={filterSubcategory === sub ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterSubcategory(sub)}
                                className={filterSubcategory === sub ? "gradient-primary" : ""}
                              >
                                {sub}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                      {/* Filtro de Verificados */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">
                          Profissionais
                        </Label>
                        <div className="flex items-center space-x-3 rounded-lg border p-4">
                          <Checkbox
                            id="verified"
                            checked={onlyVerified}
                            onCheckedChange={(checked) =>
                              setOnlyVerified(checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor="verified"
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <BadgeCheck className="h-4 w-4 text-primary" />
                              Apenas verificados
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Mostrar apenas profissionais com identidade
                              verificada
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <SheetFooter className="flex flex-col gap-2">
                      <SheetClose asChild>
                        <Button className="w-full gradient-primary">
                          Aplicar Filtros
                        </Button>
                      </SheetClose>
                      <Button
                        variant="outline"
                        className="w-full hover:bg-white hover:text-primary"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpar Filtros
                      </Button>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  title={service.title}
                  provider={service.provider_name || undefined}
                  location={getLocation(service.city, service.state)}
                  price={service.price}
                  image={service.images?.[0]}
                  category={service.category}
                  verified={service.verified}
                  providerName={service.provider_name}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Nenhum serviço encontrado
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Não encontramos serviços para sua busca. Tente alterar os
                filtros ou buscar por outro termo.
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
