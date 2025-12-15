import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MoreHorizontal, Ban, CheckCircle, Eye } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  account_type: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  status: string;
  created_at: string;
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: status === 'blocked' ? 'block_user' : 'unblock_user',
          target_type: 'user',
          target_id: userId,
          details: { status },
        });
      }

      toast({
        title: 'Sucesso',
        description: status === 'blocked' ? 'Usuário bloqueado.' : 'Usuário desbloqueado.',
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do usuário.',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter((user) =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-accent">Ativo</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Bloqueado</Badge>;
      case 'suspended':
        return <Badge variant="secondary">Suspenso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAccountTypeBadge = (type: string | null) => {
    switch (type) {
      case 'profissional':
        return <Badge variant="outline" className="border-primary text-primary">Profissional</Badge>;
      case 'cliente':
        return <Badge variant="outline">Cliente</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Gestão de Usuários" description="Gerencie todos os usuários da plataforma">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestão de Usuários" description="Gerencie todos os usuários da plataforma">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.full_name || 'Sem nome'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getAccountTypeBadge(user.account_type)}</TableCell>
                  <TableCell>
                    {user.city && user.state
                      ? `${user.city}, ${user.state}`
                      : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        {user.status === 'active' ? (
                          <DropdownMenuItem
                            onClick={() => updateUserStatus(user.user_id, 'blocked')}
                            className="text-destructive"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Bloquear
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => updateUserStatus(user.user_id, 'active')}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Desbloquear
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
