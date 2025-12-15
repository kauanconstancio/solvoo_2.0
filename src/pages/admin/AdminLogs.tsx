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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: unknown;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const AdminLogs = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch profiles separately
      const adminIds = [...new Set((data || []).map(l => l.admin_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', adminIds);

      const logsWithProfiles = (data || []).map(log => ({
        ...log,
        profiles: profilesData?.find(p => p.user_id === log.admin_id) || null,
      }));

      setLogs(logsWithProfiles);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os logs.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionLabel = (action: string) => {
    const actionLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      block_user: { label: 'Usuário bloqueado', variant: 'destructive' },
      unblock_user: { label: 'Usuário desbloqueado', variant: 'default' },
      delete_service: { label: 'Serviço excluído', variant: 'destructive' },
      update_service_status_paused: { label: 'Serviço pausado', variant: 'secondary' },
      update_service_status_active: { label: 'Serviço ativado', variant: 'default' },
      delete_review: { label: 'Avaliação excluída', variant: 'destructive' },
      resolve_report_resolved: { label: 'Denúncia resolvida', variant: 'default' },
      resolve_report_dismissed: { label: 'Denúncia descartada', variant: 'secondary' },
      add_role: { label: 'Função adicionada', variant: 'default' },
      remove_role: { label: 'Função removida', variant: 'destructive' },
    };

    return actionLabels[action] || { label: action, variant: 'outline' as const };
  };

  const getTargetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      user: 'Usuário',
      service: 'Serviço',
      review: 'Avaliação',
      report: 'Denúncia',
      user_role: 'Função',
    };
    return labels[type] || type;
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  if (isLoading) {
    return (
      <AdminLayout title="Logs de Atividade" description="Histórico de ações administrativas">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Logs de Atividade" description="Histórico de ações administrativas">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              {uniqueActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {getActionLabel(action).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administrador</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const actionInfo = getActionLabel(log.action);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {log.profiles?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {log.profiles?.full_name || 'Admin'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                    </TableCell>
                    <TableCell>{getTargetTypeLabel(log.target_type)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum log encontrado.
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

export default AdminLogs;
