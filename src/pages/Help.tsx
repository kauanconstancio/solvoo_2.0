import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle, MessageCircle, FileText, CreditCard, User, Shield } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";

const helpCategories = [
  { icon: User, title: "Conta e Perfil", description: "Gerenciamento de conta" },
  { icon: FileText, title: "Serviços", description: "Publicar e gerenciar" },
  { icon: CreditCard, title: "Pagamentos", description: "Planos e faturas" },
  { icon: MessageCircle, title: "Mensagens", description: "Comunicação" },
  { icon: Shield, title: "Segurança", description: "Proteção de dados" },
  { icon: HelpCircle, title: "Outros", description: "Dúvidas gerais" },
];

const faqs = [
  {
    question: "Como criar uma conta na Solvoo?",
    answer: "Para criar uma conta, clique no botão 'Entrar' no canto superior direito e selecione 'Criar conta'. Preencha seus dados e confirme seu e-mail para ativar sua conta.",
  },
  {
    question: "Como anunciar um serviço?",
    answer: "Após fazer login, clique no botão 'Anunciar Serviço' no menu. Preencha as informações do seu serviço, adicione fotos e defina seu preço. Seu anúncio será publicado após revisão.",
  },
  {
    question: "Quais são os planos disponíveis?",
    answer: "Oferecemos planos Gratuito, Básico e Premium. Cada plano oferece diferentes benefícios como número de anúncios, destaque e suporte prioritário.",
  },
  {
    question: "Como entrar em contato com um profissional?",
    answer: "Ao visualizar um serviço, você pode clicar no botão de contato para enviar uma mensagem diretamente ao profissional.",
  },
  {
    question: "Como funciona o sistema de avaliações?",
    answer: "Após a conclusão de um serviço, clientes podem avaliar os profissionais com notas de 1 a 5 estrelas e deixar comentários.",
  },
  {
    question: "Posso cancelar meu plano a qualquer momento?",
    answer: "Sim, você pode cancelar seu plano a qualquer momento nas configurações da sua conta.",
  },
  {
    question: "Como alterar ou excluir meu anúncio?",
    answer: "Acesse seu perfil e vá até 'Meus Anúncios'. Lá você pode editar as informações ou excluir o anúncio.",
  },
  {
    question: "A Solvoo é segura?",
    answer: "Sim, utilizamos criptografia de ponta a ponta para proteger seus dados. Todos os profissionais passam por verificação.",
  },
];

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Central de Ajuda
              </h1>
              <p className="text-muted-foreground mb-8">
                Como podemos ajudá-lo? Encontre respostas para suas dúvidas.
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por dúvidas..."
                  className="pl-10 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container px-4">
            <h2 className="text-xl font-semibold mb-6">Categorias</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {helpCategories.map((category) => (
                <div
                  key={category.title}
                  className="bg-card p-4 rounded-xl border hover:border-primary/50 transition-smooth cursor-pointer text-center"
                >
                  <category.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-medium text-sm mb-1">{category.title}</h3>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-semibold mb-6">Perguntas Frequentes</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-card border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-left hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {filteredFaqs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum resultado encontrado para "{searchQuery}"
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Help;
