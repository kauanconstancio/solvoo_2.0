import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ServicesMap } from '@/components/ServicesMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Map, List, Search, Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { categoryConfig } from '@/data/categoryIcons';
import { states } from '@/data/locations';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

interface Service {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  price: string;
  state: string;
  city: string;
  images?: string[];
}

const MapView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('services')
        .select('id, title, category, subcategory, price, state, city, images')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      if (selectedState) {
        query = query.eq('state', selectedState);
      }

      const { data, error } = await query;

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [selectedCategory, selectedState]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedState) params.set('state', selectedState);
    setSearchParams(params);
    fetchServices();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedState('');
    setSearchParams({});
  };

  const hasFilters = searchTerm || selectedCategory || selectedState;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Map className="h-7 w-7 text-primary" />
              Mapa de Serviços
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize serviços disponíveis na sua região
            </p>
          </div>

          <Link to="/busca">
            <Button variant="outline" className="gap-2">
              <List className="h-4 w-4" />
              Ver como lista
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-4 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoryConfig.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} className="gap-2">
              <Filter className="h-4 w-4" />
              Filtrar
            </Button>
          </div>

          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Busca: {searchTerm}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  {categoryConfig.find(c => c.value === selectedCategory)?.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
                </Badge>
              )}
              {selectedState && (
                <Badge variant="secondary" className="gap-1">
                  {states.find(s => s.value === selectedState)?.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedState('')} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                Limpar todos
              </Button>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="h-[600px] rounded-lg overflow-hidden border">
          <ServicesMap services={services} isLoading={isLoading} />
        </div>

        {/* Service count */}
        {!isLoading && (
          <p className="text-center text-muted-foreground mt-4">
            {services.length === 0 
              ? 'Nenhum serviço encontrado com os filtros selecionados.'
              : `Mostrando ${services.length} serviço${services.length !== 1 ? 's' : ''} no mapa`
            }
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MapView;
