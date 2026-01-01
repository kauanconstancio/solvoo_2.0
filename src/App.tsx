import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./components/ThemeProvider";
import ChatNotificationProvider from "./components/ChatNotificationProvider";
import { SupportChatbot } from "./components/SupportChatbot";
import BottomNavigation from "./components/BottomNavigation";
import AnimatedRoutes from "./AppRoutes";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  
  // Check if we're on a chat conversation page (not the chat list)
  const isConversationPage = location.pathname.match(/^\/chat\/[^/]+$/);
  
  // Check if we're on a service details page
  const isServiceDetailsPage = location.pathname.match(/^\/servico\/.+$/);
  
  // Hide bottom navigation on conversation and service details pages
  const hideBottomNav = isConversationPage || isServiceDetailsPage;
  
  return (
    <>
      <ChatNotificationProvider />
      <div className={hideBottomNav ? "" : "pb-16 lg:pb-0"}>
        <AnimatedRoutes />
      </div>
      {!hideBottomNav && <BottomNavigation />}
      <SupportChatbot />
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
