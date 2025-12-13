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

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

const Header = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const handleLogout = async () => {
    setUser(null);
    setProfile(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error && !error.message?.toLowerCase().includes("session")) {
        console.error("Logout error:", error);
        toast.error("Erro ao sair. Tente novamente.");
        return;
      }

      toast.success("Logout realizado com sucesso!");
      navigate("/");
    } catch (error) {
      toast.success("Logout realizado com sucesso!");
      navigate("/");
    }
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.split(" ").filter(Boolean);
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0]?.[0]?.toUpperCase() || "U";
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getUserDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    return user?.email?.split("@")[0] || "Usuário";
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
              className="hidden lg:flex hover:bg-primary hover:text-primary-foreground transition-smooth"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/chat">
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex hover:bg-primary hover:text-primary-foreground transition-smooth"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </Link>

          <Button className="hidden lg:flex hover:brightness-110 transition-smooth text-sm md:text-base">
            <a href="/anunciar">Meus Anuncios</a>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden lg:flex items-center gap-2 h-10 px-2 rounded-full hover:gradient-primary"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt="Avatar"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {getUserDisplayName()}
                  </span>
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
                <div className="flex flex-col gap-2">
                  <Link to="/favoritos">
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-smooth"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Favoritos
                    </Button>
                  </Link>
                  <Link to="/chat">
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-smooth"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Mensagens
                    </Button>
                  </Link>
                </div>
                <div className="pt-4 space-y-2 border-t">
                  <Link to="/anunciar">
                    <Button className="w-full hover:brightness-110 transition-smooth text-sm md:text-base ">
                      Meus Anuncios
                    </Button>
                  </Link>
                  <div>
                    {user ? (
                      <>
                        <div className="flex items-center gap-3 py-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={profile?.avatar_url || undefined}
                              alt="Avatar"
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {getUserDisplayName()}
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
