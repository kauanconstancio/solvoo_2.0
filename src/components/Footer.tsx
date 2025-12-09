import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container px-4 py-10 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <img
                src="/solvoo_favicon.png"
                alt="Logo"
                className="h-7 w-7 md:h-8 md:w-8 rounded-lg"
              />
              <span className="font-heading text-lg md:text-xl font-bold">
                Solvoo
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Conectando pessoas aos melhores profissionais desde 2026.
            </p>
            <div className="flex gap-2 md:gap-3">
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-secondary hover:bg-secondary-hover flex items-center justify-center transition-smooth"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-secondary hover:bg-secondary-hover flex items-center justify-center transition-smooth"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-secondary hover:bg-secondary-hover flex items-center justify-center transition-smooth"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-secondary hover:bg-secondary-hover flex items-center justify-center transition-smooth"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">
              Para Clientes
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/como-funciona" className="hover:text-foreground transition-smooth">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link to="/categorias" className="hover:text-foreground transition-smooth">
                  Encontrar Serviços
                </Link>
              </li>
              <li>
                <Link to="/categorias" className="hover:text-foreground transition-smooth">
                  Avaliações
                </Link>
              </li>
              <li>
                <Link to="/ajuda" className="hover:text-foreground transition-smooth">
                  Central de Ajuda
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">
              Para Profissionais
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/anunciar" className="hover:text-foreground transition-smooth">
                  Anunciar Serviço
                </Link>
              </li>
              <li>
                <Link to="/para-profissionais" className="hover:text-foreground transition-smooth">
                  Como Vender
                </Link>
              </li>
              <li>
                <Link to="/para-profissionais" className="hover:text-foreground transition-smooth">
                  Planos
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition-smooth">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">
              Empresa
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/sobre" className="hover:text-foreground transition-smooth">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/termos" className="hover:text-foreground transition-smooth">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="hover:text-foreground transition-smooth">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link to="/contato" className="hover:text-foreground transition-smooth">
                  Contato
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 md:pt-8 border-t text-center text-xs md:text-sm text-muted-foreground">
          <p>© 2026 Solvoo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
