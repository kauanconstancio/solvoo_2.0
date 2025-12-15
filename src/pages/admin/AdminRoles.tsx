import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/hooks/useUserRole';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Trash2, Shield } from 'lucide-react';

interface UserWithRole {
  user_id: string;
  role: AppRole;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export const AdminRoles = () => {
  const [userRoles, setUserRoles] = useState<UserWithRole[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const { toast } = useToast();

  const fetchUserRoles = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url');

      if (profilesError) throw profilesError;

      setProfiles(profilesData || []);

      // Map roles with profile info
      const rolesWithProfiles = (rolesData || []).map(role => ({
        ...role,
        profiles: profilesData?.find(p => p.user_id === role.user_id) || null,
      }));

      setUserRoles(rolesWithProfiles);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as funções.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const addRole = async () => {
    if (!selectedUserId || !selectedRole) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUserId,
          role: selectedRole,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Erro',
            description: 'Este usuário já possui esta função.',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      // Log the action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'add_role',
          target_type: 'user_role',
          target_id: selectedUserId,
          details: { role: selectedRole },
        });
      }

      toast({
        title: 'Sucesso',
        description: 'Função adicionada com sucesso.',
      });

      setIsAddDialogOpen(false);
      setSelectedUserId('');
      setSelectedRole('');
      fetchUserRoles();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a função.',
        variant: 'destructive',
      });
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    if (!confirm('Tem certeza que deseja remover esta função?')) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      // Log the action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'remove_role',
          target_type: 'user_role',
          target_id: userId,
          details: { role },
        });
      }

      toast({
        title: 'Sucesso',
        description: 'Função removida com sucesso.',
      });

      fetchUserRoles();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a função.',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-destructive">Administrador</Badge>;
      case 'moderator':
        return <Badge variant="default">Moderador</Badge>;
      case 'support':
        return <Badge variant="secondary">Suporte</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const filteredRoles = userRoles.filter((ur) =>
    ur.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ur.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get users without any roles for adding new roles
  const usersWithoutRoles = profiles.filter(
    p => !userRoles.some(ur => ur.user_id === p.user_id)
  );

  if (isLoading) {
    return (
      <AdminLayout title="Gestão de Funções" description="Gerencie as funções administrativas">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestão de Funções" description="Gerencie as funções administrativas">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Função
          </Button>
        </div>

        {/* Roles explanation */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="font-medium flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4" />
            Níveis de Permissão
          </h3>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-destructive">Administrador:</span> Acesso total a todas as funcionalidades do painel.</p>
            <p><span className="font-medium text-primary">Moderador:</span> Gerencia serviços, avaliações e resolve denúncias.</p>
            <p><span className="font-medium">Suporte:</span> Visualiza denúncias e auxilia usuários.</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Adicionado em</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((ur) => (
                <TableRow key={`${ur.user_id}-${ur.role}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={ur.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {ur.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{ur.profiles?.full_name || 'Sem nome'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(ur.role)}</TableCell>
                  <TableCell>
                    {new Date(ur.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRole(ur.user_id, ur.role)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRoles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhuma função encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Role Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Função</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Usuário</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {usersWithoutRoles.map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      {profile.full_name || 'Sem nome'}
                    </SelectItem>
                  ))}
                  {profiles.map((profile) => (
                    <SelectItem key={`all-${profile.user_id}`} value={profile.user_id}>
                      {profile.full_name || 'Sem nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Função</label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="moderator">Moderador</SelectItem>
                  <SelectItem value="support">Suporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addRole} disabled={!selectedUserId || !selectedRole}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRoles;
