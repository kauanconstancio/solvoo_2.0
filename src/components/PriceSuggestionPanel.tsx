import { TrendingUp, TrendingDown, Minus, Lightbulb, MapPin, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PriceSuggestion {
  recommended: number;
  range: {
    min: number;
    max: number;
  };
  market: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
  localMarket: {
    avg: number;
    count: number;
  } | null;
}

interface PriceSuggestionPanelProps {
  suggestion: PriceSuggestion;
  insight: string;
  servicesAnalyzed: number;
  currentPrice?: string;
  onApplyPrice: (price: number) => void;
  onClose: () => void;
}

export const PriceSuggestionPanel = ({
  suggestion,
  insight,
  servicesAnalyzed,
  currentPrice,
  onApplyPrice,
  onClose,
}: PriceSuggestionPanelProps) => {
  const currentPriceNum = currentPrice ? parseFloat(currentPrice.replace(/[^\d.,]/g, '').replace(',', '.')) : 0;
  
  const getPriceComparison = () => {
    if (!currentPriceNum || currentPriceNum === 0) return null;
    const diff = ((currentPriceNum - suggestion.market.avg) / suggestion.market.avg) * 100;
    
    if (diff > 15) return { icon: TrendingUp, text: 'Acima da média', color: 'text-orange-500' };
    if (diff < -15) return { icon: TrendingDown, text: 'Abaixo da média', color: 'text-blue-500' };
    return { icon: Minus, text: 'Na média', color: 'text-green-500' };
  };

  const comparison = getPriceComparison();

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h4 className="font-semibold">Análise de Mercado</h4>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 px-2 text-xs">
          Fechar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Baseado em {servicesAnalyzed} serviços similares
      </p>

      {/* Recommended Price */}
      <div className="bg-primary/10 rounded-lg p-3 text-center">
        <p className="text-xs text-muted-foreground mb-1">Preço Recomendado</p>
        <p className="text-2xl font-bold text-primary">
          R$ {suggestion.recommended.toLocaleString('pt-BR')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Faixa sugerida: R$ {suggestion.range.min.toLocaleString('pt-BR')} - R$ {suggestion.range.max.toLocaleString('pt-BR')}
        </p>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-background rounded p-2">
          <p className="text-xs text-muted-foreground">Mínimo</p>
          <p className="font-medium">R$ {suggestion.market.min.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-background rounded p-2">
          <p className="text-xs text-muted-foreground">Máximo</p>
          <p className="font-medium">R$ {suggestion.market.max.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-background rounded p-2">
          <p className="text-xs text-muted-foreground">Média</p>
          <p className="font-medium">R$ {suggestion.market.avg.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-background rounded p-2">
          <p className="text-xs text-muted-foreground">Mediana</p>
          <p className="font-medium">R$ {suggestion.market.median.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Local Market */}
      {suggestion.localMarket && (
        <div className="flex items-center gap-2 p-2 bg-background rounded text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Média na sua região ({suggestion.localMarket.count} serviços)</p>
            <p className="font-medium">R$ {suggestion.localMarket.avg.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      )}

      {/* Current Price Comparison */}
      {comparison && currentPriceNum > 0 && (
        <div className={cn("flex items-center gap-2 p-2 rounded text-sm", comparison.color)}>
          <comparison.icon className="h-4 w-4" />
          <span>Seu preço atual está {comparison.text.toLowerCase()} do mercado</span>
        </div>
      )}

      {/* AI Insight */}
      {insight && (
        <div className="flex gap-2 p-3 bg-background rounded-lg">
          <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{insight}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onApplyPrice(suggestion.range.min)}
        >
          Usar mínimo
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => onApplyPrice(suggestion.recommended)}
        >
          Usar recomendado
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onApplyPrice(suggestion.range.max)}
        >
          Usar máximo
        </Button>
      </div>
    </div>
  );
};
