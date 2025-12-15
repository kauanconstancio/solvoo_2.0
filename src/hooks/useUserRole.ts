import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'moderator' | 'support';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const useUserRole = () => {
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isSupport, setIsSupport] = useState(false);
  const [hasAnyRole, setHasAnyRole] = useState(false);

  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setIsLoading(false);
          return;
        }

        const roleList = (roles || []).map(r => r.role as AppRole);
        setUserRoles(roleList);
        setIsAdmin(roleList.includes('admin'));
        setIsModerator(roleList.includes('moderator'));
        setIsSupport(roleList.includes('support'));
        setHasAnyRole(roleList.length > 0);
      } catch (error) {
        console.error('Error fetching user roles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRoles();
  }, []);

  const hasRole = (role: AppRole): boolean => userRoles.includes(role);

  const canManageUsers = isAdmin;
  const canManageServices = isAdmin || isModerator;
  const canModerateReviews = isAdmin || isModerator;
  const canViewReports = hasAnyRole;
  const canResolveReports = isAdmin || isModerator;
  const canViewLogs = isAdmin;
  const canManageRoles = isAdmin;

  return {
    userRoles,
    isLoading,
    isAdmin,
    isModerator,
    isSupport,
    hasAnyRole,
    hasRole,
    canManageUsers,
    canManageServices,
    canModerateReviews,
    canViewReports,
    canResolveReports,
    canViewLogs,
    canManageRoles,
  };
};
