import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Trophy } from 'lucide-react';

const CarouselLayout = ({ 
  poll, 
  onVote, 
  isActive,
  currentSlide: externalCurrentSlide,
  onSlideChange,
  handleTouchStart: externalTouchStart,
  handleTouchEnd: externalTouchEnd,
  // 🚀 PERFORMANCE: Carousel optimization props
  optimizeVideo = false,
  renderPriority = 'medium',
  shouldPreload = true,
  isVisible = true,
  shouldUnload = false
}) => {
  const navigate = useNavigate();
  
  // Detect mobile device with window resize handling
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 🚀 PERFORMANCE: Use external slide control if provided, otherwise internal
  const [internalCurrentSlide, setInternalCurrentSlide] = useState(0);
  const currentSlide = externalCurrentSlide !== undefined ? externalCurrentSlide : internalCurrentSlide;
  const setCurrentSlide = onSlideChange || setInternalCurrentSlide;
  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const totalSlides = poll.options ? poll.options.length : 1;

  // Navigation functions
  const nextSlide = () => {
    if (totalSlides <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    if (totalSlides <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Go to specific slide
  const goToSlide = (index) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  };

  // Touch handlers for HORIZONTAL swipe navigation
  const handleTouchStart = (e) => {
    if (totalSlides <= 1) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (totalSlides <= 1) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || totalSlides <= 1) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;    // Swipe left = next slide
    const isRightSwipe = distance < -50; // Swipe right = previous slide

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  // Reset carousel when poll changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [poll.id]);

  // Auto-advance carousel every 5 seconds when active (fixed dependencies)
  useEffect(() => {
    if (!isActive || totalSlides <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, [isActive, totalSlides]); // Removed currentSlide dependency to prevent reset

  const getPercentage = (votes) => {
    if (poll.userVote && poll.totalVotes > 0) {
      return Math.round((votes / poll.totalVotes) * 100);
    }
    return 0;
  };

  const winningOption = poll.userVote ? (poll.options?.reduce((prev, current) => 
    (prev.votes > current.votes) ? prev : current
  ) || {}) : {};

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Carousel slides - HORIZONTAL carousel SIMPLIFIED */}
      <div 
        className="flex h-full transition-transform duration-300 ease-in-out"
        style={{ 
          transform: `translateX(-${currentSlide * 100}%)`,
          width: '100%'  // Fixed width
        }}
      >
        {poll.options.map((option, optionIndex) => {
          const percentage = getPercentage(option.votes);
          const isWinner = option.id === winningOption.id && poll.userVote;
          const isSelected = poll.userVote === option.id;

          return (
            <div
              key={option.id}
              className="relative flex-shrink-0 h-full cursor-pointer group overflow-hidden touch-manipulation"
              onClick={() => onVote(option.id)}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                width: '100%'  // Each slide is full width
              }}
            >
              {/* 🚀 ULTRA-OPTIMIZED Background media for carousel */}
              <div className="absolute inset-0 w-full h-full">
                {option.media?.url ? (
                  option.media?.type === 'video' ? (
                    <video 
                      src={option.media.url} 
                      className="w-full h-full object-cover object-center"
                      // ✅ FIXED: Play video for current slide when active
                      autoPlay={isActive && currentSlide === optionIndex}
                      muted
                      loop
                      playsInline
                      // 🚀 PERFORMANCE: Smart preloading for carousel
                      preload={
                        currentSlide === optionIndex ? "auto" : // Current slide: full preload
                        Math.abs(currentSlide - optionIndex) <= 1 ? "metadata" : // Adjacent slides: metadata only
                        "none" // Distant slides: no preload
                      }
                      // ✅ FIXED: Always show videos in carousel
                      style={{
                        display: 'block'
                      }}
                      loading={currentSlide === optionIndex ? "eager" : "lazy"}
                      onLoadStart={() => {
                        if (optimizeVideo && currentSlide === optionIndex) {
                          console.log(`🎬 Carousel video loading: slide ${optionIndex} (Priority: ${renderPriority})`);
                        }
                      }}
                      onCanPlay={() => {
                        if (optimizeVideo) {
                          console.log(`▶️ Carousel video ready: slide ${optionIndex}`);
                        }
                      }}
                      onError={(e) => {
                        console.warn(`❌ Carousel video load failed: ${option.media.url}`, e);
                      }}
                    />
                  ) : (
                    <img 
                      src={option.media.url} 
                      alt={option.text || `Slide ${optionIndex + 1}`}
                      className="w-full h-full object-cover object-center"
                      // 🚀 IMAGE OPTIMIZATION: Lazy load non-current slides
                      loading={currentSlide === optionIndex ? "eager" : "lazy"}
                      style={{
                        display: shouldUnload ? 'none' : 'block'
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

              {/* Interactive overlay */}
              <div className="absolute inset-0 bg-transparent active:bg-white/10 transition-colors duration-150"></div>

              {/* Progress overlay - Only show when active, user has voted on mobile, and has percentage */}
              {isActive && isMobile && poll.userVote && percentage > 0 && (
                <div 
                  className={cn(
                    "absolute inset-x-0 bottom-0 transition-all duration-1000 ease-out",
                    isWinner 
                      ? "bg-gradient-to-t from-green-500/90 via-green-600/70 to-green-400/40"
                      : isSelected 
                        ? "bg-gradient-to-t from-blue-500/30 via-blue-600/20 to-blue-400/10"
                        : "bg-gradient-to-t from-black/50 via-black/30 to-transparent"
                  )}
                  style={{ 
                    height: `${percentage}%`,
                    transform: `translateY(${100 - percentage}%)`,
                    transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {/* Trophy icon in progress bar for winner */}
                  {isWinner && (
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                      <Trophy className="w-4 h-4 text-green-300 drop-shadow-lg" />
                    </div>
                  )}
                </div>
              )}
              
              {/* COMING SOON message for desktop */}
              {isActive && !isMobile && poll.totalVotes > 0 && (
                <div className="absolute top-2 right-2 bg-gray-800/80 text-white px-3 py-1 rounded-full text-xs font-semibold z-20">
                  COMING SOON
                </div>
              )}

              {/* Selection indicator - Only show when active and user has voted on mobile */}
              {isActive && isMobile && isSelected && poll.userVote && (
                <div className="absolute inset-0 ring-2 ring-blue-400/60 ring-inset"></div>
              )}

              {/* Winner indicator - Only show when active and user has voted */}
              {isActive && isWinner && poll.userVote && (
                <div className="absolute inset-0 ring-2 ring-green-400 ring-inset"></div>
              )}

              {/* Mentioned Users - Específicas para esta opción */}
              {isActive && option.mentioned_users && option.mentioned_users.length > 0 && (
                <div className="absolute bottom-32 left-4 right-4 z-10">
                  <div className="flex flex-wrap gap-1 items-center justify-center mb-2">
                    {option.mentioned_users.slice(0, 3).map((mentionedUser, index) => (
                      <button
                        key={mentionedUser.id || index}
                        onClick={(e) => {
                          e.stopPropagation();
                          const username = mentionedUser.username || mentionedUser.display_name?.toLowerCase().replace(/\s+/g, '_');
                          if (username) {
                            navigate(`/profile/${username}`);
                          }
                        }}
                        className="flex items-center bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-all duration-200"
                      >
                        <img
                          src={mentionedUser.avatar_url || '/default-avatar.png'}
                          alt={`@${mentionedUser.username || mentionedUser.display_name}`}
                          className="w-4 h-4 rounded-full mr-1 border border-white/50"
                          onError={(e) => {
                            e.target.src = '/default-avatar.png';
                          }}
                        />
                        <span className="text-xs text-white font-medium">
                          {mentionedUser.display_name || mentionedUser.username}
                        </span>
                      </button>
                    ))}
                    {option.mentioned_users.length > 3 && (
                      <div className="flex items-center bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                        <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center mr-1">
                          <span className="text-xs text-white font-bold">+</span>
                        </div>
                        <span className="text-xs text-white/90">
                          {option.mentioned_users.length - 3} más
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Option Description - Only show when active (TikTok scroll) */}
              {isActive && option.text && (
                <div className="absolute bottom-24 left-4 right-4 z-10">
                  <div className="w-full bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm text-center">
                    {option.text}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation indicators - Only show when active (not in profile grid) */}
      {isActive && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-2 z-20">
          {poll.options.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(idx);
              }}
              className={cn(
                "w-8 h-2 rounded-full transition-all duration-300 flex-shrink-0",
                idx === currentSlide 
                  ? "bg-white shadow-lg" 
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}

      {/* Navigation arrows - Only show when active (not in profile grid) */}
      {isActive && totalSlides > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-2xl z-20 transition-all duration-200 hover:scale-110"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-2xl z-20 transition-all duration-200 hover:scale-110"
          >
            ›
          </button>
        </>
      )}

      {/* Slide counter - Only show when active (not in profile grid) */}
      {isActive && (
        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm z-20">
          {currentSlide + 1} / {totalSlides}
        </div>
      )}
    </div>
  );
};

export default CarouselLayout;