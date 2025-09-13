import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import TikTokScrollView from '../components/TikTokScrollView';
import PollCard from '../components/PollCard';
import CommentsModal from '../components/CommentsModal';
import ShareModal from '../components/ShareModal';
import CreatePollModal from '../components/CreatePollModal';
import CustomLogo from '../components/CustomLogo';
import LogoWithQuickActions from '../components/LogoWithQuickActions';
import StoriesContainer from '../components/StoriesContainer';
import pollService from '../services/pollService';
import { useToast } from '../hooks/use-toast';
import { useAddiction } from '../contexts/AddictionContext';
import { useTikTok } from '../contexts/TikTokContext';
import { useShare } from '../hooks/useShare';
import { useAuth } from '../contexts/AuthContext';
import { Plus, ArrowLeft, Users } from 'lucide-react';

const FollowingPage = () => {
  const navigate = useNavigate();
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

  // Load following users' polls from backend
  useEffect(() => {
    const loadFollowingPolls = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // TODO: Replace with actual API call to get following polls
        // For now, we'll use regular polls and add a filter simulation
        const allPolls = await pollService.getPollsForFrontend({ limit: 30 });
        
        // Mock: Filter polls from followed users (you'll need to implement actual following logic)
        // For demo purposes, let's show all polls but with a "Following" indicator
        const followingPolls = allPolls.map(poll => ({
          ...poll,
          isFromFollowing: true // Mark all as from following for demo
        }));
        
        setPolls(followingPolls);
      } catch (err) {
        console.error('Error loading following polls:', err);
        setError(err.message);
        toast({
          title: "Error al cargar Following",
          description: "No se pudieron cargar las publicaciones de usuarios seguidos. Intenta recargar la página.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFollowingPolls();
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
      const poll = polls.find(p => p.id === pollId);
      if (!poll) return;

      await trackAction('share');

      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: poll.title,
          text: poll.description || 'Mira esta votación interesante',
          url: `${window.location.origin}/poll/${pollId}`
        });
        
        toast({
          title: "¡Compartido!",
          description: "La votación ha sido compartida exitosamente",
        });
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
    // Aquí podrías implementar la lógica para guardar en localStorage, backend, etc.
    await trackAction('share'); // Usar share como acción similar
    toast({
      title: "¡Votación guardada!",
      description: "La votación ha sido guardada en tu colección",
    });
  };

  const handleExitTikTok = () => {
    // Navigate back to main feed
    navigate('/feed');
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
          <LogoWithQuickActions size={24} />
        </div>
        
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white">Cargando Following...</h2>
            <p className="text-white/70 mt-2">Obteniendo publicaciones de usuarios seguidos</p>
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
          <LogoWithQuickActions size={24} />
        </div>
        
        {/* Back button */}
        <button
          onClick={() => navigate('/feed')}
          className="fixed top-4 left-4 z-[9999] w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Error al cargar</h3>
            <p className="text-white/70 text-lg mb-6">{error}</p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="block w-full px-6 py-3 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={() => navigate('/feed')}
                className="block w-full px-6 py-3 bg-gray-600 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
              >
                Volver al Feed
              </button>
            </div>
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
          <LogoWithQuickActions size={24} />
        </div>
        
        {/* Back button */}
        <button
          onClick={() => navigate('/feed')}
          className="fixed top-4 left-4 z-[9999] w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-16 h-16 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Inicia sesión</h3>
            <p className="text-white/70 text-lg mb-6">Necesitas iniciar sesión para ver Following</p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/auth'}
                className="block w-full px-6 py-3 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors"
              >
                Ir a Login
              </button>
              <button
                onClick={() => navigate('/feed')}
                className="block w-full px-6 py-3 bg-gray-600 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
              >
                Volver al Feed
              </button>
            </div>
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
          <LogoWithQuickActions size={24} />
        </div>
        
        {/* Back button */}
        <button
          onClick={() => navigate('/feed')}
          className="fixed top-4 left-4 z-[9999] w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8">
              <Users className="w-16 h-16 text-purple-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Sin publicaciones</h3>
            <p className="text-white/70 text-lg mb-6">Los usuarios que sigues no han publicado recientemente</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/explore')}
                className="block w-full px-6 py-3 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors"
              >
                Explorar usuarios
              </button>
              <button
                onClick={() => navigate('/feed')}
                className="block w-full px-6 py-3 bg-gray-600 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
              >
                Volver al Feed
              </button>
            </div>
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
          <LogoWithQuickActions size={24} />
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/feed')}
          className="fixed top-4 left-4 z-[9999] w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Following indicator */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9998] px-4 py-2 bg-purple-500/90 backdrop-blur-md rounded-full border border-purple-400/30 shadow-lg">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Following</span>
          </div>
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
        <LogoWithQuickActions size={24} />
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate('/feed')}
        className="fixed top-4 left-4 z-[9999] w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>
      
      <div className="min-h-screen bg-gray-50 pt-6 relative">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Users className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Following</h1>
          </div>
          <p className="text-gray-600">Publicaciones de usuarios que sigues</p>
        </div>

        {/* Stories Section */}
        <div className="mb-8 max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <StoriesContainer className="py-2" />
          </div>
        </div>

        {/* Feed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
          {polls.map((poll) => (
            <div key={poll.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative">
              {/* Following indicator badge */}
              <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full border border-purple-400/30">
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-medium">Siguiendo</span>
                </div>
              </div>
              
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
          <button className="px-8 py-3 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors">
            Cargar más publicaciones
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

export default FollowingPage;