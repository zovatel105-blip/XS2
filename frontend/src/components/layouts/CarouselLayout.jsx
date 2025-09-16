import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Trophy } from 'lucide-react';

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
    return poll.userVote && poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
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
                    />
                  ) : (
                    <img 
                      src={option.media.url} 
                      alt={option.text || `Slide ${optionIndex + 1}`}
                      className="w-full h-full object-cover object-center"
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

              {/* Progress overlay - Only show when active and user has voted */}
              {isActive && poll.userVote && (
                <div 
                  className={cn(
                    "absolute inset-x-0 bottom-0 transition-all duration-1000 ease-out",
                    isSelected 
                      ? "bg-gradient-to-t from-blue-500/30 via-blue-600/20 to-blue-400/10"
                      : isWinner 
                        ? "bg-gradient-to-t from-green-500/90 via-green-600/70 to-green-400/40"
                        : "bg-gradient-to-t from-black/50 via-black/30 to-transparent"
                  )}
                  style={{ 
                    height: `${Math.max(percentage, 5)}%`,
                    transform: `translateY(${100 - Math.max(percentage, 5)}%)`,
                    transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              )}

              {/* Selection indicator - Only show when active (not in profile grid) */}
              {isActive && isSelected && (
                <div className="absolute inset-0 ring-2 ring-blue-400/60 ring-inset"></div>
              )}

              {/* Winner indicator - Only show when active and user has voted */}
              {isActive && isWinner && poll.userVote && (
                <div className="absolute inset-0 ring-2 ring-green-400 ring-inset"></div>
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