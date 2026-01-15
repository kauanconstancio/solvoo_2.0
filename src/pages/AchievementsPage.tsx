import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNavigation from '@/components/BottomNavigation';
import { ProfessionalLevelCard } from '@/components/ProfessionalLevelCard';
import { ProfessionalBadges } from '@/components/ProfessionalBadges';
import { GoalProgress } from '@/components/GoalProgress';
import { ProfessionalRanking } from '@/components/ProfessionalRanking';
import { Trophy } from 'lucide-react';

const AchievementsPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Conquistas e Ranking
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e compare com outros profissionais
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <ProfessionalLevelCard />
            <GoalProgress />
            <ProfessionalBadges />
          </div>
          
          <div>
            <ProfessionalRanking />
          </div>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default AchievementsPage;
