import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import Index from "./pages/Index";
import ForProfessionals from "./pages/ForProfessionals";
import Categories from "./pages/Categories";
import HowItWorks from "./pages/HowItWorks";
import AdvertiseService from "./pages/AdvertiseService";
import EditService from "./pages/EditService";
import ServiceDetails from "./pages/ServiceDetails";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import Chat from "./pages/Chat";
import ChatConversation from "./pages/ChatConversation";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Páginas Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/para-profissionais" element={<ForProfessionals />} />
          <Route path="/categorias" element={<Categories />} />
          <Route path="/como-funciona" element={<HowItWorks />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/ajuda" element={<Help />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/busca" element={<SearchResults />} />
          <Route path="/servico/:id" element={<ServiceDetails />} />

          {/* Página de Auth - Redireciona se já estiver logado */}
          <Route
            path="/auth"
            element={
              <PublicOnlyRoute>
                <Auth />
              </PublicOnlyRoute>
            }
          />

          {/* Páginas Privadas - Requer autenticação */}
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favoritos"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/anunciar"
            element={
              <ProtectedRoute>
                <AdvertiseService />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editar-servico/:id"
            element={
              <ProtectedRoute>
                <EditService />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:conversationId"
            element={
              <ProtectedRoute>
                <ChatConversation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ProfessionalDashboard />
              </ProtectedRoute>
            }
          />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
