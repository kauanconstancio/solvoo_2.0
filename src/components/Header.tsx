import { Search, User, Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary" />
            <span className="font-heading text-xl font-bold">ServicoPro</span>
          </a>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
              Categorias
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
              Como Funciona
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
              Para Profissionais
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button variant="outline" className="hidden md:flex">
            <User className="h-4 w-4 mr-2" />
            Entrar
          </Button>
          <Button className="gradient-accent hover:brightness-110 transition-smooth">
            Anunciar Serviço
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
