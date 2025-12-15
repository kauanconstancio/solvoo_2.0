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
import { Search, MoreHorizontal, Eye, Trash2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  service_id: string;
  profiles?: {
    full_name: string | null;
  } | null;
  services?: {
    title: string;
  } | null;
}

export const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (full_name),
          services:service_id (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as avaliações.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      // Log the action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'delete_review',
          target_type: 'review',
          target_id: reviewId,
        });
      }

      toast({
        title: 'Sucesso',
        description: 'Avaliação excluída.',
      });

      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a avaliação.',
        variant: 'destructive',
      });
    }
  };

  const filteredReviews = reviews.filter((review) =>
    review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.services?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout title="Moderação de Avaliações" description="Gerencie as avaliações da plataforma">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Moderação de Avaliações" description="Gerencie as avaliações da plataforma">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar avaliações..."
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
                <TableHead>Usuário</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead className="max-w-[300px]">Comentário</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">
                    {review.profiles?.full_name || 'Anônimo'}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/servico/${review.service_id}`}
                      className="text-primary hover:underline max-w-[150px] truncate block"
                    >
                      {review.services?.title || 'Serviço removido'}
                    </Link>
                  </TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {review.comment || <span className="text-muted-foreground">Sem comentário</span>}
                  </TableCell>
                  <TableCell>
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
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
                          <Link to={`/servico/${review.service_id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver serviço
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteReview(review.id)}
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
              {filteredReviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma avaliação encontrada.
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

export default AdminReviews;
