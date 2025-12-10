import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getServiceLabel } from "@/data/services";

interface Favorite {
  id: string;
  service_id: string;
  service_title: string;
  service_category: string | null;
  service_subcategory: string | null;
  service_image: string | null;
  service_price: string | null;
  service_provider: string | null;
  created_at: string;
}

const Favorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado para ver seus favoritos");
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchFavorites();
    };

    checkAuth();
  }, [navigate]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar favoritos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const { error } = await supabase.from("favorites").delete().eq("id", id);

      if (error) throw error;

      setFavorites(favorites.filter((fav) => fav.id !== id));
      toast.success("Favorito removido com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao remover favorito");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 hover:gradient-primary transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <h1 className="text-3xl font-heading font-bold">Meus Favoritos</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Serviços que você salvou para ver depois
          </p>
        </div>

        {favorites.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Heart className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Nenhum favorito ainda
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                Explore os serviços disponíveis e salve seus favoritos aqui
              </p>
              <Link to="/categorias">
                <Button>Explorar Serviços</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => (
              <Card
                key={favorite.id}
                className="group overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-video bg-muted">
                  {favorite.service_image ? (
                    <img
                      src={favorite.service_image}
                      alt={favorite.service_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 transition-opacity"
                    onClick={() => removeFavorite(favorite.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                    {favorite.service_category && (
                      <Badge className="bg-background/70 backdrop-blur text-foreground hover:bg-background/90">
                        {getServiceLabel(favorite.service_category)}
                      </Badge>
                    )}
                    {favorite.service_subcategory && (
                      <Badge variant="outline" className="bg-background/70 backdrop-blur text-foreground hover:bg-background/90">
                        {favorite.service_subcategory}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors line-clamp-2">
                    {favorite.service_title}
                  </h3>
                  {favorite.service_provider && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {favorite.service_provider}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        A partir de
                      </p>
                      {favorite.service_price && (
                        <p className="text-primary font-bold">
                          {favorite.service_price}
                        </p>
                      )}
                    </div>
                    <Link to={`/servico/${favorite.service_id}`}>
                      <Button className="hover:brightness-110 text-xs md:text-sm px-3 md:px-4 bg-primary text-primary-foreground">
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
