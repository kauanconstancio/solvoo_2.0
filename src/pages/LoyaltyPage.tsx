import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNavigation from '@/components/BottomNavigation';
import { LoyaltyCard } from '@/components/LoyaltyCard';
import { LoyaltyHistory } from '@/components/LoyaltyHistory';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Gift, ShoppingBag, Sparkles } from 'lucide-react';

const LoyaltyPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            Programa de Fidelidade
          </h1>
          <p className="text-muted-foreground">
            Acumule pontos e troque por descontos incríveis
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <LoyaltyCard />
            
            {/* Como funciona */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Como funciona?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">Contrate serviços</div>
                      <div className="text-sm text-muted-foreground">
                        Ganhe 1 ponto para cada R$ 1 gasto em serviços
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">Acumule pontos</div>
                      <div className="text-sm text-muted-foreground">
                        Seus pontos são creditados automaticamente após a confirmação do serviço
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                      <Gift className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">Troque por descontos</div>
                      <div className="text-sm text-muted-foreground">
                        A partir de 100 pontos, troque por descontos (cada ponto = R$ 0,01)
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <LoyaltyHistory />
          </div>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default LoyaltyPage;
