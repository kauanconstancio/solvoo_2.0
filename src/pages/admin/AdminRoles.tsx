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
import { Card, CardContent } from '@/components/ui/card';
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
import { Search, Plus, Trash2, Shield, UserCog, Users } from 'lucide-react';

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
      
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url');

      if (profilesError) throw profilesError;

      setProfiles(profilesData || []);

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
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Administrador</Badge>;
      case 'moderator':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Moderador</Badge>;
      case 'support':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Suporte</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const filteredRoles = userRoles.filter((ur) =>
    ur.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ur.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const usersWithoutRoles = profiles.filter(
    p => !userRoles.some(ur => ur.user_id === p.user_id)
  );

  if (isLoading) {
    return (
      <AdminLayout title="Gestão de Funções" description="Gerencie as funções administrativas">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  const adminCount = userRoles.filter(r => r.role === 'admin').length;
  const moderatorCount = userRoles.filter(r => r.role === 'moderator').length;
  const supportCount = userRoles.filter(r => r.role === 'support').length;

  return (
    <AdminLayout title="Gestão de Funções" description="Gerencie as funções administrativas">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Administradores</p>
                  <p className="text-2xl font-bold">{adminCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <UserCog className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Moderadores</p>
                  <p className="text-2xl font-bold">{moderatorCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Suporte</p>
                  <p className="text-2xl font-bold">{supportCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header Actions */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Função
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Roles explanation */}
        <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary" />
              Níveis de Permissão
            </h3>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-xs">Admin</Badge>
                <span>Acesso total a todas as funcionalidades do painel.</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">Moderador</Badge>
                <span>Gerencia serviços, avaliações e resolve denúncias.</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">Suporte</Badge>
                <span>Visualiza denúncias e auxilia usuários.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="font-semibold">Usuário</TableHead>
                <TableHead className="font-semibold">Função</TableHead>
                <TableHead className="font-semibold">Adicionado em</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((ur) => (
                <TableRow key={`${ur.user_id}-${ur.role}`} className="border-border/50 hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border-2 border-border">
                        <AvatarImage src={ur.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {ur.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{ur.profiles?.full_name || 'Sem nome'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(ur.role)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(ur.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRole(ur.user_id, ur.role)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRoles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhuma função encontrada.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Add Role Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Adicionar Função
            </DialogTitle>
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
