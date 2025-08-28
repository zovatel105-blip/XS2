import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Music, Users, Clock, Calendar, Volume2, Share2, Heart, 
  MessageCircle, MoreVertical, Plus, TrendingUp, Download, Repeat, Shuffle,
  BarChart3, AudioWaveform, Star, Eye, Headphones, Radio, Disc3
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import audioManager from '../services/AudioManager';
import { Button } from '../components/ui/button';
import PollCard from '../components/PollCard';

const AudioDetailPage = () => {
  const { audioId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const waveformRef = useRef(null);
  
  const [audio, setAudio] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [waveformData, setWaveformData] = useState([]);
  const [playbackPosition, setPlaybackPosition] = useState(0);

  // Generate mock waveform data
  useEffect(() => {
    const generateWaveform = () => {
      const data = [];
      for (let i = 0; i < 50; i++) {
        data.push(Math.random() * 100 + 20);
      }
      setWaveformData(data);
    };
    generateWaveform();
  }, [audio]);

  useEffect(() => {
    fetchAudioDetails();
    fetchPostsUsingAudio();
  }, [audioId]);

  const fetchAudioDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      // First try to fetch from user audio endpoint
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/audio/${audioId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAudio(data.audio);
        console.log('✅ Audio cargado desde biblioteca personal:', data.audio);
      } else {
        // If not found in user audio, try music system
        console.log('🔍 Audio no encontrado en biblioteca personal, buscando en sistema de música...');
        
        const musicResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/music/library-with-previews?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (musicResponse.ok) {
          const musicData = await musicResponse.json();
          console.log('🎵 Biblioteca de música cargada:', musicData.music?.length || 0, 'tracks');
          
          const musicTrack = musicData.music?.find(m => m.id === audioId);
          if (musicTrack) {
            // Convert music track to audio format
            const audioData = {
              id: musicTrack.id,
              title: musicTrack.title,
              artist: musicTrack.artist,
              duration: musicTrack.duration || 30,
              public_url: musicTrack.preview_url,
              cover_url: musicTrack.cover,
              uses_count: musicTrack.uses || 0,
              privacy: 'public',
              is_system_music: true,
              source: musicTrack.source || 'iTunes API',
              created_at: musicTrack.created_at || new Date().toISOString(),
              category: musicTrack.category,
              genre: musicTrack.genre
            };
            setAudio(audioData);
            console.log('✅ Audio del sistema encontrado:', audioData);
          } else {
            console.log('❌ Audio no encontrado en sistema de música para ID:', audioId);
            throw new Error('Audio not found');
          }
        } else {
          console.log('❌ Error accediendo a biblioteca de música:', musicResponse.status);
          throw new Error('Audio not found');
        }
      }
    } catch (error) {
      console.error('Error fetching audio details:', error);
      setError('Error cargando detalles del audio');
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del audio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPostsUsingAudio = async () => {
    try {
      setPostsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/audio/${audioId}/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        console.error('Error fetching posts:', response.status);
      }
    } catch (error) {
      console.error('Error fetching posts using audio:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!audio?.public_url) return;

    try {
      if (isPlaying) {
        await audioManager.pause();
        setIsPlaying(false);
      } else {
        const success = await audioManager.play(audio.public_url, {
          startTime: 0,
          loop: true
        });
        if (success) {
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: "Error",
        description: "No se pudo reproducir el audio",
        variant: "destructive"
      });
    }
  };

  const handleUseThisSound = () => {
    // Navigate to create poll with this audio pre-selected
    const audioForCreation = {
      id: audio.id,
      title: audio.title,
      artist: audio.artist,
      cover: audio.cover_url,
      preview_url: audio.public_url,
      duration: audio.duration,
      source: audio.source,
      is_system_music: audio.is_system_music
    };
    
    console.log('🎵 Navegando para crear contenido con audio:', audioForCreation);
    
    navigate('/feed', { 
      state: { 
        createPoll: true, 
        selectedAudio: audioForCreation
      }
    });
    
    toast({
      title: "Audio seleccionado",
      description: `"${audio.title}" de ${audio.artist} ha sido seleccionado para tu nueva publicación`
    });
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;
      const shareText = `🎵 Escucha "${audio.title}" de ${audio.artist}`;
      
      if (navigator.share && navigator.canShare) {
        await navigator.share({
          title: `${audio.title} - ${audio.artist}`,
          text: shareText,
          url: url
        });
        
        toast({
          title: "Compartido exitosamente",
          description: "El audio ha sido compartido"
        });
      } else {
        // Fallback to clipboard
        const textToCopy = `${shareText}\n${url}`;
        await navigator.clipboard.writeText(textToCopy);
        
        toast({
          title: "Enlace copiado",
          description: "El enlace del audio se copió al portapapeles"
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      
      // Final fallback - just copy URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Enlace copiado",
          description: "El enlace se copió al portapapeles"
        });
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        toast({
          title: "Error",
          description: "No se pudo compartir el audio",
          variant: "destructive"
        });
      }
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Quitado de favoritos" : "Agregado a favoritos",
      description: `"${audio.title}" ${isLiked ? 'eliminado de' : 'agregado a'} tus favoritos`
    });
  };

  const handleDownload = () => {
    toast({
      title: "Función próximamente",
      description: "La descarga estará disponible pronto"
    });
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <Music className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-gray-600 text-lg font-medium">Cargando información del audio...</p>
              <p className="text-gray-500 text-sm mt-2">Audio ID: {audioId}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !audio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="mr-4 hover:bg-white/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Audio no encontrado</h1>
          </div>
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-medium mb-2">Este audio no existe o ha sido eliminado</p>
            <p className="text-gray-500 text-sm mb-4">ID de audio: {audioId}</p>
            {error && (
              <p className="text-red-600 text-sm mb-4 bg-red-50 px-4 py-2 rounded-lg inline-block">
                {error}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/feed')} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Volver al feed
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)} className="border-gray-300 hover:bg-gray-50">
                Página anterior
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Header móvil tipo TikTok */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10 p-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-semibold">Audio original</h1>
          <Button 
            variant="ghost"
            onClick={handleLike}
            className="text-white hover:bg-white/10 p-2"
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Hero Section Móvil */}
      <div className="px-4 py-6">
        
        {/* Información del Creador/Artista estilo TikTok */}
        <div className="flex items-center mb-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
              {audio?.cover_url ? (
                <img 
                  src={audio.cover_url} 
                  alt={audio.artist}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            {audio?.is_system_music && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                <Radio className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          <div className="ml-3 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                {audio?.artist || 'Artista'}
              </h2>
              {audio?.is_system_music && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              {audio?.source || 'Audio original'}
            </p>
          </div>
        </div>

        {/* Botón Principal "Usar audio" estilo TikTok */}
        <Button 
          onClick={handleUseThisSound}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-lg text-base mb-6 transition-all duration-200"
        >
          Usar audio
        </Button>

        {/* Cover Art Grande y Player */}
        <div className="relative mx-auto mb-6" style={{width: '280px', height: '280px'}}>
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl group">
            
            {/* Efecto vinyl giratorio cuando reproduce */}
            {isPlaying && (
              <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 rounded-full animate-spin opacity-20"></div>
                <div className="absolute inset-4 bg-black rounded-full opacity-80"></div>
                <div className="absolute inset-8 bg-gray-900 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gray-700 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            )}
            
            {audio?.cover_url ? (
              <img 
                src={audio.cover_url} 
                alt={audio.title}
                className={`relative z-10 w-full h-full object-cover transition-transform duration-300 ${isPlaying ? 'animate-pulse' : 'group-hover:scale-105'}`}
              />
            ) : (
              <div className="relative z-10 w-full h-full bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 flex items-center justify-center group-hover:from-gray-700 group-hover:to-gray-500 transition-colors">
                <Music className="w-20 h-20 text-white" />
              </div>
            )}
            
            {/* Botón de Play Central */}
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 group-hover:bg-black/30"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-full p-4 transform hover:scale-110 transition-transform shadow-2xl">
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-gray-900" />
                ) : (
                  <Play className="w-8 h-8 text-gray-900 ml-1" />
                )}
              </div>
            </button>

            {/* Indicador de reproducción */}
            {isPlaying && (
              <div className="absolute top-4 right-4 z-30">
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Reproduciendo
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información del Audio */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">
            {audio?.title}
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Audio original · {audio?.artist}
          </p>
          
          {/* Stats compactos */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(audio?.duration || 0)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{formatNumber(audio?.uses_count || 0)} usos</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{formatNumber((audio?.uses_count || 0) * 4.7)} vistas</span>
            </div>
          </div>

          {/* Tags estilo TikTok */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {audio?.category && (
              <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs font-medium">
                #{audio.category}
              </span>
            )}
            {audio?.genre && (
              <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs font-medium">
                #{audio.genre}
              </span>
            )}
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Trending
            </span>
          </div>
        </div>

        {/* Waveform Visual (más compacto para móvil) */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AudioWaveform className="w-4 h-4 text-red-400" />
              <span className="text-white text-sm font-medium">Waveform</span>
            </div>
            <span className="text-xs text-gray-400">{formatDuration(audio?.duration || 0)}</span>
          </div>
          <div className="flex items-end gap-1 h-16" ref={waveformRef}>
            {waveformData.map((height, index) => (
              <div
                key={index}
                className={`bg-gradient-to-t from-red-500 to-pink-400 rounded-full transition-all duration-300 ${
                  isPlaying && index < playbackPosition ? 'opacity-100' : 'opacity-40'
                }`}
                style={{
                  height: `${height}%`,
                  width: '3px',
                  animation: isPlaying ? `waveform 1s ease-in-out infinite ${index * 0.1}s` : 'none'
                }}
              />
            ))}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Button 
            variant="outline" 
            onClick={handlePlayPause}
            className="border-gray-600 bg-gray-800/50 hover:bg-gray-700 text-white rounded-xl py-3"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleShare}
            className="border-gray-600 bg-gray-800/50 hover:bg-gray-700 text-white rounded-xl py-3"
          >
            <Share2 className="w-5 h-5" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleDownload}
            className="border-gray-600 bg-gray-800/50 hover:bg-gray-700 text-white rounded-xl py-3"
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>

      </div>

      {/* Sección de Posts que usan este audio */}
      <div className="border-t border-gray-800 pt-6">
        <div className="px-4 mb-4">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            Videos con este audio
            <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-full text-sm">
              {posts.length}
            </span>
          </h4>
        </div>
        
        {postsLoading ? (
          <div className="text-center py-12 px-4">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="w-12 h-12 border-4 border-gray-700 border-t-red-500 rounded-full animate-spin"></div>
              <Music className="w-5 h-5 text-red-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-400">Cargando videos...</p>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4 px-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-gray-900/30 rounded-xl p-4 border border-gray-800">
                <PollCard 
                  poll={post}
                  onVote={(optionId) => {
                    console.log('Vote for option:', optionId);
                  }}
                  onLike={(pollId) => {
                    console.log('Like poll:', pollId);
                  }}
                  onShare={(pollId) => {
                    console.log('Share poll:', pollId);
                  }}
                  onComment={(pollId) => {
                    console.log('Comment on poll:', pollId);
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto border-2 border-gray-700">
                <MessageCircle className="w-8 h-8 text-gray-500" />
              </div>
            </div>
            <h5 className="text-white text-lg font-semibold mb-2">¡Sé el primero!</h5>
            <p className="text-gray-400 mb-6 text-sm max-w-sm mx-auto">
              Aún no hay videos con este audio. ¿Por qué no crear el primero?
            </p>
            <Button 
              onClick={handleUseThisSound}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear video
            </Button>
          </div>
        )}
      </div>

      {/* CSS personalizado para animaciones */}
      <style jsx>{`
        @keyframes waveform {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
      `}</style>
    </div>
  );
};

export default AudioDetailPage;