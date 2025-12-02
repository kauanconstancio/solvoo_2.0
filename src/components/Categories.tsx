import { Sparkles, Camera, Wrench, Droplet, Zap, Paintbrush, Laptop, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";

const categories = [
  { icon: Sparkles, name: "Limpeza", count: "234 profissionais", color: "text-blue-500" },
  { icon: Camera, name: "Fotografia", count: "189 profissionais", color: "text-purple-500" },
  { icon: Wrench, name: "Mecânica", count: "156 profissionais", color: "text-orange-500" },
  { icon: Droplet, name: "Encanador", count: "203 profissionais", color: "text-cyan-500" },
  { icon: Zap, name: "Eletricista", count: "178 profissionais", color: "text-yellow-500" },
  { icon: Paintbrush, name: "Pintura", count: "145 profissionais", color: "text-pink-500" },
  { icon: Laptop, name: "TI & Suporte", count: "267 profissionais", color: "text-indigo-500" },
  { icon: Truck, name: "Mudanças", count: "98 profissionais", color: "text-green-500" },
];

const Categories = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Categorias Populares
          </h2>
          <p className="text-muted-foreground text-lg">
            Encontre o profissional ideal para o que você precisa
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.name}
                className="p-6 cursor-pointer hover:shadow-soft-lg hover:bg-card-hover hover:-translate-y-1 transition-smooth border-2"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`p-4 rounded-2xl bg-primary-light ${category.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.count}</p>
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
