import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import { AdminProtectedRoute } from "./components/admin/AdminProtectedRoute";
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
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminServices from "./pages/admin/AdminServices";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminReports from "./pages/admin/AdminReports";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminLogs from "./pages/admin/AdminLogs";
import PageTransition from "./components/PageTransition";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Páginas Públicas */}
        <Route
          path="/"
          element={
            <PageTransition>
              <Index />
            </PageTransition>
          }
        />
        <Route
          path="/para-profissionais"
          element={
            <PageTransition>
              <ForProfessionals />
            </PageTransition>
          }
        />
        <Route
          path="/categorias"
          element={
            <PageTransition>
              <Categories />
            </PageTransition>
          }
        />
        <Route
          path="/como-funciona"
          element={
            <PageTransition>
              <HowItWorks />
            </PageTransition>
          }
        />
        <Route
          path="/sobre"
          element={
            <PageTransition>
              <About />
            </PageTransition>
          }
        />
        <Route
          path="/termos"
          element={
            <PageTransition>
              <Terms />
            </PageTransition>
          }
        />
        <Route
          path="/privacidade"
          element={
            <PageTransition>
              <Privacy />
            </PageTransition>
          }
        />
        <Route
          path="/contato"
          element={
            <PageTransition>
              <Contact />
            </PageTransition>
          }
        />
        <Route
          path="/ajuda"
          element={
            <PageTransition>
              <Help />
            </PageTransition>
          }
        />
        <Route
          path="/blog"
          element={
            <PageTransition>
              <Blog />
            </PageTransition>
          }
        />
        <Route
          path="/busca"
          element={
            <PageTransition>
              <SearchResults />
            </PageTransition>
          }
        />
        <Route
          path="/servico/:id"
          element={
            <PageTransition>
              <ServiceDetails />
            </PageTransition>
          }
        />

        {/* Página de Auth */}
        <Route
          path="/auth"
          element={
            <PublicOnlyRoute>
              <PageTransition>
                <Auth />
              </PageTransition>
            </PublicOnlyRoute>
          }
        />

        {/* Páginas Privadas */}
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Profile />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/favoritos"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Favorites />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/anunciar"
          element={
            <ProtectedRoute>
              <PageTransition>
                <AdvertiseService />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/editar-servico/:id"
          element={
            <ProtectedRoute>
              <PageTransition>
                <EditService />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Chat />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:conversationId"
          element={
            <ProtectedRoute>
              <PageTransition>
                <ChatConversation />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageTransition>
                <ProfessionalDashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <PageTransition>
                <AdminDashboard />
              </PageTransition>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <AdminProtectedRoute requiredPermission="admin">
              <PageTransition>
                <AdminUsers />
              </PageTransition>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/servicos"
          element={
            <AdminProtectedRoute requiredPermission="moderator">
              <PageTransition>
                <AdminServices />
              </PageTransition>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/avaliacoes"
          element={
            <AdminProtectedRoute requiredPermission="moderator">
              <PageTransition>
                <AdminReviews />
              </PageTransition>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/denuncias"
          element={
            <AdminProtectedRoute>
              <PageTransition>
                <AdminReports />
              </PageTransition>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/funcoes"
          element={
            <AdminProtectedRoute requiredPermission="admin">
              <PageTransition>
                <AdminRoles />
              </PageTransition>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <AdminProtectedRoute requiredPermission="admin">
              <PageTransition>
                <AdminLogs />
              </PageTransition>
            </AdminProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <PageTransition>
              <NotFound />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
