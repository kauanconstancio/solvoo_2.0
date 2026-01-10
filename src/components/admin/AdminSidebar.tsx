import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Star, 
  Flag, 
  Shield, 
  FileText,
  ChevronLeft,
  Wallet,
  TrendingUp,
  CreditCard,
  Sparkles,
  FileBarChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission: boolean;
}

export const AdminSidebar = () => {
  const location = useLocation();
  const { canManageUsers, canManageServices, canModerateReviews, canViewReports, canViewLogs, canManageRoles } = useUserRole();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="h-5 w-5" />,
      permission: true,
    },
    {
      label: 'Usuários',
      href: '/admin/usuarios',
      icon: <Users className="h-5 w-5" />,
      permission: canManageUsers,
    },
    {
      label: 'Serviços',
      href: '/admin/servicos',
      icon: <Briefcase className="h-5 w-5" />,
      permission: canManageServices,
    },
    {
      label: 'Avaliações',
      href: '/admin/avaliacoes',
      icon: <Star className="h-5 w-5" />,
      permission: canModerateReviews,
    },
    {
      label: 'Denúncias',
      href: '/admin/denuncias',
      icon: <Flag className="h-5 w-5" />,
      permission: canViewReports,
    },
    {
      label: 'Funções',
      href: '/admin/funcoes',
      icon: <Shield className="h-5 w-5" />,
      permission: canManageRoles,
    },
    {
      label: 'Saques',
      href: '/admin/saques',
      icon: <Wallet className="h-5 w-5" />,
      permission: canManageRoles,
    },
    {
      label: 'Financeiro',
      href: '/admin/financeiro',
      icon: <TrendingUp className="h-5 w-5" />,
      permission: canManageRoles,
    },
    {
      label: 'Planos',
      href: '/admin/planos',
      icon: <CreditCard className="h-5 w-5" />,
      permission: canManageRoles,
    },
    {
      label: 'Relatório Repasses',
      href: '/admin/relatorio-repasses',
      icon: <FileBarChart className="h-5 w-5" />,
      permission: canManageRoles,
    },
    {
      label: 'Logs',
      href: '/admin/logs',
      icon: <FileText className="h-5 w-5" />,
      permission: canViewLogs,
    },
  ];

  const filteredNavItems = navItems.filter(item => item.permission);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/50 bg-gradient-to-b from-card via-card to-muted/20 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-foreground font-heading">
              Admin
            </span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-all hover:gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/admin' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1'
                )}
              >
                <span className={cn(
                  'transition-transform duration-200',
                  isActive && 'scale-110'
                )}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Sistema Ativo</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
