import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary" />
              <span className="font-heading text-xl font-bold">ServicoPro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Conectando pessoas aos melhores profissionais desde 2024.
            </p>
            <div className="flex gap-3">
              <a href="#" className="h-9 w-9 rounded-full bg-secondary hover:bg-secondary-hover flex items-center justify-center transition-smooth">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-secondary hover:bg-secondary-hover flex items-center justify-center transition-smooth">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-secondary hover:bg-secondary-hover flex items-center justify-center transition-smooth">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-secondary hover:bg-secondary-hover flex items-center justify-center transition-smooth">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Para Clientes</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-smooth">Como Funciona</a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">Encontrar Serviços</a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">Avaliações</a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">Central de Ajuda</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Para Profissionais</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-smooth">Anunciar Serviço</a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">Como Vender</a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">Planos</a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">Blog</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-smooth">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">Privacidade</a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">Contato</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2024 ServicoPro. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
