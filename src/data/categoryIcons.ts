import {
  Sparkles,
  Camera,
  Wrench,
  Droplet,
  Zap,
  Paintbrush,
  Laptop,
  Truck,
  Leaf,
  Home,
  GraduationCap,
  Dumbbell,
  Scissors,
  PartyPopper,
  MoreHorizontal,
  LucideIcon,
} from "lucide-react";

export interface CategoryConfig {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  description?: string;
  subcategories?: string[];
}

// Centralized category configuration with icons and colors
export const categoryConfig: CategoryConfig[] = [
  {
    value: "limpeza",
    label: "Limpeza",
    icon: Sparkles,
    color: "text-blue-500",
    description: "Diaristas, faxineiras e limpeza especializada",
    subcategories: ["Diarista", "Limpeza Pós-Obra", "Limpeza de Estofados", "Vidraçaria"],
  },
  {
    value: "fotografia",
    label: "Fotografia",
    icon: Camera,
    color: "text-purple-500",
    description: "Eventos, ensaios e produções audiovisuais",
    subcategories: ["Casamentos", "Ensaios", "Eventos Corporativos", "Vídeo"],
  },
  {
    value: "mecanica",
    label: "Mecânica",
    icon: Wrench,
    color: "text-orange-500",
    description: "Mecânicos, funilaria e elétrica automotiva",
    subcategories: ["Mecânico", "Funilaria", "Elétrica", "Lavagem", "Guincho"],
  },
  {
    value: "encanador",
    label: "Encanador",
    icon: Droplet,
    color: "text-cyan-500",
    description: "Consertos e instalações hidráulicas",
    subcategories: ["Vazamentos", "Instalações", "Desentupimento", "Caixa d'água"],
  },
  {
    value: "eletricista",
    label: "Eletricista",
    icon: Zap,
    color: "text-yellow-500",
    description: "Instalações e reparos elétricos",
    subcategories: ["Instalação", "Manutenção", "Quadros Elétricos", "Iluminação"],
  },
  {
    value: "pintura",
    label: "Pintura",
    icon: Paintbrush,
    color: "text-pink-500",
    description: "Pintura residencial e comercial",
    subcategories: ["Pintura Residencial", "Comercial", "Texturas", "Grafiato"],
  },
  {
    value: "ti",
    label: "TI & Suporte",
    icon: Laptop,
    color: "text-indigo-500",
    description: "Desenvolvimento, suporte e TI",
    subcategories: ["Desenvolvimento Web", "Suporte Técnico", "Redes", "Apps"],
  },
  {
    value: "mudancas",
    label: "Mudanças",
    icon: Truck,
    color: "text-green-500",
    description: "Fretes, carretos e transporte",
    subcategories: ["Mudança Residencial", "Comercial", "Frete", "Carreto"],
  },
  {
    value: "jardinagem",
    label: "Jardinagem",
    icon: Leaf,
    color: "text-emerald-500",
    description: "Paisagismo, poda e manutenção",
    subcategories: ["Paisagismo", "Poda", "Manutenção", "Irrigação"],
  },
  {
    value: "reformas",
    label: "Reformas",
    icon: Home,
    color: "text-amber-500",
    description: "Pedreiros, pintores e construção",
    subcategories: ["Pedreiro", "Gesseiro", "Marceneiro", "Azulejista"],
  },
  {
    value: "aulas-particulares",
    label: "Aulas Particulares",
    icon: GraduationCap,
    color: "text-sky-500",
    description: "Professores particulares e cursos",
    subcategories: ["Matemática", "Inglês", "Música", "Reforço Escolar"],
  },
  {
    value: "personal-trainer",
    label: "Personal Trainer",
    icon: Dumbbell,
    color: "text-red-500",
    description: "Treinamento físico personalizado",
    subcategories: ["Musculação", "Funcional", "Yoga", "Pilates"],
  },
  {
    value: "beleza-estetica",
    label: "Beleza e Estética",
    icon: Scissors,
    color: "text-rose-500",
    description: "Cabeleireiros, manicures e estética",
    subcategories: ["Cabeleireiro", "Manicure", "Maquiagem", "Estética"],
  },
  {
    value: "eventos",
    label: "Eventos",
    icon: PartyPopper,
    color: "text-violet-500",
    description: "Organização, buffet e entretenimento",
    subcategories: ["Organização", "Buffet", "DJ", "Decoração"],
  },
  {
    value: "outros",
    label: "Outros",
    icon: MoreHorizontal,
    color: "text-slate-500",
    description: "Outros serviços diversos",
    subcategories: ["Diversos"],
  },
];

// Helper to get category config by value
export const getCategoryConfig = (value: string): CategoryConfig | undefined => {
  return categoryConfig.find((c) => c.value === value);
};

// Helper to get icon by category value
export const getCategoryIcon = (value: string): LucideIcon => {
  return getCategoryConfig(value)?.icon || MoreHorizontal;
};

// Helper to get color by category value
export const getCategoryColor = (value: string): string => {
  return getCategoryConfig(value)?.color || "text-slate-500";
};
