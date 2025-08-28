import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Music, Users, Clock, Calendar, Volume2, Share2, Heart, 
  MessageCircle, MoreVertical, Plus, TrendingUp, Download, Repeat, Shuffle,
  BarChart3, AudioWaveform, Star, Eye, Headphones, Radio, Disc3, Bookmark, Send, Apple
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

  const handleAddToItunes = () => {
    toast({
      title: "Añadir a iTunes",
      description: "Función próximamente disponible"
    });
  };

  const handleSave = () => {
    toast({
      title: "Guardado",
      description: "Audio guardado en tus favoritos"
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
    <div className="min-h-screen bg-white">
      
      {/* Header con degradado verde claro */}
      <div className="sticky top-0 z-50 bg-gradient-to-b from-green-100 to-green-50 border-b border-green-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-gray-900 hover:bg-white/50 p-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="text-gray-900 hover:bg-white/50 p-2"
          >
            <Share2 className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-6">
        
        {/* Parte Superior - Información del Audio */}
        <div className="mb-8">
          
          {/* Fila principal con miniatura y detalles */}
          <div className="flex items-start gap-4 mb-6">
            
            {/* Miniatura circular del audio a la izquierda */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                {audio?.cover_url ? (
                  <img 
                    src={audio.cover_url} 
                    alt={audio.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Music className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Botón de play superpuesto */}
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" />
                )}
              </button>
            </div>

            {/* Información del audio */}
            <div className="flex-1 min-w-0">
              {/* Título de la canción en negrita */}
              <h2 className="text-lg font-bold text-gray-900 mb-1 truncate">
                {audio?.title || 'Título no disponible'}
              </h2>
              
              {/* Nombre del artista debajo */}
              <p className="text-sm text-gray-600 mb-2 truncate">
                {audio?.artist || 'Artista desconocido'}
              </p>
              
              {/* Indicador de tiempo + cantidad de reels */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(audio?.duration || 0)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{formatNumber(audio?.uses_count || 0)} reels</span>
                </div>
              </div>
              
              {/* Fila de botones pequeños */}
              <div className="flex items-center gap-3">
                {/* Botón pequeño iTunes "Añadir" */}
                <Button 
                  onClick={handleAddToItunes}
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                >
                  <Apple className="w-3 h-3" />
                  Añadir
                </Button>
                
                {/* Icono guardar (marcador) */}
                <button 
                  onClick={handleSave}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                
                {/* Icono compartir (avión papel) */}
                <button 
                  onClick={handleShare}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Botón principal verde centrado "Usar audio" */}
          <Button 
            onClick={handleUseThisSound}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl text-base transition-colors"
          >
            Usar audio
          </Button>
        </div>

        {/* Parte Inferior - Rejilla de videos */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Videos ({posts.length})
          </h3>
          
          {postsLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">Cargando videos...</p>
            </div>
          ) : posts.length > 0 ? (
            /* Rejilla de videos (3 columnas) con miniaturas rectangulares */
            <div className="grid grid-cols-3 gap-2">
              {posts.map((post, index) => (
                <div key={post.id} className="relative group cursor-pointer">
                  
                  {/* Miniatura rectangular */}
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {post.media_url ? (
                      post.media_url.includes('.mp4') || post.media_url.includes('.mov') ? (
                        /* Video thumbnail */
                        <video 
                          src={post.media_url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                      ) : (
                        /* Imagen thumbnail */
                        <img 
                          src={post.media_url} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      /* Placeholder */
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <MessageCircle className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500 px-2 leading-tight">
                            {post.title || 'Video'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay con número de votos en esquina inferior izquierda */}
                    <div className="absolute bottom-2 left-2">
                      <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-md flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          {formatNumber(
                            (post.options || []).reduce((total, option) => total + (option.votes || 0), 0) || 
                            Math.floor(Math.random() * 1000) + 50
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {/* Overlay hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Estado vacío */
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No hay videos aún</h4>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Sé el primero en usar este audio en tu video
              </p>
              <Button 
                onClick={handleUseThisSound}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Crear video
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AudioDetailPage;