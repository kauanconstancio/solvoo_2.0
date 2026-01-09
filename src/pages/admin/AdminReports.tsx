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
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Eye, CheckCircle, XCircle, Flag, Clock, AlertTriangle } from 'lucide-react';

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

  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'reviewed':
        return <Badge variant="outline"><Eye className="h-3 w-3 mr-1" />Em análise</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />Resolvido</Badge>;
      case 'dismissed':
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20"><XCircle className="h-3 w-3 mr-1" />Descartado</Badge>;
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
    <AdminLayout title="Denúncias" description="Gerencie as denúncias da plataforma">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <Flag className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Denúncias</p>
                  <p className="text-2xl font-bold">{reports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{pendingReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resolvidas</p>
                  <p className="text-2xl font-bold">{resolvedReports}</p>
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
                  placeholder="Buscar denúncias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-background/50">
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
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Motivo</TableHead>
                  <TableHead className="font-semibold max-w-[300px]">Descrição</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} className="border-border/50 hover:bg-muted/50">
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{getReportType(report)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{report.reason}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                      {report.description || <span className="italic opacity-50">-</span>}
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                        className="hover:bg-muted"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      <Flag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Nenhuma denúncia encontrada.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Report Details Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              Detalhes da Denúncia
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                  <p className="font-medium">{getReportType(selectedReport)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(selectedReport.status)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Motivo</p>
                <p className="font-medium">{selectedReport.reason}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                <p>{selectedReport.description || 'Sem descrição'}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Data</p>
                <p>{new Date(selectedReport.created_at).toLocaleString('pt-BR')}</p>
              </div>

              {selectedReport.status === 'pending' && canResolveReports && (
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-sm font-medium mb-2">Notas de resolução</p>
                    <Textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Adicione notas sobre a resolução..."
                      className="bg-background/50"
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
                    <Button onClick={() => resolveReport('resolved')} className="bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolver
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {selectedReport.resolution_notes && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Notas de resolução</p>
                  <p className="p-3 rounded-lg bg-muted/50">{selectedReport.resolution_notes}</p>
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
