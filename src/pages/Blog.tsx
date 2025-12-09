import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const blogPosts = [
  {
    id: 1,
    title: "Como se destacar como profissional na Solvoo",
    excerpt: "Dicas práticas para melhorar seu perfil e atrair mais clientes.",
    category: "Dicas",
    date: "10 Jan 2026",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 2,
    title: "Tendências do mercado de serviços para 2026",
    excerpt: "Descubra quais serviços estarão em alta este ano.",
    category: "Mercado",
    date: "8 Jan 2026",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 3,
    title: "A importância das avaliações para seu negócio",
    excerpt: "Entenda como as avaliações podem impulsionar seu sucesso.",
    category: "Crescimento",
    date: "5 Jan 2026",
    readTime: "4 min",
    image: "https://images.unsplash.com/photo-1553484771-371a605b060b?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 4,
    title: "Precificação inteligente: como definir seus valores",
    excerpt: "Aprenda estratégias para precificar seus serviços.",
    category: "Finanças",
    date: "3 Jan 2026",
    readTime: "6 min",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 5,
    title: "Marketing digital para profissionais autônomos",
    excerpt: "Estratégias de divulgação para conquistar novos clientes.",
    category: "Marketing",
    date: "1 Jan 2026",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 6,
    title: "Como oferecer um atendimento excepcional",
    excerpt: "Técnicas para encantar seus clientes.",
    category: "Atendimento",
    date: "28 Dez 2025",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop&q=60",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Blog Solvoo
              </h1>
              <p className="text-muted-foreground">
                Dicas, tendências e novidades para profissionais e clientes.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-smooth group">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <Badge variant="secondary" className="w-fit">
                      {post.category}
                    </Badge>
                    <h2 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary p-0 h-auto">
                      Ler mais
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
