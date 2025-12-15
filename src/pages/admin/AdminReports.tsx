import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
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
import { Textarea } from '@/components/ui/textarea';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Eye, CheckCircle, XCircle } from 'lucide-react';

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  reported_service_id: string | null;
  reported_review_id: string | null;
  reported_user_id: string | null;
  resolution_notes: string | null;
  created_at: string;
  reporter_id: string | null;
}

export const AdminReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const { toast } = useToast();
  const { canResolveReports } = useUserRole();

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as denúncias.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const resolveReport = async (status: 'resolved' | 'dismissed') => {
    if (!selectedReport) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('reports')
        .update({
          status,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes,
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      // Log the action
      if (user) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: `resolve_report_${status}`,
          target_type: 'report',
          target_id: selectedReport.id,
          details: { status, resolution_notes: resolutionNotes },
        });
      }

      toast({
        title: 'Sucesso',
        description: status === 'resolved' ? 'Denúncia resolvida.' : 'Denúncia descartada.',
      });

      setSelectedReport(null);
      setResolutionNotes('');
      fetchReports();
    } catch (error) {
      console.error('Error resolving report:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a denúncia.',
        variant: 'destructive',
      });
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'reviewed':
        return <Badge variant="outline">Em análise</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-accent">Resolvido</Badge>;
      case 'dismissed':
        return <Badge variant="destructive">Descartado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReportType = (report: Report) => {
    if (report.reported_service_id) return 'Serviço';
    if (report.reported_review_id) return 'Avaliação';
    if (report.reported_user_id) return 'Usuário';
    return 'Outro';
  };

  if (isLoading) {
    return (
      <AdminLayout title="Denúncias" description="Gerencie as denúncias da plataforma">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Denúncias" description="Gerencie as denúncias da plataforma">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar denúncias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="reviewed">Em análise</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
              <SelectItem value="dismissed">Descartado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="max-w-[300px]">Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Badge variant="outline">{getReportType(report)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{report.reason}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {report.description || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    {new Date(report.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma denúncia encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Report Details Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Denúncia</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">{getReportType(selectedReport)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Motivo</p>
                <p className="font-medium">{selectedReport.reason}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p>{selectedReport.description || 'Sem descrição'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(selectedReport.status)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p>{new Date(selectedReport.created_at).toLocaleString('pt-BR')}</p>
              </div>

              {selectedReport.status === 'pending' && canResolveReports && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div>
                    <p className="text-sm font-medium mb-2">Notas de resolução</p>
                    <Textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Adicione notas sobre a resolução..."
                    />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => resolveReport('dismissed')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Descartar
                    </Button>
                    <Button onClick={() => resolveReport('resolved')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolver
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {selectedReport.resolution_notes && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">Notas de resolução</p>
                  <p>{selectedReport.resolution_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReports;
