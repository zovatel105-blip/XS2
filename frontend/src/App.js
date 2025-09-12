import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import NeuralNavigation from './components/NeuralNavigation';
import ResponsiveLayout from './components/ResponsiveLayout';
import FeedPage from './pages/FeedPage';
import ExplorePage from './pages/ExplorePage';
import ExploreDemo from './pages/ExploreDemo';
import LiveBattleDemoPage from './pages/LiveBattleDemoPage';
import FeedDemoPage from './pages/FeedDemoPage';
import GridDemo from './pages/GridDemo';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';
import NewAuthPage from './pages/NewAuthPage';
import ModernAuthPage from './pages/ModernAuthPage';
import AudioDetailPage from './pages/AudioDetailPage';
import SearchPage from './pages/SearchPage';
import MomentsPage from './pages/MomentsPage';
import ContentCreationPage from './pages/ContentCreationPage';
import InlineCropTest from './components/InlineCropTest';
import { Toaster } from './components/ui/toaster';
import { createPoll } from './services/mockData';
import { useToast } from './hooks/use-toast';
import { TikTokProvider, useTikTok } from './contexts/TikTokContext';

// Import Authentication and Addiction
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AddictionProvider } from './contexts/AddictionContext';
import { FollowProvider } from './contexts/FollowContext';

function AppContent() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isTikTokMode } = useTikTok();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // 🎵 CLEANUP GLOBAL: Detener audio en navegación de rutas
  React.useEffect(() => {
    const handleRouteChange = async () => {
      try {
        console.log('🔄 Route changing - Stopping audio');
        const audioManager = (await import('./services/AudioManager')).default;
        await audioManager.stop();
      } catch (error) {
        console.error('❌ Error stopping audio on route change:', error);
      }
    };

    // Escuchar cambios de ruta
    const unsubscribe = navigate && (() => {
      // Este efecto se ejecutará en cada renderizado cuando cambie la ruta
      handleRouteChange();
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigate, window.location.pathname]);

  const handleCreatePoll = async (pollData) => {
    const newPoll = createPoll(pollData);
    console.log('Nueva votación creada:', newPoll);
    
    toast({
      title: "¡Votación creada!",
      description: "Tu votación ha sido publicada exitosamente",
    });
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  // Check if we're on a demo page that doesn't require auth
  const location = window.location.pathname;
  const isDemoPage = location.startsWith('/profile-demo') || 
                    location.startsWith('/explore-demo') || 
                    location.startsWith('/battle-demo') || 
                    location.startsWith('/feed-demo') || 
                    location.startsWith('/test-crop');

  // Show auth page if not authenticated and not on demo page
  if (!isAuthenticated && !isDemoPage) {
    return <ModernAuthPage />;
  }

  return (
    <ResponsiveLayout onCreatePoll={handleCreatePoll}>
      <div className="App relative">
          <Routes>
            {/* Redirect root to feed */}
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/dashboard" element={<Navigate to="/feed" replace />} />
            
            {/* Main pages */}
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/profile/:userId?" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/audio/:audioId" element={<AudioDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/moments" element={<MomentsPage />} />
            <Route path="/create" element={<ContentCreationPage />} />

            {/* Demo & Test Pages - Remove in production */}
            <Route path="/explore-demo" element={<ExploreDemo />} />
            <Route path="/battle-demo" element={<LiveBattleDemoPage />} />
            <Route path="/feed-demo" element={<FeedDemoPage />} />
            <Route path="/grid-demo" element={<GridDemo />} />
            <Route path="/test-crop" element={<InlineCropTest />} />
          </Routes>

          <Toaster />
      </div>
    </ResponsiveLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FollowProvider>
          <AddictionProvider>
            <TikTokProvider>
              <AppContent />
            </TikTokProvider>
          </AddictionProvider>
        </FollowProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;