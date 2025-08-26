import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  Music, 
  Search, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Check,
  Sparkles,
  Clock,
  TrendingUp,
  Users,
  Loader2,
  Globe,
  Star
} from 'lucide-react';
import { 
  musicLibrary, 
  musicCategories, 
  getMusicByCategory, 
  searchMusic as searchMusicStatic, 
  getRecommendedMusic,
  getTrendingMusic,
  formatDuration,
  formatUses
} from '../services/musicLibrary';
import musicService from '../services/musicService';
import { useToast } from '../hooks/use-toast';

const MusicWaveform = ({ waveform, isPlaying, duration = 30 }) => {
  return (
    <div className="flex items-center gap-0.5 h-6 justify-center">
      {waveform.map((height, index) => (
        <div
          key={index}
          className={`w-0.5 bg-current transition-all duration-75 ${
            isPlaying ? 'animate-pulse' : 'opacity-70'
          }`}
          style={{
            height: `${height * 20 + 4}px`,
            animationDelay: `${index * 50}ms`
          }}
        />
      ))}
    </div>
  );
};

// Simplified TikTok/Instagram style music card
const SimpleMusicCard = ({ music, isSelected, isPlaying, onSelect, onPlay, showSource = false }) => {
  return (
    <div 
      className={`
        flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50
        ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
      `}
      onClick={() => onSelect(music)}
    >
      {/* Cover with play button */}
      <div 
        className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600 flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onPlay(music);
        }}
      >
        <img 
          src={music.cover} 
          alt={music.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/90 flex items-center justify-center transition-all ${isPlaying ? 'scale-110' : ''}`}>
            {isPlaying ? (
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black rounded-full animate-pulse" />
            ) : (
              <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black ml-0.5" />
            )}
          </div>
        </div>
        
        {/* Priority/Trending badge */}
        {(music.isTrending || music.isPriority) && (
          <div className="absolute -top-1 -right-1">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              music.isPriority ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {music.isPriority ? (
                <Star className="w-2 h-2 text-white" />
              ) : (
                <TrendingUp className="w-2 h-2 text-white" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Music info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-xs sm:text-sm text-gray-900 truncate flex items-center gap-1">
          {music.title}
          {music.isOriginal && <Sparkles className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
        </h4>
        <p className="text-xs text-gray-500 truncate">
          {music.artist}
        </p>
        
        {/* Source and uses count */}
        <div className="flex items-center gap-2 mt-0.5">
          {showSource && music.source && (
            <div className="flex items-center gap-1">
              <Globe className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-xs text-gray-400">{music.source}</span>
            </div>
          )}
          {music.uses > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-xs text-gray-400">{formatUses(music.uses)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Duration */}
      <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
        <Clock className="w-3 h-3" />
        {formatDuration(music.duration)}
      </div>

      {/* Simple waveform indicator - Hidden on very small screens */}
      <div className="hidden sm:flex items-center gap-0.5">
        {(music.waveform || []).slice(0, 4).map((height, index) => (
          <div
            key={index}
            className={`w-1 bg-gray-400 rounded-full transition-all duration-75 ${
              isPlaying ? 'animate-pulse' : ''
            }`}
            style={{
              height: `${height * 12 + 4}px`,
              animationDelay: `${index * 100}ms`
            }}
          />
        ))}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </div>
      )}
    </div>
  );
};

const MusicSelector = ({ onSelectMusic, selectedMusic, pollTitle = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [currentMusic, setCurrentMusic] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Obtener música filtrada
  const getFilteredMusic = () => {
    if (searchQuery.trim()) {
      return searchMusic(searchQuery);
    }
    
    // Si hay un título de poll, mostrar recomendaciones primero
    if (pollTitle && activeCategory === 'Trending') {
      const recommended = getRecommendedMusic(pollTitle);
      const trending = getTrendingMusic();
      // Mezclar recomendadas con trending, evitar duplicados
      const combined = [...recommended];
      trending.forEach(music => {
        if (!combined.find(m => m.id === music.id)) {
          combined.push(music);
        }
      });
      return combined;
    }
    
    return getMusicByCategory(activeCategory);
  };

  const filteredMusic = getFilteredMusic();

  const handlePlay = (music) => {
    // Pausar música anterior si hay una reproduciéndose
    if (isPlaying && currentMusic?.id !== music.id) {
      setIsPlaying(false);
    }
    
    setCurrentMusic(music);
    setIsPlaying(true);
    
    // Simular reproducción por 3 segundos
    setTimeout(() => {
      setIsPlaying(false);
      setCurrentMusic(null);
    }, 3000);
  };

  const handleSelectMusic = (music) => {
    onSelectMusic(music);
  };

  // Obtener categorías principales para mostrar
  const mainCategories = ['Trending', 'Reggaeton', 'Trap', 'Urbano Español', 'Pop Latino', 'Hip-Hop'];

  return (
    <div className="space-y-3 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-gray-700" />
          <h3 className="font-bold text-lg">Agregar música</h3>
        </div>
        {selectedMusic && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectMusic(null)}
            className="text-gray-500 hover:text-red-500 text-xs"
          >
            Quitar
          </Button>
        )}
      </div>

      {/* Quick search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar canciones, artistas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-gray-50 border-0 rounded-full"
        />
      </div>

      {/* Recomendaciones basadas en el título */}
      {pollTitle && !searchQuery && activeCategory === 'Trending' && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold text-purple-700">Recomendado para tu contenido</span>
          </div>
          <p className="text-xs text-purple-600">Basado en: "{pollTitle}"</p>
        </div>
      )}

      {/* Quick categories - Horizontal scroll like TikTok */}
      {!searchQuery && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {mainCategories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium ${
                activeCategory === category
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-0'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* Music list - Simple vertical list like Instagram */}
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {filteredMusic.length > 0 ? (
          <>
            {filteredMusic.map((music) => (
              <SimpleMusicCard
                key={music.id}
                music={music}
                isSelected={selectedMusic?.id === music.id}
                isPlaying={currentMusic?.id === music.id && isPlaying}
                onSelect={handleSelectMusic}
                onPlay={handlePlay}
              />
            ))}
            
            {/* Add original sound option at the end */}
            <div className="border-t pt-2 mt-3">
              <SimpleMusicCard
                music={{
                  id: 'original_sound',
                  title: 'Sonido Original',
                  artist: 'Sin música de fondo',
                  duration: 0,
                  cover: '/images/original-sound.png',
                  category: 'Original',
                  isOriginal: true,
                  uses: 0,
                  waveform: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3]
                }}
                isSelected={selectedMusic?.id === 'original_sound'}
                isPlaying={false}
                onSelect={handleSelectMusic}
                onPlay={() => {}} // No play for original sound
              />
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No se encontró música</p>
            <p className="text-xs text-gray-300 mt-1">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicSelector;