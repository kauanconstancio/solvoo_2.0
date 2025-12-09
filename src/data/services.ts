export interface ServiceCategory {
  value: string;
  label: string;
}

export const serviceCategories: ServiceCategory[] = [
  { value: "limpeza", label: "Limpeza" },
  { value: "fotografia", label: "Fotografia" },
  { value: "mecanica", label: "Mecânica" },
  { value: "encanador", label: "Encanador" },
  { value: "eletricista", label: "Eletricista" },
  { value: "pintura", label: "Pintura" },
  { value: "ti", label: "TI & Suporte" },
  { value: "mudancas", label: "Mudanças" },
  { value: "jardinagem", label: "Jardinagem" },
  { value: "reformas", label: "Reformas" },
  { value: "aulas-particulares", label: "Aulas Particulares" },
  { value: "personal-trainer", label: "Personal Trainer" },
  { value: "beleza-estetica", label: "Beleza e Estética" },
  { value: "eventos", label: "Eventos" },
  { value: "outros", label: "Outros" },
];

export const getServiceLabel = (value: string): string => {
  return serviceCategories.find((s) => s.value === value)?.label || value;
};

export const serviceCategoryLabels: Record<string, string> = Object.fromEntries(
  serviceCategories.map((s) => [s.value, s.label])
);
