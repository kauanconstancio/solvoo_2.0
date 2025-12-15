import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Star, 
  Flag, 
  Shield, 
  FileText,
  ChevronLeft
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
      label: 'Logs',
      href: '/admin/logs',
      icon: <FileText className="h-5 w-5" />,
      permission: canViewLogs,
    },
  ];

  const filteredNavItems = navItems.filter(item => item.permission);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="text-lg font-bold text-foreground font-heading">
            Admin Panel
          </span>
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/admin' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground">
            Painel Administrativo
          </p>
        </div>
      </div>
    </aside>
  );
};
