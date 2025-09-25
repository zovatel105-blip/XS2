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
    if (poll.userVote && poll.totalVotes > 0) {
      return Math.round((votes / poll.totalVotes) * 100);
    }
    return 0;
  };

  const winningOption = poll.userVote ? (poll.options?.reduce((prev, current) => 
    (prev.votes > current.votes) ? prev : current
  ) || {}) : {};

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

            {/* Progress overlay - Only show when active, user has voted, and has percentage */}
            {isActive && poll.userVote && percentage > 0 && (
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

            {/* Selection indicator - Only show when active and user has voted */}
            {isActive && isSelected && poll.userVote && (
              <div className="absolute inset-0 ring-2 ring-blue-400/60 ring-inset"></div>
            )}

            {/* Winner indicator - Only show when active and user has voted */}
            {isActive && isWinner && poll.userVote && (
              <div className="absolute inset-0 ring-2 ring-green-400 ring-inset"></div>
            )}

            {/* Mentioned Users - Encima de cada descripción */}
            {isActive && poll.mentioned_users && poll.mentioned_users.length > 0 && (() => {
              let mentionPosition;
              
              // Determine position based on grid type and option index
              if (gridType === 'grid-2x2') {
                if (optionIndex === 0 || optionIndex === 1) {
                  mentionPosition = "bottom-12"; // A, B - encima de descripción que está abajo
                } else {
                  mentionPosition = "top-12"; // C, D - encima de descripción que está arriba
                }
              } else if (gridType === 'grid-3x2') {
                if (optionIndex === 0 || optionIndex === 1 || optionIndex === 2) {
                  mentionPosition = "bottom-12"; // A, B, C - encima de descripción que está abajo
                } else {
                  mentionPosition = "top-12"; // D, E, F - encima de descripción que está arriba
                }
              } else {
                mentionPosition = "bottom-32"; // Encima de descripción en otros grids
              }
              
              return (
                <div className={`absolute ${mentionPosition} left-2 right-2 z-10`}>
                  <div className="flex flex-wrap gap-1 items-center justify-center mb-1">
                    <span className="text-xs text-white/70 mr-1">Menciona:</span>
                    {poll.mentioned_users.slice(0, 2).map((mentionedUser, index) => (
                      <div key={mentionedUser.id || index} className="flex items-center bg-white/20 px-1 py-0.5 rounded-full backdrop-blur-sm">
                        <img
                          src={mentionedUser.avatar_url || '/default-avatar.png'}
                          alt={`@${mentionedUser.username || mentionedUser.display_name}`}
                          className="w-3 h-3 rounded-full mr-1 border border-white/50"
                          onError={(e) => {
                            e.target.src = '/default-avatar.png';
                          }}
                        />
                        <span className="text-xs text-white font-medium">
                          {(mentionedUser.display_name || mentionedUser.username)?.slice(0, 8)}
                        </span>
                      </div>
                    ))}
                    {poll.mentioned_users.length > 2 && (
                      <div className="flex items-center bg-white/20 px-1 py-0.5 rounded-full backdrop-blur-sm">
                        <span className="text-xs text-white/90">
                          +{poll.mentioned_users.length - 2}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Option Description - Only show when active (TikTok scroll) */}
            {isActive && option.text && (() => {
              let descriptionPosition;
              
              // Determine position based on grid type and option index
              if (gridType === 'grid-2x2') {
                // Grid 2x2: A,B (top row - index 0,1) = bottom, C,D (bottom row - index 2,3) = top
                if (optionIndex === 0 || optionIndex === 1) {
                  descriptionPosition = "bottom-4"; // A, B - descripción abajo
                } else {
                  descriptionPosition = "top-4"; // C, D - descripción arriba
                }
              } else if (gridType === 'grid-3x2') {
                // Grid 3x2: A,B,C (top row - index 0,1,2) = bottom, D,E,F (bottom row - index 3,4,5) = top
                if (optionIndex === 0 || optionIndex === 1 || optionIndex === 2) {
                  descriptionPosition = "bottom-4"; // A, B, C - descripción abajo
                } else {
                  descriptionPosition = "top-4"; // D, E, F - descripción arriba
                }
              } else {
                // Other grids: keep current position
                descriptionPosition = "bottom-24";
              }
              
              return (
                <div className={`absolute ${descriptionPosition} left-2 right-2 z-10`}>
                  <div className="w-full bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm text-center">
                    {option.text}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
};

export default GridLayout;