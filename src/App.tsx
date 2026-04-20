import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import BottomNav from "@/components/BottomNav";
import HomePage from "./pages/HomePage";
import UploadPage from "./pages/UploadPage";
import LivePage from "./pages/LivePage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import MessagesPage from "./pages/MessagesPage";
import ChatPage from "./pages/ChatPage";
import VideosPage from "./pages/VideosPage";
import BiblePage from "./pages/BiblePage";
import MotivationPage from "./pages/MotivationPage";
import PrayerPage from "./pages/PrayerPage";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";
import StoriesPage from "./pages/StoriesPage";
import EventsPage from "./pages/EventsPage";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, authReady } = useApp();
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppLayout() {
  const location = useLocation();
  const { isAuthenticated } = useApp();
  const isLoginPage = location.pathname === '/login';
  const isChatPage = /^\/messages\/[^/]+/.test(location.pathname);
  const hideBottomNav = isLoginPage || isChatPage;

  return (
    <>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/videos" element={<RequireAuth><VideosPage /></RequireAuth>} />
        <Route path="/upload" element={<RequireAuth><UploadPage /></RequireAuth>} />
        <Route path="/live" element={<RequireAuth><LivePage /></RequireAuth>} />
        <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
        <Route path="/messages/:userId" element={<RequireAuth><ChatPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/profile/:userId" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/bible" element={<RequireAuth><BiblePage /></RequireAuth>} />
        <Route path="/motivation" element={<RequireAuth><MotivationPage /></RequireAuth>} />
        <Route path="/prayer" element={<RequireAuth><PrayerPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/help" element={<RequireAuth><HelpPage /></RequireAuth>} />
        <Route path="/stories" element={<RequireAuth><StoriesPage /></RequireAuth>} />
        <Route path="/events" element={<RequireAuth><EventsPage /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideBottomNav && isAuthenticated && <BottomNav />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
