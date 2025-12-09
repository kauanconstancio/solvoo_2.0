import { User, Heart, MessageSquare, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

const Header = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/");
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

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
          <Link to="/favoritos">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex hover:bg-primary hover:text-primary-foreground transition-smooth"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex hover:bg-primary hover:text-primary-foreground transition-smooth"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden lg:flex relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url}
                      alt="Avatar"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem asChild>
                  <Link
                    to="/perfil"
                    className="flex items-center hover:bg-primary hover:text-primary-foreground transition-smooth"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground transition-smooth"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button
                variant="outline"
                className="hidden lg:flex hover:bg-primary hover:text-primary-foreground transition-smooth"
              >
                <User className="h-4 w-4 mr-2" />
                Entrar
              </Button>
            </Link>
          )}

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
                <div className="flex gap-2 pt-2">
                  <Link to="/favoritos" className="flex-1">
                    <Button variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-smooth">
                      <Heart className="h-4 w-4 mr-2" />
                      Favoritos
                    </Button>
                  </Link>
                  <Button variant="outline" className="flex-1 justify-start hover:bg-primary hover:text-primary-foreground transition-smooth">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Mensagens
                  </Button>
                </div>
                <div className="pt-4 space-y-2 border-t">
                  <Button className="w-full hover:brightness-110 sm:hidden">
                    Anunciar Serviço
                  </Button>
                  <div>
                    {user ? (
                      <>
                        <div className="flex items-center gap-3 py-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={user.user_metadata?.avatar_url}
                              alt="Avatar"
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {user.user_metadata?.name || "Usuário"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link to="/perfil">
                            <Button
                              variant="outline"
                              className="w-full justify-start hover:gradient-primary transition-smooth hover:text-white"
                            >
                              <User className="h-4 w-4 mr-2" />
                              Meu Perfil
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:bg-red-500 hover:text-white transition-smooth"
                            onClick={handleLogout}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sair
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Link to="/auth">
                        <Button
                          variant="outline"
                          className="w-full justify-start hover:gradient-primary transition-smooth hover:text-white"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Entrar
                        </Button>
                      </Link>
                    )}
                  </div>
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
