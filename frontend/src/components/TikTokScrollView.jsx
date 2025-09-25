import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PollCard from './PollCard';
import MusicPlayer from './MusicPlayer';
import MusicDisplay from './MusicDisplay';
import CustomLogo from './CustomLogo';
import CreatePollModal from './CreatePollModal';
import CommentsModal from './CommentsModal';
import ShareModal from './ShareModal';
import PostManagementMenu from './PostManagementMenu';
import FeedMenu from './FeedMenu';
import { useFollow } from '../contexts/FollowContext';
import { useAuth } from '../contexts/AuthContext';
import { useShare } from '../hooks/useShare';
import { cn } from '../lib/utils';
import AppConfig from '../config/config';
import { ChevronUp, ChevronDown, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, CheckCircle, User, Home, Search, Plus, Mail, Trophy, Share2, Music, X } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useToast } from '../hooks/use-toast';
import audioManager from '../services/AudioManager';
import realMusicService from '../services/realMusicService';
import LayoutRenderer from './layouts/LayoutRenderer';
import feedMenuService from '../services/feedMenuService';

// Componente UserButton clickeable
const UserButton = ({ user, percentage, isSelected, isWinner, onClick, onUserClick, optionIndex }) => (
  <div className="absolute flex flex-col items-center gap-2 z-20 bottom-4 right-4">
    {/* Avatar del usuario - clickeable */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onUserClick(user);
      }}
      className="group relative transition-transform duration-200 hover:scale-110"
    >
      <Avatar className={cn(
        "w-12 h-12 transition-all duration-200 ring-2",
        isSelected 
          ? "ring-blue-400 shadow-lg shadow-blue-500/50" 
          : isWinner
            ? "ring-green-400 shadow-lg shadow-green-500/50"
            : "ring-white/30 shadow-lg"
      )}>
        <AvatarImage src={user.avatar} className="object-cover" />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
          {((user.displayName || user.username || 'U') + '').charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      {/* Verificación overlay */}
      {user.verified && (
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
          <CheckCircle className="w-4 h-4 text-blue-500 fill-current" />
        </div>
      )}
      
      {/* Hover tooltip */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          @{user.username}
        </div>
      </div>
    </button>
    
    {/* Nombre de usuario */}
  </div>
);

const TikTokPollCard = ({ poll, onVote, onLike, onShare, onComment, onSave, onCreatePoll, isActive, index, total, showLogo = true, shouldPreload = true, isVisible = true, onUpdatePoll, onDeletePoll, isOwnProfile, currentUser: authUser, savedPolls, setSavedPolls }) => {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [audioContextActivated, setAudioContextActivated] = useState(false);
  
  // Carousel state for multiple options
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Feed menu state
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  
  const navigate = useNavigate();
  const { followUser, unfollowUser, isFollowing, getFollowStatus, followStateVersion } = useFollow();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { shareModal, sharePoll, closeShareModal } = useShare();

  // Feed menu handlers
  const handleNotInterested = async (pollId) => {
    try {
      await feedMenuService.markNotInterested(pollId);
      return { success: true };
    } catch (error) {
      console.error('Error marking as not interested:', error);
      throw error;
    }
  };

  const handleHideUser = async (authorId) => {
    try {
      await feedMenuService.hideUser(authorId);
      return { success: true };
    } catch (error) {
      console.error('Error hiding user:', error);
      throw error;
    }
  };

  const handleToggleNotifications = async (authorId) => {
    try {
      const result = await feedMenuService.toggleNotifications(authorId);
      setIsNotificationEnabled(result.notifications_enabled);
      return { success: true };
    } catch (error) {
      console.error('Error toggling notifications:', error);
      throw error;
    }
  };

  const handleReport = async (pollId, reportData) => {
    try {
      await feedMenuService.reportContent(pollId, reportData);
      return { success: true };
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  };



  // Debug logging for save functionality
  useEffect(() => {
    console.log('🔖 TikTokScrollView: onSave prop received:', typeof onSave, !!onSave);
  }, [onSave]);

  // Get user ID from poll author
  const getAuthorUserId = () => {
    // Primero intentar con el objeto author si existe (priorizar UUID)
    if (poll.author && poll.author.id) {
      return poll.author.id;
    }
    // Luego intentar con authorUser UUID (legacy support)
    if (poll.authorUser && poll.authorUser.id) {
      return poll.authorUser.id;
    }
    // Solo usar username si no hay UUID disponible
    if (poll.author && poll.author.username) {
      return poll.author.username;
    }
    if (poll.authorUser && poll.authorUser.username) {
      return poll.authorUser.username;
    }
    // Convert author display name to username format como fallback
    const displayName = poll.author?.display_name || poll.author?.username || poll.authorUser?.displayName || 'unknown';
    return displayName.toLowerCase().replace(/\s+/g, '_');
  };

  const authorUserId = getAuthorUserId();

  // Check follow status when component mounts or follow state changes
  useEffect(() => {
    if (authorUserId && currentUser && authorUserId !== currentUser.id) {
      getFollowStatus(authorUserId);
    }
  }, [authorUserId, currentUser, getFollowStatus, followStateVersion]);

  // SINCRONIZACIÓN COMPLETA DE AUDIO con detección mejorada
  useEffect(() => {
    const handleAudioSync = async () => {
      const hasMusic = poll.music && poll.music.preview_url;
      const currentPostId = audioManager.getCurrentPostId();
      const isPlayingThisPost = audioManager.isPlayingPost(poll.id);
      
      console.log(`🎵 AUDIO SYNC - Post #${index} (ID: ${poll.id}):`);
      console.log(`  ▶️ Active: ${isActive}`);
      console.log(`  🎵 Has Music: ${hasMusic}`);
      console.log(`  🎵 Music: ${poll.music?.title || 'N/A'} - ${poll.music?.artist || 'N/A'}`);
      console.log(`  🔊 Currently Playing Post: ${currentPostId || 'None'}`);
      console.log(`  ✅ Is Playing This Post: ${isPlayingThisPost}`);
      
      if (isActive && hasMusic) {
        // Este post está activo y tiene música
        if (!isPlayingThisPost) {
          try {
            // Activar contexto de audio si es necesario
            if (!audioContextActivated) {
              console.log('🔧 Activating audio context...');
              const activated = await audioManager.activateAudioContext();
              setAudioContextActivated(activated);
              if (!activated) {
                console.warn('⚠️ Failed to activate audio context');
                return;
              }
            }

            // STOP COMPLETO del audio anterior
            console.log('⏹️ Stopping previous audio...');
            await audioManager.stop();
            
            // Esperar un momento para asegurar que se detuvo completamente
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // REPRODUCIR nueva música con postId
            console.log(`▶️ Starting playback: ${poll.music.title} for post ${poll.id}`);
            const success = await audioManager.play(poll.music.preview_url, {
              startTime: 0,
              loop: true,
              volume: 0.7,
              postId: poll.id // Agregar ID del post para rastreo específico
            });

            if (success) {
              setIsMusicPlaying(true);
              console.log(`✅ Successfully playing: ${poll.music.title} - ${poll.music.artist} for post ${poll.id}`);
            } else {
              console.error('❌ Failed to start audio playback');
              setIsMusicPlaying(false);
            }
            
          } catch (error) {
            console.error('❌ Audio sync error:', error);
            setIsMusicPlaying(false);
          }
        } else {
          // Ya está reproduciendo la música correcta para este post específico
          console.log('✅ Already playing correct music for this post - keeping state');
          setIsMusicPlaying(true);
        }
      } else if (isActive && !hasMusic) {
        // CASO CRÍTICO: Post activo sin música - DETENER cualquier música reproduciéndose
        console.log(`⏸️ Active post has no music - stopping any playing audio`);
        if (audioManager.isPlaying) {
          console.log('⏹️ Stopping music - current active post has no music');
          await audioManager.stop();
        }
        setIsMusicPlaying(false);
      } else if (!isActive) {
        // Post inactivo - solo detener si era música de este post específico
        if (isPlayingThisPost) {
          console.log(`⏹️ Stopping music - post ${poll.id} is now inactive`);
          await audioManager.stop();
          setIsMusicPlaying(false);
        } else {
          // Post inactivo pero no era su música - mantener estado false
          setIsMusicPlaying(false);
        }
      }
    };

    // Ejecutar sincronización con un pequeño delay para evitar conflictos de scroll
    const syncTimeout = setTimeout(handleAudioSync, 50);
    
    return () => clearTimeout(syncTimeout);
  }, [isActive, poll.music?.preview_url, poll.id, poll.music?.title, poll.music?.artist, audioContextActivated, index]);

  // Activar audio context en primera interacción
  useEffect(() => {
    const activateOnFirstInteraction = async () => {
      if (!audioContextActivated) {
        const activated = await audioManager.activateAudioContext();
        setAudioContextActivated(activated);
      }
    };

    // Activar en cualquier click o touch
    document.addEventListener('click', activateOnFirstInteraction, { once: true });
    document.addEventListener('touchstart', activateOnFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', activateOnFirstInteraction);
      document.removeEventListener('touchstart', activateOnFirstInteraction);
    };
  }, [audioContextActivated]);

  const handleVote = (optionId) => {
    if (!poll.userVote) {
      onVote(poll.id, optionId);
    }
  };

  const handleUserClick = (user) => {
    navigate(`/profile/${user.username}`);
  };

  const handleFollowUser = async (user) => {
    const userId = user.id || user.username;
    
    try {
      const result = await followUser(userId);
      if (result.success) {
        toast({
          title: "¡Siguiendo!",
          description: `Ahora sigues a @${user.username || user.displayName}`,
          duration: 2000,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al seguir al usuario",
          variant: "destructive",
          duration: AppConfig.TOAST_DURATION,
        });
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Error al seguir al usuario",
        variant: "destructive",
        duration: AppConfig.TOAST_DURATION,
      });
    }
  };

  const handleMusicToggle = (playing) => {
    setIsMusicPlaying(playing);
  };

  const formatNumber = (num) => {
    // Handle undefined, null, or non-numeric values
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    
    const numValue = Number(num);
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M`;
    }
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(1)}K`;
    }
    return numValue.toString();
  };

  const getPercentage = (votes) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  const getWinningOption = () => {
    if (!poll.options || poll.options.length === 0) {
      return null;
    }
    return poll.options.reduce((max, option) => 
      option.votes > max.votes ? option : max
    );
  };

  const winningOption = getWinningOption();

  return (
    <div className="w-full min-h-screen h-screen flex flex-col relative snap-start snap-always bg-black overflow-hidden" 
         style={{
           height: '100vh',
           height: '100dvh', // Dynamic viewport height for better mobile support
           maxHeight: '100vh',
           maxHeight: '100dvh'
         }}>


      {/* Header - Fixed at top with safe area */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/80 to-transparent px-4 pt-safe-4 pb-8"
           style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* PROPIETARIO - Avatar clickeable para perfil */}
            <div className="group relative">
              {/* Avatar para navegar al perfil */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUserClick(poll.authorUser || { username: poll.author?.username || poll.author?.display_name || 'usuario' });
                }}
                className="relative transition-transform duration-200 hover:scale-110"
              >
                <Avatar className="ring-3 ring-yellow-400 shadow-lg shadow-yellow-400/50 w-12 h-12 relative">
                  <AvatarImage 
                    src={poll.author?.avatar_url && poll.author.avatar_url !== null ? poll.author.avatar_url : undefined} 
                    className="object-cover" 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 font-bold">
                    {(poll.author?.display_name || poll.author?.username || poll.authorUser?.displayName || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>

              {/* Botón separado para seguir - Solo se muestra si no se está siguiendo y no es el usuario actual */}
              {!isFollowing(authorUserId) && currentUser && authorUserId !== currentUser.id && (
                <button
                  onClick={(e) => {
                    console.log('🎯 PLUS BUTTON CLICKED!');
                    e.stopPropagation();
                    // Crear objeto de usuario con username correcto
                    const userToFollow = poll.authorUser || { 
                      username: (poll.author?.username || poll.author?.display_name || 'unknown').toLowerCase().replace(/\s+/g, '_'),
                      displayName: poll.author?.display_name || poll.author?.username || 'Usuario',
                      id: authorUserId 
                    };
                    console.log('📝 userToFollow object:', userToFollow);
                    handleFollowUser(userToFollow);
                  }}
                  className="absolute -bottom-1 -right-1 bg-blue-500 hover:bg-blue-600 rounded-full p-1 shadow-lg cursor-pointer transition-colors duration-200 hover:scale-110"
                >
                  <Plus className="w-3 h-3 text-white" />
                </button>
              )}
              
              {/* Hover tooltip para seguir - Solo cuando se puede seguir */}
              {!isFollowing(authorUserId) && currentUser && authorUserId !== currentUser.id && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  <div className="bg-blue-800/90 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm whitespace-nowrap border border-blue-600/30 shadow-lg">
                    <div className="font-medium">@{poll.authorUser?.username || poll.author?.username || poll.author?.display_name || 'usuario'}</div>
                    <div className="text-blue-300 text-[10px]">Seguir usuario</div>
                  </div>
                </div>
              )}
              
              {/* Indicador de siguiendo */}
              {isFollowing(authorUserId) && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 shadow-lg">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-base">{poll.author?.display_name || poll.author?.username || poll.authorUser?.displayName || 'Usuario'}</h3>
              </div>
              <p className="text-sm text-white/70">{poll.timeAgo}</p>
            </div>
          </div>

        </div>
        
        <div className="mt-3">
          <h2 className="text-white font-bold text-xl leading-tight text-left">
            {poll.title}
          </h2>
        </div>


      </div>

      {/* Main content - Layout Renderer */}
      <div className="absolute inset-0 w-full h-full"
           style={{
             top: 0,
             bottom: 0,
             left: 'env(safe-area-inset-left, 0)',
             right: 'env(safe-area-inset-right, 0)'
           }}>
        <LayoutRenderer 
          poll={poll}
          onVote={(optionId) => handleVote(optionId)}
          isActive={isActive}
        />
      </div>

      {/* Bottom info and actions - Enhanced with safe area */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 pt-8"
           style={{ 
             paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
             paddingLeft: 'max(1rem, env(safe-area-inset-left))',
             paddingRight: 'max(1rem, env(safe-area-inset-right))'
           }}>
        <div className="mb-4">
          <p className="text-white/90 font-semibold text-base">
            {formatNumber(poll.totalVotes)} votos
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Social buttons - Left side when no music, or right side when music present */}
          <div className={`flex items-center gap-3 ${poll.music ? '' : 'flex-1 justify-start'}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onLike(poll.id);
              }}
              className={cn(
                "flex items-center gap-1 hover:scale-105 transition-all duration-200 text-white hover:text-red-400 h-auto p-2 rounded-lg bg-black/20 backdrop-blur-sm",
                poll.userLiked && "text-red-500 bg-red-500/20"
              )}
            >
              <Heart className={cn(
                "w-5 h-5 transition-all duration-200",
                poll.userLiked && "fill-current scale-110"
              )} />
              <span className="font-medium text-sm">{formatNumber(poll.likes)}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowCommentsModal(true);
              }}
              className="flex items-center gap-1 text-white hover:text-blue-400 hover:scale-105 transition-all duration-200 h-auto p-2 rounded-lg bg-black/20 backdrop-blur-sm"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium text-sm">{formatNumber(poll.comments)}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Intentar Web Share API primero
                if (navigator.share) {
                  navigator.share({
                    title: poll.question || 'Vota en esta encuesta',
                    text: 'Mira esta increíble votación',
                    url: `${window.location.origin}/poll/${poll.id}`,
                  }).then(() => {
                    onShare && onShare(poll.id);
                  }).catch((error) => {
                    if (error.name !== 'AbortError') {
                      sharePoll(poll);
                      onShare && onShare(poll.id);
                    }
                  });
                } else {
                  // Si no hay Web Share API, usar modal
                  sharePoll(poll);
                  onShare && onShare(poll.id);
                }
              }}
              className="flex items-center gap-1 text-white hover:text-green-400 hover:scale-105 transition-all duration-200 h-auto p-2 rounded-lg bg-black/20 backdrop-blur-sm"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium text-sm">{formatNumber(poll.shares)}</span>
            </Button>

            {/* Save button */}
            {onSave ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const isCurrentlySaved = savedPolls.has(poll.id);
                  console.log('🔖 TikTokScrollView: Save button clicked for poll:', poll.id);
                  console.log('🔖 TikTokScrollView: Currently saved:', isCurrentlySaved);
                  
                  try {
                    if (isCurrentlySaved) {
                      // Unsave the poll
                      console.log('🔖 TikTokScrollView: Unsaving poll...');
                      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/polls/${poll.id}/save`, {
                        method: 'DELETE',
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`,
                          'Content-Type': 'application/json'
                        }
                      });
                      
                      if (response.ok) {
                        setSavedPolls(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(poll.id);
                          return newSet;
                        });
                        console.log('🔖 TikTokScrollView: Poll unsaved successfully');
                      }
                    } else {
                      // Save the poll
                      console.log('🔖 TikTokScrollView: Saving poll...');
                      onSave(poll.id);
                      // Add to local state immediately for visual feedback
                      setSavedPolls(prev => {
                        const newSet = new Set(prev);
                        newSet.add(poll.id);
                        return newSet;
                      });
                    }
                  } catch (error) {
                    console.error('🔖 TikTokScrollView: Error with save/unsave:', error);
                  }
                }}
                className={`flex items-center justify-center hover:scale-105 transition-all duration-200 h-auto p-2 rounded-lg backdrop-blur-sm cursor-pointer pointer-events-auto z-50 ${
                  savedPolls.has(poll.id) 
                    ? 'text-yellow-400 bg-yellow-500/20 hover:text-yellow-300' 
                    : 'text-white bg-black/20 hover:text-yellow-400'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                <Bookmark className={`w-5 h-5 ${savedPolls.has(poll.id) ? 'fill-current' : ''}`} />
              </Button>
            ) : (
              console.log('🔖 TikTokScrollView: onSave prop is falsy, not rendering save button')
            )}

            {/* Feed Menu - Only shown for other users' posts */}
            {(() => {
              const shouldShowMenu = currentUser && (
                (poll.author?.id && poll.author.id !== currentUser.id) ||
                (poll.authorUser?.id && poll.authorUser.id !== currentUser.id)
              );
              
              // Debug logging (remove in production)
              if (process.env.NODE_ENV !== 'production') {
                console.log('FeedMenu visibility check:', {
                  currentUser: currentUser?.id,
                  pollAuthorId: poll.author?.id,
                  pollAuthorUserId: poll.authorUser?.id,
                  shouldShowMenu
                });
              }
              
              return shouldShowMenu;
            })() && (
              <FeedMenu
                poll={poll}
                onNotInterested={handleNotInterested}
                onHideUser={handleHideUser}
                onToggleNotifications={handleToggleNotifications}
                onReport={handleReport}
                isNotificationEnabled={isNotificationEnabled}
                className="flex items-center justify-center text-white hover:text-gray-300 hover:scale-105 transition-all duration-200 h-auto p-2 rounded-lg bg-black/20 backdrop-blur-sm"
              />
            )}

            {/* Post Management Menu - Only shown for own posts */}
            {onUpdatePoll && onDeletePoll && (
              <PostManagementMenu
                poll={poll}
                onUpdate={onUpdatePoll}
                onDelete={onDeletePoll}
                currentUser={authUser}
                isOwnProfile={isOwnProfile}
                className="flex items-center justify-center text-white hover:text-purple-400 hover:scale-105 transition-all duration-200 h-auto p-2 rounded-lg bg-black/20 backdrop-blur-sm"
              />
            )}
          </div>
          
          {/* Music Player - Right side, same height as buttons con autoplay */}
          {poll.music && (
            <MusicPlayer
              music={poll.music}
              isVisible={isActive}
              onTogglePlay={handleMusicToggle}
              autoPlay={true}  // ✅ REPRODUCCIÓN AUTOMÁTICA ACTIVADA
              loop={true}     // 🔄 LOOP AUTOMÁTICO HABILITADO
              className="flex-shrink-0"
            />
          )}
        </div>
      </div>

      {/* Scroll hints - Enhanced for first card */}
      {index === 0 && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 z-20"
             style={{ 
               bottom: 'max(8rem, calc(8rem + env(safe-area-inset-bottom)))'
             }}>
          <div className="animate-bounce">
            <ChevronDown className="w-8 h-8 text-white/80" />
          </div>
          <div className="text-white/80 text-sm font-medium bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
            Desliza para ver más
          </div>
        </div>
      )}

      {/* Modal de comentarios */}
      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        pollId={poll.id}
        pollTitle={poll.title}
        pollAuthor={poll.author?.display_name || poll.author?.username || 'Usuario'}
      />

      {/* Modal de compartir */}
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={closeShareModal}
        content={shareModal.content}
      />
    </div>
  );
};

const TikTokScrollView = ({ 
  polls, 
  onVote, 
  onLike, 
  onShare, 
  onComment, 
  onSave, 
  onExitTikTok, 
  onCreatePoll, 
  showLogo = true,
  initialIndex = 0,
  fromAudioDetailPage = false,
  currentAudio = null,
  onUseSound = null,
  onUpdatePoll = null,
  onDeletePoll = null,
  isOwnProfile = false
}) => {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isScrolling, setIsScrolling] = useState(false);
  const [savedPolls, setSavedPolls] = useState(new Set()); // Track saved polls locally
  const { user: currentUser } = useAuth();

  // Load user's saved polls on component mount
  useEffect(() => {
    const loadSavedPolls = async () => {
      if (!currentUser?.id) return;
      
      try {
        console.log('🔖 TikTokScrollView: Loading saved polls for user:', currentUser.id);
        
        // Get current user ID from token
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) return;
        
        const payload = JSON.parse(atob(tokenParts[1]));
        const userId = payload.sub;
        
        if (!userId) return;
        
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}/saved-polls`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          const savedPollIds = result.saved_polls?.map(poll => poll.id) || [];
          console.log('🔖 TikTokScrollView: Loaded saved poll IDs:', savedPollIds);
          setSavedPolls(new Set(savedPollIds));
        }
      } catch (error) {
        console.error('🔖 TikTokScrollView: Error loading saved polls:', error);
      }
    };
    
    loadSavedPolls();
  }, [currentUser?.id]);

  // DEBUG: Monitorear cambios de activeIndex para sincronización de audio
  useEffect(() => {
    console.log(`🎯 ACTIVE INDEX CHANGED: ${activeIndex}`);
    if (polls[activeIndex]) {
      const activePost = polls[activeIndex];
      console.log(`   📝 Active Post: "${activePost.title}"`);
      console.log(`   🎵 Has Music: ${!!(activePost.music && activePost.music.preview_url)}`);
      if (activePost.music) {
        console.log(`   🎶 Music: ${activePost.music.title} - ${activePost.music.artist}`);
      }
    }
  }, [activeIndex, polls]);

  // 🎵 SINCRONIZACIÓN CRÍTICA: Detener audio al salir del componente
  useEffect(() => {
    return () => {
      console.log('🚪 EXITING TikTokScrollView - Stopping all audio');
      audioManager.stop().catch(console.error);
    };
  }, []);

  // 🎵 SINCRONIZACIÓN: Detectar cambios de visibilidad (cambio de pestaña/app)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        console.log('👁️ Page hidden - Pausing audio');
        await audioManager.pause();
      } else {
        console.log('👁️ Page visible - Could resume audio if needed');
        // Nota: No auto-resumimos, dejamos que el usuario decida
      }
    };

    const handleBeforeUnload = async () => {
      console.log('🚪 Page unloading - Stopping all audio');
      await audioManager.stop();
    };

    // Escuchar eventos de visibilidad y salida
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);

  // Scroll to initial index when component mounts (for AudioDetailPage)
  useEffect(() => {
    if (initialIndex > 0 && containerRef.current) {
      setTimeout(() => {
        containerRef.current.scrollTo({
          top: initialIndex * containerRef.current.clientHeight,
          behavior: 'auto'
        });
      }, 100);
    }
  }, [initialIndex]);

  // Preload optimization - memoize expensive calculations
  const preloadedPolls = useMemo(() => {
    return polls.map((poll, index) => ({
      ...poll,
      isVisible: Math.abs(index - activeIndex) <= 2, // Only render nearby items
      shouldPreload: Math.abs(index - activeIndex) <= 1 // Preload adjacent items
    }));
  }, [polls, activeIndex]);

  // Performance optimization - prevent unnecessary re-renders
  const memoizedActiveIndex = useMemo(() => activeIndex, [activeIndex]);

  // MEJORADA detección de scroll para sincronización perfecta de audio
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    // Cálculo más preciso del índice activo
    const exactIndex = scrollTop / containerHeight;
    const newIndex = Math.round(exactIndex);
    
    // Umbral más agresivo para cambios rápidos de audio
    const threshold = 0.25; // 25% threshold para mejor sincronización de audio
    const indexDifference = Math.abs(exactIndex - newIndex);
    
    // Actualizar si hemos cruzado el umbral Y es un índice válido
    if (indexDifference < threshold && 
        newIndex !== activeIndex && 
        newIndex >= 0 && 
        newIndex < polls.length) {
      
      console.log(`🔄 SCROLL SYNC: Changing active index from ${activeIndex} to ${newIndex}`);
      console.log(`   📊 Exact index: ${exactIndex.toFixed(2)}, Threshold diff: ${indexDifference.toFixed(2)}`);
      
      setActiveIndex(newIndex);
    }
  }, [activeIndex, polls.length]);

  // Enhanced scroll listener with optimized debouncing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout;
    let rafId;
    let lastScrollTop = 0;
    let velocity = 0;

    const optimizedScrollHandler = () => {
      const currentScrollTop = container.scrollTop;
      velocity = Math.abs(currentScrollTop - lastScrollTop);
      lastScrollTop = currentScrollTop;
      
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      
      // Cancel previous RAF for better performance
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // Use RAF for 60fps smooth updates
      rafId = requestAnimationFrame(() => {
        // Adaptive timeout based on scroll velocity
        const timeoutDelay = velocity > 50 ? 100 : 30;
        
        scrollTimeout = setTimeout(() => {
          setIsScrolling(false);
          handleScroll();
          
          // Auto-snap to nearest position if close enough
          const scrollTop = container.scrollTop;
          const containerHeight = container.clientHeight;
          const nearestIndex = Math.round(scrollTop / containerHeight);
          const currentPosition = scrollTop / containerHeight;
          
          // Snap if within 15% of target position for better UX
          if (Math.abs(currentPosition - nearestIndex) > 0.15) {
            container.scrollTo({
              top: nearestIndex * containerHeight,
              behavior: 'smooth'
            });
          }
        }, timeoutDelay);
      });
    };

    // Use passive listeners for better performance
    container.addEventListener('scroll', optimizedScrollHandler, { 
      passive: true,
      capture: false 
    });
    
    return () => {
      container.removeEventListener('scroll', optimizedScrollHandler);
      clearTimeout(scrollTimeout);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [handleScroll]);

  // Enhanced keyboard navigation with better UX
  useEffect(() => {
    const handleKeyDown = (event) => {
      const container = containerRef.current;
      if (!container) return;

      if (event.key === 'ArrowDown' || event.key === ' ') {
        event.preventDefault();
        const nextIndex = Math.min(activeIndex + 1, polls.length - 1);
        if (nextIndex !== activeIndex) {
          container.scrollTo({
            top: nextIndex * container.clientHeight,
            behavior: 'smooth'
          });
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prevIndex = Math.max(activeIndex - 1, 0);
        if (prevIndex !== activeIndex) {
          container.scrollTo({
            top: prevIndex * container.clientHeight,
            behavior: 'smooth'
          });
        }
      } else if (event.key === 'Escape') {
        console.log('⌨️ ESCAPE KEY PRESSED - Stopping audio');
        audioManager.stop().then(() => {
          onExitTikTok?.();
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, polls.length, onExitTikTok]);

  // Ultra-optimized touch/swipe support with momentum and inertia
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let startTime = 0;
    let startScrollTop = 0;
    let isDragging = false;
    let momentum = 0;
    let lastY = 0;
    let lastTime = 0;

    const handleTouchStart = (e) => {
      // Get the first touch point
      const touch = e.touches[0];
      startY = touch.clientY;
      lastY = touch.clientY;
      startTime = Date.now();
      lastTime = startTime;
      startScrollTop = container.scrollTop;
      isDragging = true;
      momentum = 0;
      
      // Stop any ongoing smooth scrolling
      container.style.scrollBehavior = 'auto';
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      const currentY = touch.clientY;
      const currentTime = Date.now();
      const deltaY = lastY - currentY;
      const deltaTime = currentTime - lastTime;
      
      // Calculate momentum for smooth inertia
      if (deltaTime > 0) {
        momentum = deltaY / deltaTime;
      }
      
      lastY = currentY;
      lastTime = currentTime;
      
      // Prevent default behavior for better control
      if (Math.abs(touch.clientY - startY) > 15) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      if (!isDragging) return;
      isDragging = false;
      
      // Re-enable smooth scrolling
      container.style.scrollBehavior = 'smooth';
      
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();
      const totalDeltaY = startY - endY;
      const totalDeltaTime = endTime - startTime;
      
      // Enhanced swipe detection with momentum consideration
      const averageVelocity = Math.abs(totalDeltaY) / totalDeltaTime;
      const instantVelocity = Math.abs(momentum);
      
      // Multiple detection methods for better responsiveness
      const isQuickSwipe = totalDeltaTime < 300 && averageVelocity > 0.4;
      const isMomentumSwipe = instantVelocity > 1.5;
      const isLongSwipe = Math.abs(totalDeltaY) > 80;
      const isShortFlick = Math.abs(totalDeltaY) > 30 && averageVelocity > 0.8;

      if (isQuickSwipe || isMomentumSwipe || isLongSwipe || isShortFlick) {
        const targetIndex = totalDeltaY > 0 
          ? Math.min(activeIndex + 1, polls.length - 1)  // Swipe up - next
          : Math.max(activeIndex - 1, 0);               // Swipe down - previous

        if (targetIndex !== activeIndex) {
          // Add slight momentum-based easing
          const easingDuration = isMomentumSwipe ? 200 : 300;
          
          container.scrollTo({
            top: targetIndex * container.clientHeight,
            behavior: 'smooth'
          });
          
          // Immediately update active index for better responsiveness
          setTimeout(() => {
            setActiveIndex(targetIndex);
          }, easingDuration / 2);
        }
      } else {
        // Snap to current position if no significant swipe detected
        const currentPosition = container.scrollTop / container.clientHeight;
        const snapIndex = Math.round(currentPosition);
        
        container.scrollTo({
          top: snapIndex * container.clientHeight,
          behavior: 'smooth'
        });
      }
    };

    // Optimize event listeners for better performance
    const options = { 
      passive: false, 
      capture: false,
      once: false
    };

    container.addEventListener('touchstart', handleTouchStart, options);
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeIndex, polls.length]);

  // No polls state - Enhanced design
  if (!polls.length) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center"
           style={{
             height: '100vh',
             height: '100dvh'
           }}>
        <div className="text-center px-6">
          <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2m0 0V1a1 1 0 011-1h4a1 1 0 011 1v3M7 4a1 1 0 00-1 1v16a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H7z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">No hay votaciones</h3>
          <p className="text-gray-400 text-lg">No se encontraron votaciones para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden"
         style={{
           height: '100vh',
           height: '100dvh',
           width: '100vw',
           width: '100dvw'
         }}>

      {/* Use Sound Button - Solo para AudioDetailPage */}
      {fromAudioDetailPage && currentAudio && onUseSound && (
        <div className="fixed z-50 flex gap-2"
             style={{
               top: 'max(1rem, env(safe-area-inset-top))',
               right: 'max(1rem, env(safe-area-inset-right))'
             }}>
          {/* Botón cerrar */}
          <Button
            onClick={async () => {
              console.log('🚪 EXIT BUTTON CLICKED - Stopping audio');
              await audioManager.stop();
              onExitTikTok?.();
            }}
            className="bg-black/40 text-white hover:bg-black/60 backdrop-blur-md border-none p-2.5 h-10 w-10 rounded-full transition-all duration-200 hover:scale-110 shadow-xl"
            size="sm"
          >
            <X className="w-5 h-5" />
          </Button>
          
          {/* Botón Use Sound */}
          <Button
            onClick={async () => {
              onUseSound?.();
              console.log('🎵 USE SOUND BUTTON CLICKED - Stopping audio before exit');
              await audioManager.stop();
              onExitTikTok?.(); // Cerrar la vista después de usar el sonido
            }}
            className="bg-black hover:bg-gray-800 text-white backdrop-blur-md border-none px-4 py-2.5 h-10 rounded-full transition-all duration-200 hover:scale-105 shadow-xl flex items-center gap-2"
          >
            <Music className="w-4 h-4" />
            <span className="font-semibold text-sm">Use Sound</span>
          </Button>
        </div>
      )}

      {/* Navigation hints - Enhanced design and positioning - OCULTAR cuando viene de AudioDetailPage */}
      {!fromAudioDetailPage && (
        <div className="fixed z-40 flex flex-col gap-4 transition-opacity duration-300"
             style={{
               left: 'max(1rem, env(safe-area-inset-left))',
               top: '50%',
               transform: 'translateY(-50%)'
             }}>
          <Button
            onClick={() => {
              const container = containerRef.current;
              if (container && activeIndex > 0) {
                container.scrollTo({
                  top: (activeIndex - 1) * container.clientHeight,
                  behavior: 'smooth'
                });
              }
            }}
            disabled={activeIndex === 0}
            className="bg-black/40 text-white hover:bg-black/60 backdrop-blur-md border-none p-2.5 h-10 w-10 rounded-full disabled:opacity-20 transition-all duration-200 hover:scale-110 shadow-xl"
            size="sm"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={() => {
              const container = containerRef.current;
              if (container && activeIndex < polls.length - 1) {
                container.scrollTo({
                  top: (activeIndex + 1) * container.clientHeight,
                  behavior: 'smooth'
                });
              }
            }}
            disabled={activeIndex === polls.length - 1}
            className="bg-black/40 text-white hover:bg-black/60 backdrop-blur-md border-none p-2.5 h-10 w-10 rounded-full disabled:opacity-20 transition-all duration-200 hover:scale-110 shadow-xl"
            size="sm"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Main scroll container - Perfect full screen with enhanced snap */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-y-scroll overflow-x-hidden scrollbar-hide snap-y snap-mandatory"
        style={{
          height: '100vh',
          height: '100dvh',
          width: '100vw',
          width: '100dvw',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory',
          scrollSnapStop: 'always'
        }}
      >
        {preloadedPolls.map((poll, index) => (
          <TikTokPollCard
            key={poll.id}
            poll={poll}
            onVote={onVote}
            onLike={onLike}
            onShare={onShare}
            onComment={onComment}
            onSave={onSave}
            onCreatePoll={onCreatePoll}
            isActive={index === memoizedActiveIndex}
            index={index}
            total={polls.length}
            showLogo={showLogo}
            shouldPreload={poll.shouldPreload}
            isVisible={poll.isVisible}
            onUpdatePoll={onUpdatePoll}
            onDeletePoll={onDeletePoll}
            isOwnProfile={isOwnProfile}
            currentUser={currentUser}
            savedPolls={savedPolls}
            setSavedPolls={setSavedPolls}
          />
        ))}
      </div>

      {/* Enhanced CSS for ultra-smooth scroll behavior and optimal performance */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Ultra-optimized snap behavior with momentum preservation */
        .snap-y {
          scroll-snap-type: y mandatory;
          scroll-snap-stop: always;
        }
        
        .snap-start {
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }
        
        .snap-always {
          scroll-snap-stop: always;
        }

        /* Perfect full screen support with hardware acceleration */
        @supports (height: 100dvh) {
          .h-screen {
            height: 100dvh;
          }
        }

        /* Advanced mobile optimizations */
        body {
          overscroll-behavior: none;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        /* GPU acceleration for smooth scrolling */
        .w-full.h-full.overflow-y-scroll {
          -webkit-transform: translate3d(0, 0, 0);
          transform: translate3d(0, 0, 0);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-perspective: 1000px;
          perspective: 1000px;
          will-change: scroll-position;
        }

        /* Optimize scroll container performance */
        .overflow-y-scroll {
          contain: layout style paint;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        /* Enhanced mobile viewport handling */
        @media (max-width: 768px) {
          .fixed.inset-0 {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            height: 100vh;
            height: 100dvh;
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
          }
          
          /* Mobile scroll optimizations */
          .overflow-y-scroll {
            -webkit-overflow-scrolling: touch;
            scroll-snap-type: y mandatory;
            scroll-snap-stop: always;
            overscroll-behavior-y: contain;
          }
        }

        /* Ultra-smooth touch interactions */
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        /* Performance optimizations for animations */
        .transition-all, .transition-transform, .transition-colors {
          will-change: transform, opacity;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        /* Optimize snap scrolling performance */
        .snap-start.snap-always {
          contain: layout style paint;
          will-change: transform;
        }

        /* Allow text selection for content while maintaining performance */
        .text-white, .text-gray-400, h2, h3, p {
          -webkit-user-select: auto;
          -khtml-user-select: auto;
          -moz-user-select: auto;
          -ms-user-select: auto;
          user-select: auto;
          contain: layout style;
        }

        /* Prevent scroll chaining and improve momentum */
        .overflow-y-scroll.scrollbar-hide {
          overscroll-behavior: contain;
          -ms-scroll-chaining: none;
          scroll-padding: 0;
          scroll-margin: 0;
        }

        /* Hardware acceleration for video elements */
        video {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
};

export default TikTokScrollView;