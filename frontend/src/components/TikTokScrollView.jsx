import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PollCard from './PollCard';
import MusicPlayer from './MusicPlayer';
import CustomLogo from './CustomLogo';
import CreatePollModal from './CreatePollModal';
import CommentsModal from './CommentsModal';
import ShareModal from './ShareModal';
import { useFollow } from '../contexts/FollowContext';
import { useAuth } from '../contexts/AuthContext';
import { useShare } from '../hooks/useShare';
import { cn } from '../lib/utils';
import AppConfig from '../config/config';
import { ChevronUp, ChevronDown, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, CheckCircle, User, Home, Search, Plus, Mail, Trophy, Share2, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useToast } from '../hooks/use-toast';

// Componente UserButton clickeable
const UserButton = ({ user, percentage, isSelected, isWinner, onClick, onUserClick, optionIndex }) => (
  <div className={cn(
    "absolute flex flex-col items-center gap-2 z-20",
    optionIndex < 2 ? "bottom-4 right-4" : "top-4 right-4"
  )}>
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
        <AvatarImage src={user.avatar} />
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

const TikTokPollCard = ({ poll, onVote, onLike, onShare, onComment, onSave, onCreatePoll, isActive, index, total, showLogo = true }) => {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const navigate = useNavigate();
  const { followUser, unfollowUser, isFollowing, getFollowStatus } = useFollow();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { shareModal, sharePoll, closeShareModal } = useShare();

  // Get user ID from poll author
  const getAuthorUserId = () => {
    if (poll.authorUser && poll.authorUser.id) {
      return poll.authorUser.id;
    }
    // Use the username if available, otherwise convert author name to username format
    if (poll.authorUser && poll.authorUser.username) {
      return poll.authorUser.username;
    }
    // Convert author name to username format (lowercase, spaces to underscores)
    return poll.author.toLowerCase().replace(/\s+/g, '_');
  };

  const authorUserId = getAuthorUserId();

  // Check follow status when component mounts
  useEffect(() => {
    if (authorUserId && currentUser && authorUserId !== currentUser.id) {
      getFollowStatus(authorUserId);
    }
  }, [authorUserId, currentUser, getFollowStatus]);

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
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
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
                  handleUserClick(poll.authorUser || { username: poll.author });
                }}
                className="relative transition-transform duration-200 hover:scale-110"
              >
                <Avatar className="ring-3 ring-yellow-400 shadow-lg shadow-yellow-400/50 w-12 h-12 relative">
                  <AvatarImage src={poll.authorUser?.avatar || "https://github.com/shadcn.png"} />
                  <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white font-bold">
                    {((poll.author || 'U') + '').charAt(0).toUpperCase()}
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
                      username: poll.author.toLowerCase().replace(/\s+/g, '_'),
                      displayName: poll.author,
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
                    <div className="font-medium">@{poll.authorUser?.username || poll.author}</div>
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
                <h3 className="font-semibold text-white text-base">{poll.author}</h3>
              </div>
              <p className="text-sm text-white/70">{poll.timeAgo}</p>
            </div>
          </div>

        </div>
        
        <div className="mt-3">
          <h2 className="text-white font-bold text-xl leading-tight text-center">
            {poll.title}
          </h2>
        </div>
      </div>

      {/* Main content - Perfect full screen grid with safe areas */}
      <div className="absolute inset-0 grid grid-cols-2 gap-0.5"
           style={{
             top: 0,
             bottom: 0,
             left: 'env(safe-area-inset-left, 0)',
             right: 'env(safe-area-inset-right, 0)'
           }}>
        {poll.options.map((option, optionIndex) => {
          const percentage = getPercentage(option.votes);
          const isWinner = option.id === winningOption.id && poll.totalVotes > 0;
          const isSelected = poll.userVote === option.id;

          return (
            <div
              key={option.id}
              className="relative cursor-pointer group h-full w-full overflow-hidden touch-manipulation"
              onClick={() => handleVote(option.id)}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              {/* Background image/video - Perfect coverage */}
              <div className="absolute inset-0 w-full h-full">
                {option.media?.url ? (
                  option.media?.type === 'video' ? (
                    <>
                      {/* Video thumbnail */}
                      <img 
                        src={option.media.thumbnail || option.media.url} 
                        alt={option.text}
                        className="w-full h-full object-cover object-center"
                        style={{ 
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                      />
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                          <Play className="w-6 h-6 text-black ml-0.5" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img 
                      src={option.media.url} 
                      alt={option.text}
                      className="w-full h-full object-cover object-center"
                      style={{ 
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                    />
                  )
                ) : (
                  <div className={cn(
                    "w-full h-full",
                    optionIndex === 0 ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500" :
                    optionIndex === 1 ? "bg-gradient-to-br from-gray-300 via-gray-500 to-gray-700" :
                    optionIndex === 2 ? "bg-gradient-to-br from-yellow-500 via-red-500 to-pink-600" :
                    "bg-gradient-to-br from-amber-600 via-orange-700 to-red-800"
                  )} />
                )}
              </div>

              {/* Interactive overlay for better touch response */}
              <div className="absolute inset-0 bg-transparent active:bg-white/10 transition-colors duration-150"></div>

              {/* Progress overlay - Smooth animated fill from bottom */}
              {poll.totalVotes > 0 && (
                <div 
                  className={cn(
                    "absolute inset-x-0 bottom-0 transition-all duration-1000 ease-out",
                    isSelected 
                      ? "bg-gradient-to-t from-blue-500/90 via-blue-600/70 to-blue-400/40"
                      : isWinner 
                        ? "bg-gradient-to-t from-green-500/90 via-green-600/70 to-green-400/40"
                        : "bg-gradient-to-t from-black/50 via-black/30 to-transparent"
                  )}
                  style={{ 
                    height: `${Math.max(percentage, 5)}%`, // Minimum 5% for visibility
                    transform: `translateY(${100 - Math.max(percentage, 5)}%)`,
                    transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              )}

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute inset-0 ring-4 ring-blue-400 ring-inset animate-pulse"></div>
              )}

              {/* Winner indicator */}
              {isWinner && poll.totalVotes > 0 && (
                <div className="absolute inset-0 ring-2 ring-green-400 ring-inset"></div>
              )}

              {/* Combined Profile + Title Layout - Conditional positioning */}
              <div className={cn(
                "absolute left-4 right-4 z-20",
                optionIndex < 2 ? "bottom-6" : "top-6"
              )}>
                <div className={cn(
                  "flex items-center px-4 py-4 rounded-2xl backdrop-blur-md shadow-2xl border border-white/30",
                  "bg-black/80"
                )}>
                  {/* Profile Avatar - Left side */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserClick(option.user);
                    }}
                    className="group relative transition-transform duration-200 hover:scale-110 flex-shrink-0"
                  >
                    {/* MENCIÓN - Diseño distintivo con borde plateado y badge de mención */}
                    <div className="relative">
                      <Avatar className={cn(
                        "w-10 h-10 transition-all duration-200 ring-2",
                        isSelected 
                          ? "ring-blue-400 shadow-lg shadow-blue-500/50" 
                          : isWinner
                            ? "ring-green-400 shadow-lg shadow-green-500/50"
                            : "ring-gray-300 shadow-lg shadow-gray-300/30"
                      )}>
                        <AvatarImage src={option.user.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white font-bold text-sm">
                          {((option.user.displayName || option.user.username || 'U') + '').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Badge de mención */}
                      <div className="absolute -bottom-0.5 -right-0.5 bg-gray-300 rounded-full p-0.5 shadow-sm">
                        <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Verificación overlay */}
                    {option.user.verified && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 shadow-lg">
                        <CheckCircle className="w-3 h-3 text-white fill-current" />
                      </div>
                    )}
                    
                    {/* Hover tooltip mejorado */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      <div className="bg-gray-800/90 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm whitespace-nowrap border border-gray-600/30 shadow-lg">
                        <div className="font-medium">@{option.user.username}</div>
                        <div className="text-gray-300 text-[10px]">Mención</div>
                      </div>
                    </div>
                  </button>
                  
                  {/* Title - Centered */}
                  <div className="flex-1 flex justify-center">
                    <div className="text-white font-bold text-lg leading-tight text-center px-2">
                      {option.text}
                    </div>
                  </div>
                </div>
              </div>

              {/* Winner Badge - On winning option only */}
              {isWinner && poll.totalVotes > 0 && (
                <div className={cn(
                  "absolute z-30",
                  optionIndex < 2 ? "bottom-16 right-4" : "top-16 right-4"
                )}>
                  <div className="bg-green-600/95 text-white px-3 py-2 rounded-full text-sm font-semibold flex items-center justify-center shadow-2xl backdrop-blur-sm animate-pulse">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
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

            {onSave && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave(poll.id);
                }}
                className="flex items-center justify-center text-white hover:text-yellow-400 hover:scale-105 transition-all duration-200 h-auto p-2 rounded-lg bg-black/20 backdrop-blur-sm"
              >
                <Bookmark className="w-5 h-5" />
              </Button>
            )}
          </div>
          
          {/* Music Player - Right side, same height as buttons */}
          {poll.music && (
            <MusicPlayer
              music={poll.music}
              isVisible={isActive}
              onTogglePlay={handleMusicToggle}
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
        pollAuthor={poll.author}
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

const TikTokScrollView = ({ polls, onVote, onLike, onShare, onComment, onSave, onExitTikTok, onCreatePoll, showLogo = true }) => {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Enhanced scroll handling with better throttling and snap detection
  const handleScroll = useCallback(() => {
    if (isScrolling) return;
    
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / containerHeight);
    
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < polls.length) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex, polls.length, isScrolling]);

  // Enhanced scroll listener with improved throttling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout;
    let rafId;

    const throttledScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      
      // Cancel previous RAF
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // Use RAF for smooth updates
      rafId = requestAnimationFrame(() => {
        scrollTimeout = setTimeout(() => {
          setIsScrolling(false);
          handleScroll();
        }, 50); // Reduced timeout for more responsive behavior
      });
    };

    container.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', throttledScroll);
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
        onExitTikTok?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, polls.length, onExitTikTok]);

  // Enhanced touch/swipe support with better gesture detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let startTime = 0;
    let startScrollTop = 0;
    let isDragging = false;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      startTime = Date.now();
      startScrollTop = container.scrollTop;
      isDragging = true;
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      
      // Prevent default scrolling behavior for better control
      if (Math.abs(e.touches[0].clientY - startY) > 10) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      if (!isDragging) return;
      isDragging = false;
      
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();
      const deltaY = startY - endY;
      const deltaTime = endTime - startTime;

      // Enhanced swipe detection with velocity consideration
      const velocity = Math.abs(deltaY) / deltaTime;
      const isQuickSwipe = deltaTime < 300 && velocity > 0.5;
      const isLongSwipe = Math.abs(deltaY) > 100;

      if (isQuickSwipe || isLongSwipe) {
        if (deltaY > 0 && activeIndex < polls.length - 1) {
          // Swipe up - next
          container.scrollTo({
            top: (activeIndex + 1) * container.clientHeight,
            behavior: 'smooth'
          });
        } else if (deltaY < 0 && activeIndex > 0) {
          // Swipe down - previous
          container.scrollTo({
            top: (activeIndex - 1) * container.clientHeight,
            behavior: 'smooth'
          });
        }
      }
    };

    // Enhanced event listeners with better options
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
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


      {/* Navigation hints - Enhanced design and positioning */}
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
        {polls.map((poll, index) => (
          <TikTokPollCard
            key={poll.id}
            poll={poll}
            onVote={onVote}
            onLike={onLike}
            onShare={onShare}
            onComment={onComment}
            onSave={onSave}
            onCreatePoll={onCreatePoll}
            isActive={index === activeIndex}
            index={index}
            total={polls.length}
            showLogo={showLogo}
          />
        ))}
      </div>

      {/* Enhanced CSS for better scroll behavior and mobile support */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Enhanced snap behavior */
        .snap-y {
          scroll-snap-type: y mandatory;
        }
        
        .snap-start {
          scroll-snap-align: start;
        }
        
        .snap-always {
          scroll-snap-stop: always;
        }

        /* Perfect full screen support */
        @supports (height: 100dvh) {
          .h-screen {
            height: 100dvh;
          }
        }

        /* Prevent overscroll and improve touch behavior */
        body {
          overscroll-behavior: none;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
        }

        /* Enhance mobile viewport behavior */
        @media (max-width: 768px) {
          /* Ensure proper mobile viewport handling */
          .fixed.inset-0 {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            height: 100vh;
            height: 100dvh;
          }
        }

        /* Better touch interaction */
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        /* Allow text selection for content */
        .text-white, .text-gray-400 {
          -webkit-user-select: auto;
          -khtml-user-select: auto;
          -moz-user-select: auto;
          -ms-user-select: auto;
          user-select: auto;
        }
      `}</style>
    </div>
  );
};

export default TikTokScrollView;