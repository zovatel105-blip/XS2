import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Music, Loader2 } from 'lucide-react';
import audioManager from '../services/AudioManager';
import realMusicService from '../services/realMusicService';

const MusicPlayer = ({ music, isVisible = true, onTogglePlay, className = '', autoPlay = false, loop = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [realPreviewUrl, setRealPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // Efecto para obtener preview real
  useEffect(() => {
    const fetchRealPreview = async () => {
      if (!music || !music.artist || !music.title) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Primero intentar usar preview_url si ya existe
        if (music.preview_url) {
          setRealPreviewUrl(music.preview_url);
          setIsLoading(false);
          return;
        }
        
        // Si no, buscar en iTunes
        const result = await realMusicService.getCachedPreview(music.artist, music.title);
        
        if (mountedRef.current) {
          if (result.success && result.preview_url) {
            setRealPreviewUrl(result.preview_url);
            console.log(`✅ Preview real obtenido para ${music.title}:`, result.preview_url);
          } else {
            setError('Preview no disponible');
            console.log(`❌ No hay preview para ${music.title}`);
          }
          setIsLoading(false);
        }
      } catch (error) {
        if (mountedRef.current) {
          console.error('Error obteniendo preview:', error);
          setError('Error cargando audio');
          setIsLoading(false);
        }
      }
    };

    fetchRealPreview();

    return () => {
      mountedRef.current = false;
    };
  }, [music?.artist, music?.title, music?.preview_url]);

  // Efecto para autoplay
  useEffect(() => {
    if (autoPlay && realPreviewUrl && isVisible && !isPlaying) {
      handlePlay();
    }
  }, [autoPlay, realPreviewUrl, isVisible]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (!music || !isVisible) {
    return null;
  }

  const handlePlay = async () => {
    if (!realPreviewUrl) {
      console.log('❌ No hay URL de preview disponible');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await audioManager.play(realPreviewUrl, {
        startTime: 0,
        loop: loop
      });

      if (success && mountedRef.current) {
        setIsPlaying(true);
        console.log(`🎵 Reproduciendo: ${music.title} - ${music.artist}`);
        
        if (onTogglePlay) {
          onTogglePlay(true);
        }
      }
    } catch (error) {
      console.error('Error reproduciendo audio:', error);
      setError('Error reproduciendo');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handlePause = async () => {
    try {
      await audioManager.pause();
      
      if (mountedRef.current) {
        setIsPlaying(false);
        console.log(`⏸️ Pausado: ${music.title}`);
        
        if (onTogglePlay) {
          onTogglePlay(false);
        }
      }
    } catch (error) {
      console.error('Error pausando audio:', error);
    }
  };

  const handleTogglePlay = async () => {
    if (isPlaying) {
      await handlePause();
    } else {
      await handlePlay();
    }
  };

  return (
    <div className={`flex-shrink-0 ${className}`}>
      {/* Reproductor compacto estilo TikTok con audio real */}
      <div 
        onClick={handleTogglePlay}
        className="relative cursor-pointer group"
      >
        {/* Container con imagen de fondo */}
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
          {music.cover ? (
            <img 
              src={music.cover} 
              alt={music.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
          )}
          
          {/* Overlay de reproducción */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isLoading ? (
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-3 h-3 text-white fill-white" />
            ) : (
              <Play className="w-3 h-3 text-white fill-white ml-0.5" />
            )}
          </div>
          
          {/* Indicador de música activa cuando está reproduciéndose */}
          {isPlaying && (
            <div className="absolute -top-0.5 -right-0.5">
              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
            </div>
          )}

          {/* Indicador de audio real */}
          {realPreviewUrl && (
            <div className="absolute -bottom-0.5 -left-0.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full border border-white shadow-sm" 
                   title="Audio real disponible" />
            </div>
          )}

          {/* Indicador de error */}
          {error && (
            <div className="absolute -bottom-0.5 -left-0.5">
              <div className="w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm" 
                   title={error} />
            </div>
          )}
        </div>
        
        {/* Animación de ondas cuando está reproduciéndose */}
        {isPlaying && (
          <div className="absolute -inset-2 opacity-60">
            <div className="w-12 h-12 rounded-full border-2 border-white/30 animate-ping" />
          </div>
        )}

        {/* Tooltip mejorado */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div className="bg-black/90 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm whitespace-nowrap border border-white/20 shadow-lg max-w-48 text-center">
            <div className="font-medium truncate">{music.title}</div>
            <div className="text-gray-300 truncate">{music.artist}</div>
            {realPreviewUrl && (
              <div className="text-blue-400 text-[10px] mt-1">🎵 Audio Real</div>
            )}
            {error && (
              <div className="text-red-400 text-[10px] mt-1">❌ {error}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;