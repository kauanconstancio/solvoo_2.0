import {
  User,
  Heart,
  MessageSquare,
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
  Calendar,
  History,
  Tag,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
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
import { NotificationCenter } from "./NotificationCenter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

const Header = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfessional, setIsProfessional] = useState(false);
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessages();
  const { hasAnyRole } = useUserRole();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsProfessional(false);
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
      .select("full_name, avatar_url, account_type")
      .eq("user_id", userId)
      .single();

    if (data) {
      setProfile(data);
      setIsProfessional(data.account_type === 'profissional');
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
          {/* Notification Center - visible on all screens when logged in */}
          {user && <NotificationCenter />}
          
          <Link to="/favoritos">
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/chat" className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
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
                  className="hidden lg:flex items-center gap-2 h-10 px-2 rounded-full border-2 border-border focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer transition-smooth hover:bg-muted"
                >
                  <Link to="/calendario">
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendário
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer transition-smooth hover:bg-muted"
                >
                  <Link to="/historico">
                    <History className="mr-2 h-4 w-4" />
                    Histórico de Serviços
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer transition-smooth hover:bg-muted"
                >
                  <Link to="/promocoes">
                    <Tag className="mr-2 h-4 w-4" />
                    Minhas Promoções
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
                className="hidden lg:flex"
              >
                <User className="h-4 w-4 mr-2" />
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
