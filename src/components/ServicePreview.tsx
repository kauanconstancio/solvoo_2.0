import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, MapPin, Star, Calendar, Clock, User } from 'lucide-react';
import { getCategoryConfig } from '@/data/categoryIcons';

interface ServicePreviewProps {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: string;
  priceType: string;
  state: string;
  city: string;
  images: string[];
  providerName?: string;
  disabled?: boolean;
}

export const ServicePreview = ({
  title,
  description,
  category,
  subcategory,
  price,
  priceType,
  state,
  city,
  images,
  providerName = 'Você',
  disabled = false,
}: ServicePreviewProps) => {
  const categoryLabel = getCategoryConfig(category)?.label || category;
  const priceTypeLabels: Record<string, string> = {
    fixed: 'Preço fixo',
    hourly: 'Por hora',
    daily: 'Por dia',
    negotiable: 'A combinar',
  };

  const formatPrice = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'A combinar';
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled} className="gap-2">
          <Eye className="h-4 w-4" />
          Pré-visualizar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Pré-visualização do Anúncio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Card Preview */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Como aparecerá na listagem:</h3>
            <div className="border rounded-lg overflow-hidden max-w-sm">
              <div className="aspect-video bg-muted relative">
                {images.length > 0 ? (
                  <img
                    src={images[0]}
                    alt={title || 'Imagem do serviço'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Sem imagem
                  </div>
                )}
                {images.length > 1 && (
                  <Badge className="absolute bottom-2 right-2 bg-black/70">
                    +{images.length - 1} fotos
                  </Badge>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {categoryLabel}
                  </Badge>
                  {subcategory && (
                    <Badge variant="outline" className="text-xs">
                      {subcategory}
                    </Badge>
                  )}
                </div>
                <h4 className="font-semibold line-clamp-2">{title || 'Título do serviço'}</h4>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{city && state ? `${city}, ${state}` : 'Localização não definida'}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>Novo</span>
                  </div>
                  <span className="font-bold text-primary">
                    {price ? formatPrice(price) : 'A combinar'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Preview */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Página de detalhes:</h3>
            <div className="border rounded-lg p-6 space-y-6">
              {/* Images Gallery Preview */}
              <div className="grid grid-cols-4 gap-2">
                {images.length > 0 ? (
                  <>
                    <div className="col-span-4 md:col-span-2 row-span-2 aspect-video rounded-lg overflow-hidden bg-muted">
                      <img src={images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    {images.slice(1, 5).map((img, idx) => (
                      <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-muted hidden md:block">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="col-span-4 aspect-video rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    Adicione imagens para visualizar
                  </div>
                )}
              </div>

              {/* Service Info */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{categoryLabel}</Badge>
                  {subcategory && <Badge variant="outline">{subcategory}</Badge>}
                </div>
                
                <h2 className="text-2xl font-bold">{title || 'Título do serviço'}</h2>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {city && state ? `${city}, ${state}` : 'Localização não definida'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Publicado hoje
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    {price ? formatPrice(price) : 'A combinar'}
                  </span>
                  <span className="text-muted-foreground">
                    {priceTypeLabels[priceType] || priceType}
                  </span>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {description || 'Adicione uma descrição para o seu serviço...'}
                  </p>
                </div>

                {/* Provider Card Preview */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">Sobre o profissional</h3>
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{providerName}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>Novo na plataforma</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Clock className="h-4 w-4" />
                        <span>Membro desde hoje</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
