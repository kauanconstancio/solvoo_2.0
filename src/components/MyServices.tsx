import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, Edit, Trash2, MapPin, Calendar, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getServiceLabel } from "@/data/services";

interface Service {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  price: string;
  city: string;
  state: string;
  status: string;
  images: string[] | null;
  views_count: number;
  created_at: string;
}

const MyServices = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyServices = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        title: "Erro ao carregar serviços",
        description: "Não foi possível carregar seus anúncios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyServices();
  }, []);

  const handleDelete = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      setServices(services.filter((s) => s.id !== serviceId));
      toast({
        title: "Anúncio excluído",
        description: "Seu anúncio foi removido com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o anúncio.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="w-24 h-24 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Nenhum anúncio encontrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Você ainda não publicou nenhum serviço.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <Card key={service.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Image */}
              <div className="w-full sm:w-32 aspect-[4/3] sm:aspect-auto sm:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={service.images?.[0] || "/placeholder.svg"}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-foreground truncate">
                    {service.title}
                  </h3>
                  <Badge
                    variant={
                      service.status === "active" ? "default" : "secondary"
                    }
                    className="flex-shrink-0"
                  >
                    {service.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">
                    {getServiceLabel(service.category)}
                  </span>
                  {service.subcategory && (
                    <Badge variant="outline" className="text-xs">
                      {service.subcategory}
                    </Badge>
                  )}
                </div>

                <p className="text-primary font-semibold mb-2">
                  {service.price}
                </p>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {service.city}, {service.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {service.views_count} visualizações
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(service.created_at)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-1 sm:flex-none hover:bg-primary hover:text-primary-foreground transition-smooth"
                >
                  <Link to={`/servico/${service.id}`}>
                    <Eye className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Ver</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-1 sm:flex-none hover:bg-primary hover:text-primary-foreground transition-smooth"
                >
                  <Link to={`/editar-servico/${service.id}`}>
                    <Edit className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Editar</span>
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none text-destructive hover:text-white hover:bg-destructive transition-smooth"
                    >
                      <Trash2 className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Excluir</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O anúncio "
                        {service.title}" será permanentemente removido.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(service.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyServices;
