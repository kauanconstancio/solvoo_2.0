import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-8">
              Política de Privacidade
            </h1>
            
            <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
              <p className="text-muted-foreground">
                Última atualização: Janeiro de 2026
              </p>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">1. Informações que Coletamos</h2>
                <p className="text-muted-foreground">
                  Coletamos informações que você nos fornece diretamente, como nome, e-mail, telefone e dados de perfil ao criar uma conta. Também coletamos informações automaticamente, como dados de uso e preferências.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">2. Como Usamos suas Informações</h2>
                <p className="text-muted-foreground">
                  Utilizamos suas informações para fornecer e melhorar nossos serviços, personalizar sua experiência, processar transações, enviar comunicações relevantes e garantir a segurança da plataforma.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">3. Compartilhamento de Informações</h2>
                <p className="text-muted-foreground">
                  Compartilhamos suas informações apenas quando necessário para fornecer os serviços, como conectar clientes a profissionais. Não vendemos suas informações pessoais a terceiros.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">4. Proteção de Dados</h2>
                <p className="text-muted-foreground">
                  Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">5. Cookies e Tecnologias Similares</h2>
                <p className="text-muted-foreground">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso da plataforma e personalizar conteúdo. Você pode gerenciar suas preferências de cookies nas configurações do navegador.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">6. Seus Direitos</h2>
                <p className="text-muted-foreground">
                  Você tem direito a acessar, corrigir, excluir ou exportar seus dados pessoais. Para exercer esses direitos, entre em contato conosco através dos canais disponíveis.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">7. Retenção de Dados</h2>
                <p className="text-muted-foreground">
                  Mantemos suas informações pelo tempo necessário para fornecer os serviços ou conforme exigido por lei. Após o encerramento da conta, seus dados serão excluídos ou anonimizados.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">8. Alterações nesta Política</h2>
                <p className="text-muted-foreground">
                  Podemos atualizar esta política periodicamente. Notificaremos sobre alterações significativas por e-mail ou através de aviso na plataforma.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">9. Contato</h2>
                <p className="text-muted-foreground">
                  Para questões sobre privacidade, entre em contato pelo e-mail privacidade@solvoo.com.br ou através da nossa página de Contato.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
