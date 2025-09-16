import React from 'react';
import { cn } from '../../lib/utils';
import { Trophy } from 'lucide-react';

const GridLayout = ({ poll, onVote, gridType, isActive = true }) => {
  const getGridClasses = () => {
    switch (gridType) {
      case 'vertical': // 2 columnas lado a lado
        return 'grid grid-cols-2 gap-0.5';
      case 'horizontal': // 2 filas arriba y abajo
        return 'grid grid-cols-1 grid-rows-2 gap-0.5';
      case 'triptych-vertical': // 3 columnas lado a lado
        return 'grid grid-cols-3 gap-0.5';
      case 'triptych-horizontal': // 3 filas arriba y abajo
        return 'grid grid-cols-1 grid-rows-3 gap-0.5';
      case 'grid-2x2': // 4 partes (cuadrícula 2x2)
        return 'grid grid-cols-2 grid-rows-2 gap-0.5';
      case 'grid-3x2': // 6 partes (cuadrícula 3x2)
        return 'grid grid-cols-3 grid-rows-2 gap-0.5';
      case 'horizontal-3x2': // 6 partes (cuadrícula 2x3)
        return 'grid grid-cols-2 grid-rows-3 gap-0.5';
      default:
        return 'grid grid-cols-2 gap-0.5';
    }
  };

  const getPercentage = (votes) => {
    return poll.userVote && poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
  };

  const winningOption = poll.options?.reduce((prev, current) => 
    (prev.votes > current.votes) ? prev : current
  ) || {};

  return (
    <div className={cn("w-full h-full", getGridClasses())}>
      {poll.options.map((option, optionIndex) => {
        const percentage = getPercentage(option.votes);
        const isWinner = option.id === winningOption.id && poll.userVote;
        const isSelected = poll.userVote === option.id;

        return (
          <div
            key={option.id}
            className="relative cursor-pointer group h-full w-full overflow-hidden touch-manipulation"
            onClick={() => onVote(option.id)}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            {/* Background media */}
            <div className="absolute inset-0 w-full h-full">
              {option.media?.url ? (
                option.media?.type === 'video' ? (
                  <video 
                    src={option.media.url} 
                    className="w-full h-full object-cover object-center"
                    autoPlay={true}
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
  );
};

export default GridLayout;