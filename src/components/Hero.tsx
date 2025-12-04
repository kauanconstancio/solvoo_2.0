import { Search, MapPin, ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemTitle } from "./ui/item";
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

const Hero = () => {
  // Estados para o popover de serviço
  const [openService, setOpenService] = React.useState(false);
  const [valueService, setValueService] = React.useState("");

  // Estados para o popover de cidade
  const [openCity, setOpenCity] = React.useState(false);
  const [valueCity, setValueCity] = React.useState("");

  const city = [
    { value: "sp", label: "São Paulo, SP" },
    { value: "rj", label: "Rio de Janeiro, RJ" },
    { value: "mg", label: "Belo Horizonte, MG" },
    { value: "pr", label: "Curitiba, PR" },
    { value: "rs", label: "Porto Alegre, RS" },
    { value: "df", label: "Brasília, DF" },
  ];
  const service = [
    { value: "limpeza", label: "Limpeza" },
    { value: "fotografia", label: "Fotografia" },
    { value: "mecanica", label: "Mecânica" },
    { value: "encanador", label: "Encanador" },
    { value: "eletricista", label: "Eletricista" },
    { value: "pintura", label: "Pintura" },
    { value: "ti", label: "TI & Suporte" },
    { value: "mudancas", label: "Mudanças" },
  ];
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
                          ? service.find(
                              (service) => service.value === valueService
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
                        {service.map((service) => (
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

              {/* Popover de Localização */}
              <Popover open={openCity} onOpenChange={setOpenCity}>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 border border-input rounded-md bg-background px-3 py-2 flex-1 min-w-0 hover:border-primary transition-colors md:max-w-[250px] cursor-pointer">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Button
                      variant="ghost"
                      role="combobox"
                      aria-expanded={openCity}
                      className="w-full justify-between hover:bg-transparent hover:text-gray-500 p-0 h-auto font-normal text-left"
                    >
                      <span className="truncate">
                        {valueCity
                          ? city.find((city) => city.value === valueCity)?.label
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
                      <CommandEmpty>
                        Nenhuma localização encontrada.
                      </CommandEmpty>
                      <CommandGroup>
                        {city.map((city) => (
                          <CommandItem
                            key={city.value}
                            value={city.value}
                            onSelect={(currentValue) => {
                              setValueCity(
                                currentValue === valueCity ? "" : currentValue
                              );
                              setOpenCity(false);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                valueCity === city.value
                                  ? "opacity-100"
                                  : "opacity-0"
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
              <Button className="w-full md:w-auto md:px-8 gradient-primary hover:brightness-110 transition-smooth">
                <Search className="h-4 w-4 mr-2 md:hidden" />
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
