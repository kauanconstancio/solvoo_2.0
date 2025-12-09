// Localizações simplificadas para busca (cidade + estado)
export interface SearchLocation {
  value: string;
  label: string;
}

export const searchLocations: SearchLocation[] = [
  { value: "sao-paulo-sp", label: "São Paulo, SP" },
  { value: "rio-de-janeiro-rj", label: "Rio de Janeiro, RJ" },
  { value: "belo-horizonte-mg", label: "Belo Horizonte, MG" },
  { value: "curitiba-pr", label: "Curitiba, PR" },
  { value: "porto-alegre-rs", label: "Porto Alegre, RS" },
  { value: "brasilia-df", label: "Brasília, DF" },
  { value: "salvador-ba", label: "Salvador, BA" },
  { value: "fortaleza-ce", label: "Fortaleza, CE" },
  { value: "recife-pe", label: "Recife, PE" },
  { value: "manaus-am", label: "Manaus, AM" },
  { value: "goiania-go", label: "Goiânia, GO" },
  { value: "florianopolis-sc", label: "Florianópolis, SC" },
  { value: "campinas-sp", label: "Campinas, SP" },
  { value: "guarulhos-sp", label: "Guarulhos, SP" },
  { value: "santos-sp", label: "Santos, SP" },
];

export const getSearchLocationLabel = (value: string): string => {
  return searchLocations.find((l) => l.value === value)?.label || value;
};

export const searchLocationLabels: Record<string, string> = Object.fromEntries(
  searchLocations.map((l) => [l.value, l.label])
);
