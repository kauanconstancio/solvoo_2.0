import { Search, MapPin, ChevronsUpDownIcon, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, ItemDescription } from "./ui/item";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import { useNavigate } from "react-router-dom";
import { serviceCategories } from "@/data/services";
import { states } from "@/data/locations";
import { getCategoryConfig } from "@/data/categoryIcons";
import { FloatingParticles } from "./FloatingParticles";

const Hero = () => {
  const navigate = useNavigate();
  
  // Estados para o popover de serviço
  const [openService, setOpenService] = React.useState(false);
  const [valueService, setValueService] = React.useState("");

  // Estados para o popover de cidade
  const [openCity, setOpenCity] = React.useState(false);
  const [valueCity, setValueCity] = React.useState("");

  // Estados para o popover de subcategoria
  const [openSubcategory, setOpenSubcategory] = React.useState(false);
  const [valueSubcategory, setValueSubcategory] = React.useState("");

  // Obter subcategorias disponíveis baseado na categoria selecionada
  const availableSubcategories = valueService
    ? getCategoryConfig(valueService)?.subcategories || []
    : [];

  // Função para obter o label da cidade a partir do formato "cityValue|stateCode"
  const getCityDisplayLabel = (cityKey: string): string => {
    if (!cityKey) return "";
    const [cityValue, stateCode] = cityKey.split("|");
    const state = states.find(s => s.value === stateCode);
    if (!state) return cityKey;
    const city = state.cities.find(c => c.value === cityValue);
    return city ? `${city.label}, ${state.value}` : cityKey;
  };

  // Limpar subcategoria quando categoria mudar
  React.useEffect(() => {
    setValueSubcategory("");
  }, [valueService]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (valueService) params.set("servico", valueService);
    if (valueSubcategory) params.set("subcategoria", valueSubcategory);
    if (valueCity) params.set("cidade", valueCity);
    navigate(`/busca?${params.toString()}`);
  };
  return (
    <section className="gradient-hero py-12 md:py-20 lg:py-28 relative overflow-hidden">
      {/* Floating particles */}
      <FloatingParticles count={30} minSize={3} maxSize={10} />
      
      <div className="container px-4 relative z-10">
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

          <Item className="w-full max-w-5xl mx-auto p-4 md:p-6 shadow-lg">
            <ItemDescription className="flex flex-col gap-3 w-full md:flex-row md:items-center">
              {/* Popover de Serviço */}
              <Popover open={openService} onOpenChange={setOpenService}>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 border border-input rounded-md bg-background px-3 py-2 flex-1 min-w-0 hover:border-primary transition-colors cursor-pointer">
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Button
                      variant="ghost"
                      role="combobox"
                      aria-expanded={openService}
                      className="w-full justify-between hover:bg-transparent hover:text-gray-500 p-0 h-auto font-normal text-left"
                    >
                      <span className="truncate">
                        {valueService
                          ? serviceCategories.find(
                              (s) => s.value === valueService
                            )?.label
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
                    <div className="flex items-center gap-2 border border-input rounded-md bg-background px-3 py-2 flex-1 min-w-0 hover:border-primary transition-colors md:max-w-[180px] cursor-pointer overflow-hidden">
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
                      {valueCity ? getCityDisplayLabel(valueCity) : "Localização"}
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
                            const cityKey = `${city.value}|${state.value}`;
                            return (
                              <CommandItem
                                key={`${state.value}-${city.value}`}
                                value={`${city.label} ${state.label}`}
                                onSelect={() => {
                                  setValueCity(
                                    cityKey === valueCity ? "" : cityKey
                                  );
                                  setOpenCity(false);
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    valueCity === cityKey
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
            </ItemDescription>
          </Item>
        </div>
      </div>
    </section>
  );
};

export default Hero;
