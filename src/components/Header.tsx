import { User, Heart, MessageSquare, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <a href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg gradient-primary" />
            <span className="font-heading text-lg md:text-xl font-bold">ServicoPro</span>
          </a>
          
          <nav className="hidden lg:flex items-center gap-6">
            <a href="#categorias" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
              Categorias
            </a>
            <a href="#como-funciona" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
              Como Funciona
            </a>
            <a href="#profissionais" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
              Para Profissionais
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button variant="outline" className="hidden lg:flex">
            <User className="h-4 w-4 mr-2" />
            Entrar
          </Button>
          <Button className="hidden sm:flex gradient-accent hover:brightness-110 transition-smooth text-sm md:text-base">
            Anunciar
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="container py-4 space-y-3">
            <a href="#categorias" className="block py-2 text-sm font-medium hover:text-primary transition-smooth">
              Categorias
            </a>
            <a href="#como-funciona" className="block py-2 text-sm font-medium hover:text-primary transition-smooth">
              Como Funciona
            </a>
            <a href="#profissionais" className="block py-2 text-sm font-medium hover:text-primary transition-smooth">
              Para Profissionais
            </a>
            <div className="pt-3 space-y-2 border-t">
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Entrar
              </Button>
              <Button className="w-full gradient-accent hover:brightness-110 sm:hidden">
                Anunciar Serviço
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
