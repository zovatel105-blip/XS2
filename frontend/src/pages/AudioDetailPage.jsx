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
  const [originalUser, setOriginalUser] = useState(null);

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
      <div className="min-h-screen bg-white">
        {/* Header con degradado verde */}
        <div className="bg-gradient-to-b from-green-100 to-green-50 border-b border-green-200">
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
              className="text-gray-900 hover:bg-white/50 p-2"
            >
              <Share2 className="w-6 h-6" />
            </Button>
          </div>
        </div>
        <div className="px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                <Music className="w-6 h-6 text-green-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
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
      <div className="min-h-screen bg-white">
        {/* Header con degradado verde */}
        <div className="bg-gradient-to-b from-green-100 to-green-50 border-b border-green-200">
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
              className="text-gray-900 hover:bg-white/50 p-2"
            >
              <Share2 className="w-6 h-6" />
            </Button>
          </div>
        </div>
        <div className="px-4 py-8">
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
              <Button onClick={() => navigate('/feed')} className="bg-green-600 hover:bg-green-700">
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
            
            {/* Miniatura cuadrada del audio a la izquierda */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {audio?.cover_url ? (
                  <img 
                    src={audio.cover_url} 
                    alt={audio.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Music className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Botón de play superpuesto */}
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-0.5" />
                )}
              </button>
            </div>

            {/* Información del audio */}
            <div className="flex-1 min-w-0">
              {/* Título de la canción en negrita */}
              <h2 className="text-xl font-bold text-gray-900 mb-1 truncate">
                {audio?.title || 'Título no disponible'}
              </h2>
              
              {/* Nombre del artista debajo con indicador de más artistas */}
              <div className="flex items-center gap-2 mb-2">
                <p className="text-base text-gray-600 truncate">
                  {audio?.artist || 'Artista desconocido'}
                </p>
                {audio?.artist && audio?.artist.includes(',') && (
                  <span className="text-gray-500 text-sm">+&nbsp;{">"}</span>
                )}
              </div>
              
              {/* Duración del audio */}
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(audio?.duration || 0)}</span>
              </div>
              
              {/* Original sound by - el usuario que subió originalmente el audio */}
              <p className="text-sm text-gray-600 mb-2">
                Original sound by: {audio?.original_user || audio?.created_by || 'Usuario original'}
              </p>
              
              {/* Cantidad de publicaciones */}
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                <Users className="w-4 h-4" />
                <span>{formatNumber(audio?.uses_count || 0)} publicaciones</span>
              </div>
            </div>
          </div>

          {/* Botones de acción (fila de 2) */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Botón Add to music app */}
            <Button 
              onClick={handleAddToItunes}
              variant="outline"
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 py-3"
            >
              <Plus className="w-4 h-4" />
              Add to music app
            </Button>
            
            {/* Botón Add to Favorites */}
            <Button 
              onClick={handleSave}
              variant="outline"
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 py-3"
            >
              <Bookmark className="w-4 h-4" />
              Add to Favorites
            </Button>
          </div>
        </div>

        {/* Sección de miniaturas (rejilla 3 columnas) */}
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
            /* Rejilla de videos (3 columnas) con miniaturas verticales */
            <div className="grid grid-cols-3 gap-2 mb-6">
              {posts.map((post, index) => (
                <div key={post.id} className="relative group cursor-pointer">
                  
                  {/* Miniatura vertical */}
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
                    
                    {/* Etiqueta "Original" en esquina superior izquierda (algunos videos) */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
                          Original
                        </span>
                      </div>
                    )}
                    
                    {/* Overlay con número de votos en esquina inferior derecha */}
                    <div className="absolute bottom-2 right-2">
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
            <div className="text-center py-16 mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No hay videos aún</h4>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Sé el primero en usar este audio en tu video
              </p>
            </div>
          )}
        </div>

        {/* Barra inferior con botón principal */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 pb-safe">
          <div className="max-w-md mx-auto">
            {/* Solo botón Use sound (verde fuerte) */}
            <Button 
              onClick={handleUseThisSound}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 transition-colors flex items-center justify-center gap-2"
            >
              Use sound
            </Button>
          </div>
        </div>

        {/* Espaciador para la barra inferior fija */}
        <div className="h-20"></div>

      </div>
    </div>
  );
};

export default AudioDetailPage;