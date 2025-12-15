import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: 'admin' | 'moderator' | 'support' | 'any';
}

export const AdminProtectedRoute = ({ 
  children, 
  requiredPermission = 'any' 
}: AdminProtectedRouteProps) => {
  const navigate = useNavigate();
  const { isLoading: rolesLoading, isAdmin, isModerator, isSupport, hasAnyRole } = useUserRole();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setIsAuthLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthLoading || rolesLoading) return;

    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    let hasPermission = false;

    switch (requiredPermission) {
      case 'admin':
        hasPermission = isAdmin;
        break;
      case 'moderator':
        hasPermission = isAdmin || isModerator;
        break;
      case 'support':
        hasPermission = isAdmin || isModerator || isSupport;
        break;
      case 'any':
      default:
        hasPermission = hasAnyRole;
        break;
    }

    if (!hasPermission) {
      navigate('/');
    }
  }, [isAuthLoading, rolesLoading, isAuthenticated, isAdmin, isModerator, isSupport, hasAnyRole, requiredPermission, navigate]);

  if (isAuthLoading || rolesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !hasAnyRole) {
    return null;
  }

  return <>{children}</>;
};
