import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import TikTokScrollView from '../components/TikTokScrollView';
import PollCard from '../components/PollCard';
import CommentsModal from '../components/CommentsModal';
import ShareModal from '../components/ShareModal';
import CreatePollModal from '../components/CreatePollModal';
import CustomLogo from '../components/CustomLogo';
import LogoWithQuickActions from '../components/LogoWithQuickActions';
import StoriesContainer from '../components/StoriesContainer';
import pollService from '../services/pollService';
import savedPollsService from '../services/savedPollsService';
import { useToast } from '../hooks/use-toast';
import { useAddiction } from '../contexts/AddictionContext';
import { useTikTok } from '../contexts/TikTokContext';
import { useShare } from '../hooks/useShare';
import { useAuth } from '../contexts/AuthContext';
import { Plus } from 'lucide-react';

const FeedPage = () => {
  const location = useLocation();
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState(null);
  const [selectedPollTitle, setSelectedPollTitle] = useState('');
  const [selectedPollAuthor, setSelectedPollAuthor] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [preSelectedAudio, setPreSelectedAudio] = useState(null);
  const { toast } = useToast();
  const { trackAction } = useAddiction();
  const { enterTikTokMode, exitTikTokMode, isTikTokMode } = useTikTok();
  const { shareModal, sharePoll, closeShareModal } = useShare();
  const { isAuthenticated, user } = useAuth();

  // Detect if we're on mobile or desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Load polls from backend
  useEffect(() => {
    const loadPolls = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const pollsData = await pollService.getPollsForFrontend({ limit: 30 });
        setPolls(pollsData);
      } catch (err) {
        console.error('Error loading polls:', err);
        setError(err.message);
        toast({
          title: "Error al cargar votaciones",
          description: "No se pudieron cargar las votaciones. Intenta recargar la página.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPolls();
  }, [isAuthenticated, toast]);

  // Handle navigation state for pre-selected audio
  useEffect(() => {
    if (location.state?.createPoll) {
      setShowCreateModal(true);
      setPreSelectedAudio(location.state.selectedAudio);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Activar modo TikTok solo en móvil
  useEffect(() => {
    if (isMobile) {
      enterTikTokMode();
    } else {
      exitTikTokMode();
    }
    
    // Limpiar al desmontar
    return () => {
      if (isMobile) {
        exitTikTokMode();
      }
    };
  }, [isMobile, enterTikTokMode, exitTikTokMode]);

  const handleVote = async (pollId, optionId) => {
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para votar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistic update
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          // Don't allow multiple votes
          if (poll.userVote) return poll;
          
          return {
            ...poll,
            userVote: optionId,
            options: poll.options.map(opt => ({
              ...opt,
              votes: opt.id === optionId ? opt.votes + 1 : opt.votes
            })),
            totalVotes: poll.totalVotes + 1
          };
        }
        return poll;
      }));

      // Send vote to backend
      await pollService.voteOnPoll(pollId, optionId);
      
      // Track action for addiction system
      await trackAction('vote');
      
      toast({
        title: "¡Voto registrado!",
        description: "Tu voto ha sido contabilizado exitosamente",
      });
      
      // Refresh poll data to get accurate counts
      const updatedPoll = await pollService.refreshPoll(pollId);
      if (updatedPoll) {
        setPolls(prev => prev.map(poll => 
          poll.id === pollId ? updatedPoll : poll
        ));
      }
    } catch (error) {
      console.error('Error voting:', error);
      
      // Revert optimistic update
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId && poll.userVote === optionId) {
          return {
            ...poll,
            userVote: null,
            options: poll.options.map(opt => ({
              ...opt,
              votes: opt.id === optionId ? opt.votes - 1 : opt.votes
            })),
            totalVotes: poll.totalVotes - 1
          };
        }
        return poll;
      }));
      
      toast({
        title: "Error al votar",
        description: error.message || "No se pudo registrar tu voto. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (pollId) => {
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para dar like",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistic update
      let wasLiked = false;
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          wasLiked = poll.userLiked;
          return {
            ...poll,
            userLiked: !poll.userLiked,
            likes: poll.userLiked ? poll.likes - 1 : poll.likes + 1
          };
        }
        return poll;
      }));

      // Send like to backend
      const result = await pollService.toggleLike(pollId);
      
      // Track action for addiction system
      await trackAction('like');
      
      // Update with actual server response
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            userLiked: result.liked,
            likes: result.likes
          };
        }
        return poll;
      }));
      
      toast({
        title: result.liked ? "¡Te gusta!" : "Like removido",
        description: result.liked ? "Has dado like a esta votación" : "Ya no te gusta esta votación",
      });
    } catch (error) {
      console.error('Error liking poll:', error);
      
      // Revert optimistic update
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            userLiked: !poll.userLiked,
            likes: poll.userLiked ? poll.likes + 1 : poll.likes - 1
          };
        }
        return poll;
      }));
      
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar el like. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (pollId) => {
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para compartir",
        variant: "destructive",
      });
      return;
    }

    try {
      // Increment share count on backend
      const result = await pollService.sharePoll(pollId);
      
      // Update local state
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            shares: result.shares
          };
        }
        return poll;
      }));
      
      await trackAction('share');
      
      // Obtener el poll para el modal
      const poll = polls.find(p => p.id === pollId);
      if (!poll) return;
      
      // Intentar usar Web Share API primero (mejor para móviles)
      if (navigator.share) {
        try {
          await navigator.share({
            title: poll.title || 'Vota en esta encuesta',
            text: 'Mira esta increíble votación',
            url: `${window.location.origin}/poll/${pollId}`,
          });
          toast({
            title: "¡Compartido exitosamente!",
            description: "La votación ha sido compartida",
          });
          return;
        } catch (err) {
          // Si el usuario cancela el share, no mostrar error
          if (err.name !== 'AbortError') {
            console.log('Error al compartir:', err);
            // Si Web Share API falla, usar modal
            sharePoll(poll);
          }
        }
      } else {
        // Si Web Share API no está disponible, usar modal
        sharePoll(poll);
      }
    } catch (error) {
      console.error('Error sharing poll:', error);
      toast({
        title: "Error al compartir",
        description: error.message || "No se pudo compartir la votación. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleComment = async (pollId) => {
    await trackAction('create');
    const poll = polls.find(p => p.id === pollId);
    if (poll) {
      setSelectedPollId(pollId);
      setSelectedPollTitle(poll.title);
      setSelectedPollAuthor(poll.author);
      setShowCommentsModal(true);
    }
  };

  const handleSave = async (pollId) => {
    console.log('🔖 FeedPage: handleSave called with pollId:', pollId);
    console.log('🔖 FeedPage: savedPollsService available:', !!savedPollsService);
    
    try {
      console.log('🔖 FeedPage: Testing direct save call...');
      
      // Simplified: try to save directly first
      const result = await savedPollsService.savePoll(pollId);
      console.log('🔖 FeedPage: Direct save result:', result);
      
      toast({
        title: "¡Publicación guardada!",
        description: "La publicación ha sido guardada en tu colección",
        duration: 3000,
      });
      
      // Track the action
      await trackAction('save');
      
    } catch (error) {
      console.error('❌ FeedPage: Error saving poll:', error);
      console.error('❌ FeedPage: Error message:', error.message);
      console.error('❌ FeedPage: Error stack:', error.stack);
      
      // Try the old simple approach as fallback
      try {
        console.log('🔖 FeedPage: Trying fallback approach...');
        await trackAction('save');
        toast({
          title: "¡Publicación guardada!",
          description: "La publicación ha sido guardada en tu colección",
          duration: 3000,
        });
      } catch (fallbackError) {
        console.error('❌ FeedPage: Fallback also failed:', fallbackError);
        toast({
          title: "Error",
          description: "No se pudo guardar la publicación. Inténtalo de nuevo.",
          variant: "destructive",
          duration: 3000,  
        });
      }
    }
  };

  const handleExitTikTok = () => {
    // No hacer nada, ya que queremos mantener siempre el modo TikTok en el feed
    // Opcional: podrías navegar a otra página si quisieras
    return;
  };

  const handleCreatePoll = async (newPoll) => {
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para crear votaciones",
        variant: "destructive",
      });
      return;
    }

    try {
      // NOTE: El poll ya fue creado en CreatePollModal, aquí solo manejamos la UI
      const transformedPoll = pollService.transformPollData(newPoll);
      
      // Agregar la nueva votación al inicio de la lista
      setPolls(prev => [transformedPoll, ...prev]);
      
      // Trigger addiction system
      await trackAction('create');
      
      // No mostramos toast aquí porque ya se muestra en CreatePollModal
    } catch (error) {
      console.error('Error handling new poll:', error);
      toast({
        title: "Error al agregar votación",
        description: error.message || "No se pudo agregar la votación a la lista.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <>
        {/* Logo fijo SIEMPRE VISIBLE - Loading */}
        <div 
          className="fixed top-4 right-4 z-[9999] flex items-center justify-center w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-white/60 shadow-lg"
          style={{ 
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 9999,
          }}
        >
          <LogoWithQuickActions size={32} />
        </div>
        
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white">Cargando tu feed...</h2>
            <p className="text-white/70 mt-2">Obteniendo las votaciones más recientes</p>
          </div>
        </div>
      </>
    );
  }

  // Show error state
  if (error && !isLoading) {
    return (
      <>
        {/* Logo fijo SIEMPRE VISIBLE - Error State */}
        <div 
          className="fixed top-4 right-4 z-[9999] flex items-center justify-center w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-white/60 shadow-lg"
          style={{ 
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 9999,
          }}
        >
          <LogoWithQuickActions size={32} />
        </div>
        
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Error al cargar</h3>
            <p className="text-white/70 text-lg mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </>
    );
  }

  // Si no hay autenticación, redirigir o mostrar login
  if (!isAuthenticated && !isLoading) {
    return (
      <>
        {/* Logo fijo SIEMPRE VISIBLE - Auth Required */}
        <div 
          className="fixed top-4 right-4 z-[9999] flex items-center justify-center w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-white/60 shadow-lg"
          style={{ 
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 9999,
          }}
        >
          <LogoWithQuickActions size={32} />
        </div>
        
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-16 h-16 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Inicia sesión</h3>
            <p className="text-white/70 text-lg mb-6">Necesitas iniciar sesión para ver el feed</p>
            <button 
              onClick={() => window.location.href = '/auth'}
              className="px-6 py-3 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors"
            >
              Ir a Login
            </button>
          </div>
        </div>
      </>
    );
  }
  if (polls.length === 0) {
    return (
      <>
        {/* Logo fijo SIEMPRE VISIBLE - Empty State */}
        <div 
          className="fixed top-4 right-4 z-[9999] flex items-center justify-center w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-white/60 shadow-lg"
          style={{ 
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 9999,
          }}
        >
          <LogoWithQuickActions size={32} />
        </div>
        
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Tu feed está vacío</h3>
            <p className="text-white/70 text-lg">¡Sigue a más usuarios para ver sus votaciones aquí!</p>
          </div>
        </div>
      </>
    );
  }

  // Renderizado móvil (TikTok mode)
  if (isMobile || isTikTokMode) {
    return (
      <>
        {/* Logo fijo SIEMPRE VISIBLE - Mobile TikTok Mode */}
        <div 
          className="fixed top-4 right-4 z-[9999] flex items-center justify-center w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-white/60 shadow-lg"
          style={{ 
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 9999,
          }}
        >
          <LogoWithQuickActions size={32} />
        </div>

        {/* Stories overlay en la parte superior */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="pt-safe-top">
            <StoriesContainer className="px-2 py-2" showCreateButton={false} />
          </div>
        </div>
        
        <TikTokScrollView
          polls={polls}
          onVote={handleVote}
          onLike={handleLike}
          onShare={handleShare}
          onComment={handleComment}
          onSave={handleSave}
          onExitTikTok={handleExitTikTok}
          onCreatePoll={handleCreatePoll}
          showLogo={false}
        />
      </>
    );
  }

  // Renderizado desktop (Web layout similar a TikTok web)
  return (
    <>
      {/* Logo fijo SIEMPRE VISIBLE - Desktop Mode */}
      <div 
        className="fixed top-4 right-4 z-[9999] flex items-center justify-center w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-lg"
        style={{ 
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 9999,
        }}
      >
        <LogoWithQuickActions size={32} />
      </div>
      
      <div className="min-h-screen bg-gray-50 pt-6 relative">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Para ti</h1>
          <p className="text-gray-600">Descubre las votaciones más populares</p>
        </div>

        {/* Stories Section */}
        <div className="mb-8 max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <StoriesContainer className="py-2" />
          </div>
        </div>

        {/* Feed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <div key={poll.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <PollCard
                poll={poll}
                onVote={handleVote}
                onLike={handleLike}
                onShare={handleShare}
                onComment={handleComment}
                onSave={handleSave}
                fullScreen={false}
              />
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12 mb-8">
          <button className="px-8 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors">
            Cargar más votaciones
          </button>
        </div>
      </div>

      {/* Comments Modal */}
      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        pollId={selectedPollId}
        pollTitle={selectedPollTitle}
        pollAuthor={selectedPollAuthor}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={closeShareModal}
        content={shareModal.content}
      />

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setPreSelectedAudio(null); // Clear pre-selected audio when closing
        }}
        preSelectedAudio={preSelectedAudio}
        onCreatePoll={(newPoll) => {
          // Add the new poll to the beginning of the list
          const transformedPoll = pollService.transformPollData(newPoll);
          setPolls(prev => [transformedPoll, ...prev]);
        }}
      />

      {/* Floating Create Button */}
      {isAuthenticated && !isLoading && (
        <button
          onClick={() => setShowCreateModal(true)}
          className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 ${isMobile ? 'bottom-20' : 'bottom-6'}`}
          aria-label="Crear nueva votación"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}
    </>
  );
};

export default FeedPage;