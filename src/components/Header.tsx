import {
  User,
  Heart,
  MessageSquare,
  Menu,
  LogOut,
  BarChart3,
  ChevronDown,
  Pencil,
  Shield,
  Sun,
  Moon,
  Laptop,
  Wallet,
  Briefcase,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useUserRole } from "@/hooks/useUserRole";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

const Header = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessages();
  const { hasAnyRole } = useUserRole();
  const { setTheme } = useTheme();

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
          <Link to="/chat" className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex hover:bg-primary hover:text-primary-foreground transition-smooth"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs hidden lg:flex items-center justify-center"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="hidden lg:flex items-center gap-2 h-10 px-2 rounded-full border-2 border-border hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-smooth focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt="Avatar"
                    />
                    <AvatarFallback className="bg-primary border-[1px] border-white text-primary-foreground text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {getUserDisplayName()}
                  </span>
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 flex flex-col" align="end">
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer transition-smooth hover:bg-muted"
                >
                  <Link to="/perfil">
                    <User className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer transition-smooth hover:bg-muted"
                >
                  <Link to="/anunciar">
                    <Pencil className="mr-2 h-4 w-4" />
                    Meus Anúncios
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer transition-smooth hover:bg-muted"
                >
                  <Link to="/carteira">
                    <Wallet className="mr-2 h-4 w-4" />
                    Minha Carteira
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer transition-smooth hover:bg-muted"
                >
                  <Link to="/meus-servicos">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Meus Serviços
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer transition-smooth hover:bg-muted"
                >
                  <Link to="/dashboard">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {hasAnyRole && (
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer transition-smooth"
                  >
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Painel Admin
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer transition-smooth focus:bg-muted data-[state=open]:bg-muted hover:bg-muted">
                    <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="ml-2">Tema</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => setTheme("light")}
                      className="cursor-pointer hover:bg-muted transition-smooth"
                    >
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Claro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTheme("dark")}
                      className="cursor-pointer hover:bg-muted transition-smooth"
                    >
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Escuro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTheme("system")}
                      className="cursor-pointer hover:bg-muted transition-smooth"
                    >
                      <Laptop className="mr-2 h-4 w-4" />
                      <span>Sistema</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground transition-smooth focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-5 px-1 flex gap-2 items-center hover:bg-transparent"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
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
                className="lg:hidden hover:bg-primary hover:text-primary-foreground transition-smooth"
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
                  <Link to="/chat" className="relative w-full">
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-smooth"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Mensagens
                      {unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-auto h-5 min-w-5 px-1 text-xs"
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                </div>
                <div className="pt-4 space-y-2 border-t">
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
                              className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-smooth"
                            >
                              <User className="h-4 w-4 mr-2" />
                              Meu Perfil
                            </Button>
                          </Link>
                          <Link to="/dashboard">
                            <Button
                              variant="outline"
                              className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-smooth"
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Dashboard
                            </Button>
                          </Link>
                          <Link to="/anunciar">
                            <Button
                              variant="outline"
                              className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-smooth"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Meus Anúncios
                            </Button>
                          </Link>
                          <Link to="/carteira">
                            <Button
                              variant="outline"
                              className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-smooth"
                            >
                              <Wallet className="mr-2 h-4 w-4" />
                              Minha Carteira
                            </Button>
                          </Link>
                          <Link to="/meus-servicos">
                            <Button
                              variant="outline"
                              className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-smooth"
                            >
                              <Briefcase className="mr-2 h-4 w-4" />
                              Meus Serviços
                            </Button>
                          </Link>
                          {hasAnyRole && (
                            <Link to="/admin">
                              <Button
                                variant="outline"
                                className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-smooth"
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Painel Admin
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="destructive"
                            className="w-full justify-start"
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
