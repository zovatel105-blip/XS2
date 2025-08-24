import React, { useState } from 'react';
import { Music, Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '../lib/utils';

const MusicDisplay = ({ music, className = '', compact = false, showPlayer = true }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!music) {
    return null;
  }

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement actual music playback
  };

  if (compact) {
    // Estilo compacto para TikTok view
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Album art circular */}
        <div 
          className={cn(
            "relative w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-lg cursor-pointer transition-transform duration-200",
            isPlaying ? "animate-spin" : "hover:scale-110"
          )}
          onClick={handleTogglePlay}
        >
          <img 
            src={music.cover} 
            alt={music.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <Music className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Music info - scrolling text */}
        <div className="flex-1 min-w-0">
          <div className={cn(
            "text-white text-sm font-medium truncate",
            isPlaying && "animate-pulse"
          )}>
            🎵 {music.title} - {music.artist}
          </div>
        </div>
      </div>
    );
  }

  // Full music display for feeds
  return (
    <div className={cn("bg-black/60 backdrop-blur-sm rounded-xl p-3 border border-white/20", className)}>
      <div className="flex items-center gap-3">
        {/* Album cover */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
          <img 
            src={music.cover} 
            alt={music.title}
            className="w-full h-full object-cover"
          />
          
          {/* Play button overlay */}
          {showPlayer && (
            <button
              onClick={handleTogglePlay}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 group"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              ) : (
                <Play className="w-4 h-4 text-white group-hover:scale-110 transition-transform ml-0.5" />
              )}
            </button>
          )}

          {/* Playing indicator */}
          {isPlaying && (
            <div className="absolute bottom-1 right-1">
              <div className="flex gap-0.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-green-400 rounded-full animate-bounce"
                    style={{
                      height: `${Math.random() * 8 + 4}px`,
                      animationDelay: `${i * 100}ms`,
                      animationDuration: '1s'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Music info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <Music className="w-3 h-3 text-white/80" />
            <span className="text-white font-semibold text-sm truncate">
              {music.title}
            </span>
          </div>
          <div className="text-white/70 text-xs truncate">
            {music.artist} {music.isOriginal && '• Original'}
          </div>
          
          {/* Category badge */}
          <div className="mt-1">
            <span className="inline-block bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
              {music.category}
            </span>
          </div>
        </div>

        {/* Waveform visualization */}
        <div className="hidden sm:flex items-center gap-0.5 h-8">
          {music.waveform?.slice(0, 12).map((height, index) => (
            <div
              key={index}
              className={cn(
                "w-1 bg-white/60 rounded-full transition-all duration-100",
                isPlaying && "animate-pulse"
              )}
              style={{
                height: `${height * 20 + 4}px`,
                animationDelay: isPlaying ? `${index * 50}ms` : '0ms'
              }}
            />
          ))}
        </div>

        {/* Volume indicator */}
        <Volume2 className="w-4 h-4 text-white/60" />
      </div>
    </div>
  );
};

export default MusicDisplay;