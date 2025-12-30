import { Home, Search, PlusCircle, MessageSquare, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Heart,
  LogOut,
  BarChart3,
  Pencil,
  Shield,
  Sun,
  Moon,
  Laptop,
  Wallet,
  Briefcase,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useTheme } from "./ThemeProvider";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

const BottomNavigation = () => {
  const location = useLocation();
  const { unreadCount } = useUnreadMessages();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { hasAnyRole } = useUserRole();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    setIsMenuOpen(false);

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

  const isActive = (path: string) => {
    if (path === "/chat") return location.pathname.startsWith("/chat");
    return location.pathname === path;
  };

  const navItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/busca", icon: Search, label: "Buscar" },
    { path: "/anunciar", icon: PlusCircle, label: "Anunciar", highlight: true },
    { path: "/chat", icon: MessageSquare, label: "Chat", badge: unreadCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t lg:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
              isActive(item.path)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative">
              {item.highlight ? (
                <div className="p-1.5 rounded-full bg-primary text-primary-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
              ) : (
                <item.icon className="h-5 w-5" />
              )}
              {Number(item.badge ?? 0) > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center"
                >
                  {Number(item.badge) > 99 ? "99+" : Number(item.badge)}
                </Badge>
              )}
            </div>
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        ))}

        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <button
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isMenuOpen
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <img
                  src="/solvoo_favicon.png"
                  alt="Logo"
                  className="h-7 w-7 rounded-lg"
                />
                Menu
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-100px)] pb-8 scrollbar-hide">
              {user ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt="Avatar"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{getUserDisplayName()}</span>
                    <span className="text-sm text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full" size="lg">
                    <User className="h-4 w-4 mr-2" />
                    Entrar / Cadastrar
                  </Button>
                </Link>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Link to="/favoritos" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full h-auto py-3 flex-col gap-1"
                  >
                    <Heart className="h-5 w-5" />
                    <span className="text-xs">Favoritos</span>
                  </Button>
                </Link>
                <Link to="/categorias" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full h-auto py-3 flex-col gap-1"
                  >
                    <Search className="h-5 w-5" />
                    <span className="text-xs">Categorias</span>
                  </Button>
                </Link>
              </div>

              {user && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
                    Minha Conta
                  </p>
                  <div className="grid gap-2">
                    <Link to="/perfil" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="h-4 w-4 mr-3" />
                        Meu Perfil
                      </Button>
                    </Link>
                    <Link to="/meus-servicos" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Briefcase className="h-4 w-4 mr-3" />
                        Meus Serviços
                      </Button>
                    </Link>
                    <Link to="/carteira" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Wallet className="h-4 w-4 mr-3" />
                        Minha Carteira
                      </Button>
                    </Link>
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <BarChart3 className="h-4 w-4 mr-3" />
                        Dashboard
                      </Button>
                    </Link>
                    {hasAnyRole && (
                      <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <Shield className="h-4 w-4 mr-3" />
                          Painel Admin
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
                  Tema
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="h-4 w-4 mr-1" />
                    Claro
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="h-4 w-4 mr-1" />
                    Escuro
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setTheme("system")}
                  >
                    <Laptop className="h-4 w-4 mr-1" />
                    Auto
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
                  Informações
                </p>
                <div className="grid gap-2">
                  <Link to="/como-funciona" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Como Funciona
                    </Button>
                  </Link>
                  <Link to="/para-profissionais" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Para Profissionais
                    </Button>
                  </Link>
                  <Link to="/ajuda" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Ajuda
                    </Button>
                  </Link>
                </div>
              </div>

              {user && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da Conta
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default BottomNavigation;
