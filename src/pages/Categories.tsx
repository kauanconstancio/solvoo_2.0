import { useState } from "react";
import {
  Wrench,
  Camera,
  Paintbrush,
  Car,
  Scissors,
  Home,
  Laptop,
  Users,
  Sparkles,
  Truck,
  Heart,
  GraduationCap,
  Music,
  Utensils,
  Shield,
  Leaf,
  Search,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const allCategories = [
  {
    icon: Home,
    name: "Casa e Reformas",
    description: "Pedreiros, pintores, eletricistas e encanadores",
    count: 2847,
    color: "bg-blue-500/10 text-blue-500",
    subcategories: [
      "Pedreiro",
      "Pintor",
      "Eletricista",
      "Encanador",
      "Gesseiro",
      "Marceneiro",
    ],
  },
  {
    icon: Wrench,
    name: "Reparos",
    description: "Consertos e manutenção em geral",
    count: 1923,
    color: "bg-orange-500/10 text-orange-500",
    subcategories: [
      "Eletrodomésticos",
      "Móveis",
      "Eletrônicos",
      "Ar Condicionado",
    ],
  },
  {
    icon: Sparkles,
    name: "Limpeza",
    description: "Diaristas, faxineiras e limpeza especializada",
    count: 3156,
    color: "bg-cyan-500/10 text-cyan-500",
    subcategories: [
      "Diarista",
      "Limpeza Pós-Obra",
      "Limpeza de Estofados",
      "Vidraçaria",
    ],
  },
  {
    icon: Camera,
    name: "Fotografia",
    description: "Eventos, ensaios e produções audiovisuais",
    count: 892,
    color: "bg-purple-500/10 text-purple-500",
    subcategories: ["Casamentos", "Ensaios", "Eventos Corporativos", "Vídeo"],
  },
  {
    icon: Scissors,
    name: "Beleza",
    description: "Cabeleireiros, manicures e estética",
    count: 2341,
    color: "bg-pink-500/10 text-pink-500",
    subcategories: [
      "Cabeleireiro",
      "Manicure",
      "Maquiagem",
      "Estética",
      "Depilação",
    ],
  },
  {
    icon: Car,
    name: "Automotivo",
    description: "Mecânicos, funilaria e elétrica automotiva",
    count: 1567,
    color: "bg-red-500/10 text-red-500",
    subcategories: ["Mecânico", "Funilaria", "Elétrica", "Lavagem", "Guincho"],
  },
  {
    icon: Laptop,
    name: "Tecnologia",
    description: "Desenvolvimento, suporte e TI",
    count: 1234,
    color: "bg-indigo-500/10 text-indigo-500",
    subcategories: ["Desenvolvimento Web", "Suporte Técnico", "Redes", "Apps"],
  },
  {
    icon: Paintbrush,
    name: "Design",
    description: "Gráfico, interiores e decoração",
    count: 756,
    color: "bg-teal-500/10 text-teal-500",
    subcategories: ["Design Gráfico", "Interiores", "Decoração", "3D"],
  },
  {
    icon: Users,
    name: "Eventos",
    description: "Organização, buffet e entretenimento",
    count: 1089,
    color: "bg-amber-500/10 text-amber-500",
    subcategories: ["Organização", "Buffet", "DJ", "Decoração", "Cerimonial"],
  },
  {
    icon: Truck,
    name: "Mudanças",
    description: "Fretes, carretos e transporte",
    count: 678,
    color: "bg-emerald-500/10 text-emerald-500",
    subcategories: ["Mudança Residencial", "Comercial", "Frete", "Carreto"],
  },
  {
    icon: Heart,
    name: "Saúde",
    description: "Cuidadores, enfermeiros e terapeutas",
    count: 945,
    color: "bg-rose-500/10 text-rose-500",
    subcategories: [
      "Cuidador de Idosos",
      "Enfermagem",
      "Fisioterapia",
      "Nutrição",
    ],
  },
  {
    icon: GraduationCap,
    name: "Educação",
    description: "Professores particulares e cursos",
    count: 1678,
    color: "bg-sky-500/10 text-sky-500",
    subcategories: ["Matemática", "Inglês", "Música", "Reforço Escolar"],
  },
  {
    icon: Music,
    name: "Música",
    description: "Músicos, DJs e produção musical",
    count: 534,
    color: "bg-violet-500/10 text-violet-500",
    subcategories: ["Banda", "DJ", "Produção Musical", "Aulas"],
  },
  {
    icon: Utensils,
    name: "Gastronomia",
    description: "Chefs, confeiteiros e catering",
    count: 823,
    color: "bg-yellow-500/10 text-yellow-500",
    subcategories: [
      "Chef Particular",
      "Confeitaria",
      "Catering",
      "Marmitas Fit",
    ],
  },
  {
    icon: Shield,
    name: "Segurança",
    description: "Vigilância, monitoramento e escoltas",
    count: 412,
    color: "bg-slate-500/10 text-slate-500",
    subcategories: [
      "Vigilante",
      "Monitoramento",
      "Escolta",
      "Instalação de Câmeras",
    ],
  },
  {
    icon: Leaf,
    name: "Jardinagem",
    description: "Paisagismo, poda e manutenção",
    count: 567,
    color: "bg-green-500/10 text-green-500",
    subcategories: ["Paisagismo", "Poda", "Manutenção", "Irrigação"],
  },
];

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = allCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.subcategories.some((sub) =>
        sub.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto space-y-4 md:space-y-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold tracking-tight">
                Todas as <span className="text-primary">Categorias</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Explore todas as categorias de serviços disponíveis na nossa
                plataforma. São mais de 20.000 profissionais prontos para
                atender você.
              </p>

              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar categoria ou serviço..."
                  className="pl-12 h-12 text-base shadow-lg border-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  Nenhuma categoria encontrada para "{searchTerm}"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredCategories.map((category, index) => (
                  <Card
                    key={index}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                        >
                          <category.icon className="h-6 w-6" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {category.count.toLocaleString("pt-BR")} profissionais
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-3">
                        {category.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1.5">
                        {category.subcategories.slice(0, 4).map((sub, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                          >
                            {sub}
                          </Badge>
                        ))}
                        {category.subcategories.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{category.subcategories.length - 4}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 md:py-16 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  16+
                </p>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Categorias
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  100+
                </p>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Subcategorias
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  20K+
                </p>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Profissionais
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  50K+
                </p>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Serviços Realizados
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Categories;
