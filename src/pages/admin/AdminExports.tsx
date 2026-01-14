import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExportReports } from "@/hooks/useExportReports";
import { Download, Users, Briefcase, CreditCard, Star, Calendar, FileSpreadsheet, Loader2 } from "lucide-react";

const reportTypes = [
  {
    id: 'users',
    title: 'Usuários',
    description: 'Lista completa de usuários cadastrados com dados de perfil',
    icon: Users,
    color: 'bg-blue-500/10 text-blue-500'
  },
  {
    id: 'services',
    title: 'Serviços',
    description: 'Todos os serviços cadastrados com estatísticas',
    icon: Briefcase,
    color: 'bg-purple-500/10 text-purple-500'
  },
  {
    id: 'transactions',
    title: 'Transações',
    description: 'Histórico financeiro completo da plataforma',
    icon: CreditCard,
    color: 'bg-green-500/10 text-green-500'
  },
  {
    id: 'reviews',
    title: 'Avaliações',
    description: 'Todas as avaliações com notas e comentários',
    icon: Star,
    color: 'bg-yellow-500/10 text-yellow-500'
  },
  {
    id: 'appointments',
    title: 'Agendamentos',
    description: 'Histórico de agendamentos e seus status',
    icon: Calendar,
    color: 'bg-orange-500/10 text-orange-500'
  }
] as const;

export const AdminExports = () => {
  const { isExporting, exportReport } = useExportReports();

  return (
    <AdminLayout 
      title="Exportar Relatórios" 
      description="Exporte dados da plataforma em formato CSV"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <CardTitle className="text-lg mt-3">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled={isExporting}
                  onClick={() => exportReport(report.id)}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar CSV
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Sobre os Relatórios</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Os arquivos são exportados em formato CSV, compatível com Excel e Google Sheets</li>
                <li>• Os dados incluem todas as informações disponíveis no momento da exportação</li>
                <li>• Datas estão formatadas no padrão brasileiro (DD/MM/AAAA)</li>
                <li>• Valores monetários estão em Reais (R$)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminExports;
