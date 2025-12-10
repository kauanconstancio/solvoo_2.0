import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryConfig } from "@/data/categoryIcons";
import { useCategoryCounts } from "@/hooks/useCategoryCounts";

const Categories = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { counts, isLoading } = useCategoryCounts();

  const filteredCategories = categoryConfig.filter(
    (category) =>
      category.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.subcategories?.some((sub) =>
        sub.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const totalServices = Object.values(counts).reduce((sum, count) => sum + count, 0);

  const handleCategoryClick = (categoryValue: string) => {
    navigate(`/busca?categoria=${categoryValue}`);
  };

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
                plataforma.
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
                {filteredCategories.map((category) => {
                  const serviceCount = counts[category.value] || 0;

                  return (
                    <Card
                      key={category.value}
                      onClick={() => handleCategoryClick(category.value)}
                      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div
                            className={`w-12 h-12 rounded-xl bg-primary/10 ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                          >
                            <category.icon className="h-6 w-6" />
                          </div>
                          {isLoading ? (
                            <Skeleton className="h-5 w-20" />
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {serviceCount} {serviceCount === 1 ? "serviço" : "serviços"}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg mt-3">
                          {category.label}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1.5">
                          {category.subcategories?.slice(0, 4).map((sub, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                            >
                              {sub}
                            </Badge>
                          ))}
                          {category.subcategories && category.subcategories.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{category.subcategories.length - 4}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
                  {categoryConfig.length}
                </p>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Categorias
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  {categoryConfig.reduce((sum, c) => sum + (c.subcategories?.length || 0), 0)}+
                </p>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Subcategorias
                </p>
              </div>
              <div className="text-center">
                {isLoading ? (
                  <Skeleton className="h-10 w-16 mx-auto" />
                ) : (
                  <p className="text-3xl md:text-4xl font-bold text-primary">
                    {totalServices}
                  </p>
                )}
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Serviços Ativos
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  100%
                </p>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Cobertura Nacional
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
