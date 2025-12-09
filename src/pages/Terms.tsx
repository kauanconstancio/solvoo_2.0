import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-8">
              Termos de Uso
            </h1>
            
            <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
              <p className="text-muted-foreground">
                Última atualização: Janeiro de 2026
              </p>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
                <p className="text-muted-foreground">
                  Ao acessar e usar a plataforma Solvoo, você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">2. Descrição do Serviço</h2>
                <p className="text-muted-foreground">
                  A Solvoo é uma plataforma online que conecta prestadores de serviços a clientes que buscam contratar serviços diversos. Atuamos como intermediários, facilitando a conexão entre as partes.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">3. Cadastro e Conta</h2>
                <p className="text-muted-foreground">
                  Para utilizar nossos serviços, você deve criar uma conta fornecendo informações precisas e atualizadas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">4. Uso da Plataforma</h2>
                <p className="text-muted-foreground">
                  Você concorda em usar a plataforma apenas para fins legais e de acordo com estes termos. É proibido usar a plataforma para atividades fraudulentas, ilegais ou que violem os direitos de terceiros.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">5. Responsabilidades dos Profissionais</h2>
                <p className="text-muted-foreground">
                  Os profissionais cadastrados são responsáveis pela qualidade dos serviços prestados, cumprimento de prazos acordados e veracidade das informações fornecidas em seus perfis.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">6. Responsabilidades dos Clientes</h2>
                <p className="text-muted-foreground">
                  Os clientes devem fornecer informações claras sobre os serviços desejados, realizar pagamentos conforme acordado e tratar os profissionais com respeito.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">7. Pagamentos e Taxas</h2>
                <p className="text-muted-foreground">
                  A Solvoo pode cobrar taxas pelos serviços de intermediação. Os valores e condições de pagamento serão informados previamente e podem variar conforme o plano escolhido.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">8. Modificações dos Termos</h2>
                <p className="text-muted-foreground">
                  Reservamos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação na plataforma.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-semibold">9. Contato</h2>
                <p className="text-muted-foreground">
                  Para dúvidas sobre estes Termos de Uso, entre em contato conosco através da página de Contato ou pelo e-mail suporte@solvoo.com.br.
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

export default Terms;
