import { User, Heart, MessageSquare, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <a href="/" className="flex items-center gap-2">
            <img
              src="/solvoo_favicon.png"
              alt="Logo"
              className="h-7 w-7 md:h-8 md:w-8 rounded-lg"
            />
            <span className="font-heading text-lg md:text-xl font-bold">
              Solvoo
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-6">
            <a
              href="/categorias"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
            >
              Categorias
            </a>
            <a
              href="/como-funciona"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
            >
              Como Funciona
            </a>
            <a
              href="/para-profissionais"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
            >
              Para Profissionais
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex hover:bg-primary hover:text-primary-foreground transition-smooth"
          >
            <Heart className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex hover:bg-primary hover:text-primary-foreground transition-smooth"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Link to="/auth">
            <Button
              variant="outline"
              className="hidden lg:flex hover:bg-primary hover:text-primary-foreground transition-smooth"
            >
              <User className="h-4 w-4 mr-2" />
              Entrar
            </Button>
          </Link>
          <Button className="hidden sm:flex hover:brightness-110 transition-smooth text-sm md:text-base">
            <a href="/anunciar">Anunciar</a>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover:gradient-primary transition-smooth hover:text-white"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <img
                    src="/solvoo_favicon.png"
                    alt="Logo"
                    className="h-7 w-7 md:h-8 md:w-8 rounded-lg"
                  />
                  Solvoo
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <nav className="space-y-2">
                  <a
                    href="/categorias"
                    className="block py-2 text-sm font-medium hover:text-primary transition-smooth"
                  >
                    Categorias
                  </a>
                  <a
                    href="/como-funciona"
                    className="block py-2 text-sm font-medium hover:text-primary transition-smooth"
                  >
                    Como Funciona
                  </a>
                  <a
                    href="/para-profissionais"
                    className="block py-2 text-sm font-medium hover:text-primary transition-smooth"
                  >
                    Para Profissionais
                  </a>
                </nav>
                <div className="pt-4 space-y-2 border-t">
                  <Link to="/auth">
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:gradient-primary transition-smooth hover:text-white"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Entrar
                    </Button>
                  </Link>
                  <Button className="w-full hover:brightness-110 sm:hidden">
                    Anunciar Serviço
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
