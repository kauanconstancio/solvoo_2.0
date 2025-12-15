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
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MoreHorizontal, Eye, Trash2, Pause, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Service {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  price: string;
  status: string;
  city: string;
  state: string;
  views_count: number;
  favorites_count: number;
  verified: boolean;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

export const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os serviços.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const updateServiceStatus = async (serviceId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ status })
        .eq('id', serviceId);

      if (error) throw error;

      // Log the action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: `update_service_status_${status}`,
          target_type: 'service',
          target_id: serviceId,
          details: { status },
        });
      }

      toast({
        title: 'Sucesso',
        description: 'Status do serviço atualizado.',
      });

      fetchServices();
    } catch (error) {
      console.error('Error updating service status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do serviço.',
        variant: 'destructive',
      });
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      // Log the action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'delete_service',
          target_type: 'service',
          target_id: serviceId,
        });
      }

      toast({
        title: 'Sucesso',
        description: 'Serviço excluído.',
      });

      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o serviço.',
        variant: 'destructive',
      });
    }
  };

  const filteredServices = services.filter((service) =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-accent">Ativo</Badge>;
      case 'paused':
        return <Badge variant="secondary">Pausado</Badge>;
      case 'removed':
        return <Badge variant="destructive">Removido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Gestão de Serviços" description="Gerencie todos os serviços da plataforma">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestão de Serviços" description="Gerencie todos os serviços da plataforma">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {service.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{service.category}</Badge>
                  </TableCell>
                  <TableCell>{service.profiles?.full_name || '-'}</TableCell>
                  <TableCell>R$ {service.price}</TableCell>
                  <TableCell>{getStatusBadge(service.status)}</TableCell>
                  <TableCell>{service.views_count}</TableCell>
                  <TableCell>
                    {new Date(service.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/servico/${service.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver serviço
                          </Link>
                        </DropdownMenuItem>
                        {service.status === 'active' ? (
                          <DropdownMenuItem
                            onClick={() => updateServiceStatus(service.id, 'paused')}
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => updateServiceStatus(service.id, 'active')}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Ativar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => deleteService(service.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredServices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhum serviço encontrado.
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

export default AdminServices;
