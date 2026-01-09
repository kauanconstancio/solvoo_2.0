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
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, FileText, Activity, Clock } from 'lucide-react';

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
    const actionLabels: Record<string, { label: string; color: string }> = {
      block_user: { label: 'Usuário bloqueado', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
      unblock_user: { label: 'Usuário desbloqueado', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
      delete_service: { label: 'Serviço excluído', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
      update_service_status_paused: { label: 'Serviço pausado', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
      update_service_status_active: { label: 'Serviço ativado', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
      delete_review: { label: 'Avaliação excluída', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
      resolve_report_resolved: { label: 'Denúncia resolvida', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
      resolve_report_dismissed: { label: 'Denúncia descartada', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
      add_role: { label: 'Função adicionada', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      remove_role: { label: 'Função removida', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
      approve_withdrawal: { label: 'Saque aprovado', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
      reject_withdrawal: { label: 'Saque recusado', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
    };

    return actionLabels[action] || { label: action, color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
  };

  const getTargetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      user: 'Usuário',
      service: 'Serviço',
      review: 'Avaliação',
      report: 'Denúncia',
      user_role: 'Função',
      wallet_transaction: 'Saque',
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

  const todayLogs = logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;

  if (isLoading) {
    return (
      <AdminLayout title="Logs de Atividade" description="Histórico de ações administrativas">
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

  return (
    <AdminLayout title="Logs de Atividade" description="Histórico de ações administrativas">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Logs</p>
                  <p className="text-2xl font-bold">{logs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ações Hoje</p>
                  <p className="text-2xl font-bold">{todayLogs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipos de Ação</p>
                  <p className="text-2xl font-bold">{uniqueActions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[200px] bg-background/50">
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
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="font-semibold">Administrador</TableHead>
                  <TableHead className="font-semibold">Ação</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Detalhes</TableHead>
                  <TableHead className="font-semibold">Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const actionInfo = getActionLabel(log.action);
                  return (
                    <TableRow key={log.id} className="border-border/50 hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-border">
                            <AvatarImage src={log.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                              {log.profiles?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {log.profiles?.full_name || 'Admin'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={actionInfo.color}>{actionInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">{getTargetTypeLabel(log.target_type)}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs font-mono">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Nenhum log encontrado.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;
