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
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MoreHorizontal, Eye, Trash2, Star, MessageSquare } from 'lucide-react';
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

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout title="Moderação de Avaliações" description="Gerencie as avaliações da plataforma">
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
    <AdminLayout title="Moderação de Avaliações" description="Gerencie as avaliações da plataforma">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Avaliações</p>
                  <p className="text-2xl font-bold">{reviews.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média Geral</p>
                  <p className="text-2xl font-bold">{averageRating}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Com Comentários</p>
                  <p className="text-2xl font-bold">{reviews.filter(r => r.comment).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar avaliações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="font-semibold">Usuário</TableHead>
                  <TableHead className="font-semibold">Serviço</TableHead>
                  <TableHead className="font-semibold">Nota</TableHead>
                  <TableHead className="font-semibold max-w-[300px]">Comentário</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id} className="border-border/50 hover:bg-muted/50">
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
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                      {review.comment || <span className="italic opacity-50">Sem comentário</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link to={`/servico/${review.service_id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver serviço
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteReview(review.id)}
                            className="text-destructive focus:text-destructive"
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
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Nenhuma avaliação encontrada.</p>
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

export default AdminReviews;
