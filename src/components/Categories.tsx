import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryConfig } from "@/data/categoryIcons";
import { useCategoryCounts } from "@/hooks/useCategoryCounts";

const Categories = () => {
  const navigate = useNavigate();
  const { counts, isLoading } = useCategoryCounts();

  // Sort categories by service count and show top 8
  const displayCategories = [...categoryConfig]
    .sort((a, b) => (counts[b.value] || 0) - (counts[a.value] || 0))
    .slice(0, 8);

  const handleCategoryClick = (categoryValue: string) => {
    navigate(`/busca?categoria=${categoryValue}`);
  };

  return (
    <section className="py-8 md:py-12">
      <div className="container px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
            Categorias Populares
          </h2>
          <p className="text-muted-foreground text-sm md:text-base lg:text-lg px-4">
            Encontre o profissional ideal para o que você precisa
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {displayCategories.map((category) => {
            const Icon = category.icon;
            const serviceCount = counts[category.value] || 0;

            return (
              <Card
                key={category.value}
                onClick={() => handleCategoryClick(category.value)}
                className="p-4 md:p-6 cursor-pointer hover:shadow-soft-lg hover:bg-card-hover hover:-translate-y-1 transition-smooth border-2"
              >
                <div className="flex flex-col items-center text-center gap-2 md:gap-3">
                  <div
                    className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-primary-light ${category.color}`}
                  >
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm md:text-base mb-1">
                      {category.label}
                    </h3>
                    {isLoading ? (
                      <Skeleton className="h-3 w-16 mx-auto" />
                    ) : (
                      <p className="text-xs text-muted-foreground sm:block">
                        {serviceCount} {serviceCount === 1 ? "serviço" : "serviços"}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
