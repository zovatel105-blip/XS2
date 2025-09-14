import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

const CarouselLayout = ({ poll, onVote, isActive }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const totalSlides = poll.options ? poll.options.length : 1;

  // Navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Touch handlers for VERTICAL swipe navigation
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > 50;
    const isDownSwipe = distance < -50;

    if (isUpSwipe) {
      nextSlide();
    }
    if (isDownSwipe) {
      prevSlide();
    }
  };

  // Reset carousel when poll changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [poll.id]);

  // Auto-advance carousel every 5 seconds when active
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isActive, currentSlide]);

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
      {/* Carousel slides - VERTICAL carousel */}
      <div 
        className="flex flex-col w-full transition-transform duration-300 ease-in-out"
        style={{ 
          transform: `translateY(-${currentSlide * 100}%)`,
          height: `${poll.options.length * 100}%`
        }}
      >
        {poll.options.map((option, optionIndex) => {
          const percentage = getPercentage(option.votes);
          const isWinner = option.id === winningOption.id && poll.totalVotes > 0;
          const isSelected = poll.userVote === option.id;

          return (
            <div
              key={option.id}
              className="relative flex-shrink-0 w-full cursor-pointer group overflow-hidden touch-manipulation"
              onClick={() => onVote(option.id)}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                height: `${100 / poll.options.length}%`
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
                      alt={option.text}
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

              {/* Option text overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6">
                <div className="flex justify-between items-end">
                  <div className="flex-1">
                    {option.text && (
                      <p className="text-white font-bold text-xl mb-2 leading-tight drop-shadow-lg">
                        {option.text}
                      </p>
                    )}
                    
                    {/* Mentioned users */}
                    {option.mentionedUsers && option.mentionedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {option.mentionedUsers.map((user, idx) => (
                          <span key={idx} className="bg-blue-500/80 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                            @{user.username}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Vote percentage */}
                  {poll.totalVotes > 0 && (
                    <div className="flex flex-col items-end ml-4">
                      <div className="bg-white/90 backdrop-blur-sm text-black px-3 py-2 rounded-xl font-bold text-lg shadow-lg">
                        {percentage}%
                      </div>
                      <div className="text-white/80 text-sm mt-1">
                        {option.votes} voto{option.votes !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
              setCurrentSlide(idx);
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

      {/* Navigation arrows - VERTICAL */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-2xl z-20 transition-all duration-200 hover:scale-110"
          >
            ∧
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-2xl z-20 transition-all duration-200 hover:scale-110"
          >
            ∨
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