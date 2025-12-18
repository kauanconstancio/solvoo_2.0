import { useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Mock Data
const MOCK_TRANSACTIONS = [
  {
    id: "tx_1",
    type: "credit",
    amount: 150.0,
    fee: 15.0,
    description: "Pagamento - Limpeza Residencial",
    date: "2024-03-15T14:30:00",
    status: "completed",
    customer: "Alice Silva",
  },
  {
    id: "tx_2",
    type: "credit",
    amount: 200.0,
    fee: 20.0,
    description: "Pagamento - Manutenção Elétrica",
    date: "2024-03-14T10:00:00",
    status: "completed",
    customer: "Roberto Santos",
  },
  {
    id: "tx_3",
    type: "debit",
    amount: 500.0,
    fee: 0,
    description: "Saque para conta bancária",
    date: "2024-03-10T09:00:00",
    status: "completed",
    destination: "Banco Inter **** 1234",
  },
  {
    id: "tx_4",
    type: "credit",
    amount: 350.0,
    fee: 35.0,
    description: "Pagamento - Instalação de Ar Condicionado",
    date: "2024-03-08T16:45:00",
    status: "completed",
    customer: "Marina Costa",
  },
  {
    id: "tx_5",
    type: "credit",
    amount: 100.0,
    fee: 10.0,
    description: "Pagamento - Reparo Hidráulico",
    date: "2024-03-05T11:20:00",
    status: "pending", // Payment created but not yet available
    customer: "João Pereira",
  },
];

const MOCK_CHART_DATA = [
  { date: "10/03", amount: 0 },
  { date: "11/03", amount: 150 },
  { date: "12/03", amount: 350 },
  { date: "13/03", amount: 200 },
  { date: "14/03", amount: 550 },
  { date: "15/03", amount: 400 },
  { date: "16/03", amount: 650 },
];

const WalletPage = () => {
  const [balance] = useState(1245.5);
  const [pendingBalance] = useState(100.0);
  const [period, setPeriod] = useState("7");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Wallet className="h-8 w-8 text-primary" />
                Carteira Digital
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie seus ganhos e saques
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Solicitar Saque
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-primary text-primary-foreground border-none shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <DollarSign className="h-32 w-32" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-primary-foreground/80 font-medium mb-1">
                  Saldo Disponível
                </p>
                <div className="text-4xl font-bold mb-4">
                  {formatCurrency(balance)}
                </div>
                <div className="flex items-center gap-2 text-sm w-fit px-2 py-1 rounded-md text-green-500 bg-green-700/60 font-medium">
                  <TrendingUp className="h-4 w-4" />
                  <span>+15% este mês</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10"
                  >
                    Em processamento
                  </Badge>
                </div>
                <p className="text-muted-foreground font-medium text-sm mb-1">
                  A receber
                </p>
                <div className="text-2xl font-bold">
                  {formatCurrency(pendingBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Liberação prevista em até 2 dias úteis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
                    <ArrowDownLeft className="h-5 w-5 text-red-600 dark:text-red-500" />
                  </div>
                  <Badge variant="secondary">Total</Badge>
                </div>
                <p className="text-muted-foreground font-medium text-sm mb-1">
                  Total Sacado
                </p>
                <div className="text-2xl font-bold">
                  {formatCurrency(4500.0)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Último saque: 10/03/2024
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Receita</CardTitle>
                  <CardDescription>
                    Acompanhe seus ganhos ao longo do tempo
                  </CardDescription>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 3 meses</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_CHART_DATA}>
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(value) => `R$ ${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--popover-foreground))",
                        }}
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "Receita",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
                <CardDescription>Taxas e descontos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Taxa de Serviço</span>
                  <span className="text-sm font-bold text-muted-foreground">
                    10%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Faturamento Bruto
                    </span>
                    <span>{formatCurrency(balance / 0.9)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Taxas de Plataforma</span>
                    <span>- {formatCurrency((balance / 0.9) * 0.1)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>Líquido</span>
                    <span className="text-primary">
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Download className="mr-2 h-4 w-4" />
                  Relatório Completo
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Transactions List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>
                  Últimas movimentações da sua conta
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_TRANSACTIONS.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          tx.type === "credit"
                            ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {tx.type === "credit" ? (
                          <ArrowDownLeft className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(tx.date)} •{" "}
                          {tx.type === "credit" ? tx.customer : tx.destination}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          tx.type === "credit"
                            ? "text-green-600 dark:text-green-400"
                            : "text-foreground"
                        }`}
                      >
                        {tx.type === "credit" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </p>
                      {tx.fee > 0 && (
                        <p className="text-xs text-muted-foreground">
                          - {formatCurrency(tx.fee)} taxa
                        </p>
                      )}

                      {tx.status === "pending" && (
                        <span className="text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WalletPage;
