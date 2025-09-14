import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

const CarouselLayout = ({ poll, onVote, isActive }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
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
    // Debug: Log poll options
    console.log('🎠 Carousel options:', poll.options?.map((opt, idx) => ({
      index: idx,
      id: opt.id,
      hasMedia: !!opt.media,
      mediaUrl: opt.media?.url,
      mediaType: opt.media?.type
    })));
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
    return poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
  };

  const winningOption = poll.options?.reduce((prev, current) => 
    (prev.votes > current.votes) ? prev : current
  ) || {};

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
          const isWinner = option.id === winningOption.id && poll.totalVotes > 0;
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
              {/* Background media */}
              <div className="absolute inset-0 w-full h-full">
                {option.media?.url ? (
                  option.media?.type === 'video' ? (
                    <video 
                      src={option.media.url} 
                      className="w-full h-full object-cover object-center"
                      autoPlay={isActive && currentSlide === optionIndex}
                      muted
                      loop
                      playsInline
                      onError={(e) => console.log('Video error:', e, option.media.url)}
                    />
                  ) : (
                    <img 
                      src={option.media.url} 
                      alt={option.text || `Slide ${optionIndex + 1}`}
                      className="w-full h-full object-cover object-center"
                      loading="eager"
                      onError={(e) => {
                        console.log('Image error:', e, option.media.url);
                        e.target.style.display = 'none';
                      }}
                      onLoad={() => console.log('Image loaded:', option.media.url)}
                    />
                  )
                ) : (
                  <div className={cn(
                    "w-full h-full flex items-center justify-center",
                    optionIndex === 0 ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500" :
                    optionIndex === 1 ? "bg-gradient-to-br from-gray-300 via-gray-500 to-gray-700" :
                    optionIndex === 2 ? "bg-gradient-to-br from-yellow-500 via-red-500 to-pink-600" :
                    "bg-gradient-to-br from-amber-600 via-orange-700 to-red-800"
                  )}>
                    <div className="text-white text-lg font-bold">
                      Slide {optionIndex + 1}
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive overlay */}
              <div className="absolute inset-0 bg-transparent active:bg-white/10 transition-colors duration-150"></div>

              {/* Progress overlay */}
              {poll.totalVotes > 0 && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/30 to-transparent transition-all duration-700 ease-out"
                  style={{ 
                    height: `${percentage}%`,
                    backdropFilter: 'blur(2px)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent" />
                </div>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-[1px] border-2 border-blue-400/60">
                  <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    ✓ Votado
                  </div>
                </div>
              )}

              {/* Winner indicator */}
              {isWinner && poll.totalVotes > 0 && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                  👑 Ganador
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation indicators */}
      <div className="absolute top-4 left-4 flex gap-2 z-20">
        {poll.options.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(idx);
            }}
            className={cn(
              "w-8 h-2 rounded-full transition-all duration-300",
              idx === currentSlide 
                ? "bg-white shadow-lg" 
                : "bg-white/50 hover:bg-white/70"
            )}
          />
        ))}
      </div>

      {/* Navigation arrows - HORIZONTAL */}
      {totalSlides > 1 && (
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

      {/* Slide counter */}
      <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm z-20">
        {currentSlide + 1} / {totalSlides}
      </div>
    </div>
  );
};

export default CarouselLayout;