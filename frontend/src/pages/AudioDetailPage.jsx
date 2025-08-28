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
        
        // Encontrar el usuario original (el más antiguo que usó este audio)
        if (data.posts && data.posts.length > 0) {
          const sortedByDate = [...data.posts].sort((a, b) => 
            new Date(a.created_at) - new Date(b.created_at)
          );
          const firstPost = sortedByDate[0];
          setOriginalUser(firstPost.user?.display_name || firstPost.user?.username || 'Usuario original');
        }
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
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Encabezado superior (altura ~10% de pantalla) */}
      <div className="h-[10vh] bg-gradient-to-r from-green-100 via-green-50 to-yellow-50 flex items-center justify-between px-4">
        {/* Flecha izquierda (←) esquina superior izquierda */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="text-gray-900 hover:bg-white/50 p-3"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        {/* Flecha derecha (→) esquina superior derecha */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleShare}
          className="text-gray-900 hover:bg-white/50 p-3"
        >
          <Share2 className="w-6 h-6" />
        </Button>
      </div>

      {/* Sección del audio (altura ~15% de pantalla) */}
      <div className="h-[15vh] flex items-center px-4 py-2">
        {/* Miniatura cuadrada del álbum: lado izquierdo, ~12% del ancho */}
        <div className="w-[12vw] h-[12vw] max-w-16 max-h-16 min-w-12 min-h-12 flex-shrink-0 relative">
          <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
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
            className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" />
            )}
          </button>
        </div>

        {/* Título y artista: ocupa ~70% del ancho restante */}
        <div className="flex-1 ml-4 flex flex-col justify-center min-w-0">
          {/* Título: centrado-derecha, texto grande y bold */}
          <h2 className="text-xl font-bold text-gray-900 mb-1 truncate">
            {audio?.title || 'Título no disponible'}
          </h2>
          
          {/* Avatar circular + nombre del artista */}
          <div className="flex items-center gap-2">
            {/* Avatar circular pequeño (~5% ancho) */}
            <div className="w-[5vw] h-[5vw] max-w-6 max-h-6 min-w-4 min-h-4 rounded-full bg-gray-300 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {(audio?.artist || 'A')[0].toUpperCase()}
              </div>
            </div>
            
            {/* Nombre del artista */}
            <span className="text-base text-gray-600 truncate">
              {audio?.artist || 'Artista desconocido'}
            </span>
            
            {/* Checkmark azul (solo si es verificado) */}
            {audio?.is_verified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* "+número >" extremo derecho (solo si hay múltiples artistas) */}
        {audio?.artist && (audio.artist.includes(',') || audio.artist.includes('&') || audio.artist.includes('ft.') || audio.artist.includes('feat.')) && (
          <div className="flex-shrink-0 ml-2">
            <span className="text-gray-500 text-sm font-medium">+&nbsp;{">"}</span>
          </div>
        )}
      </div>

      {/* Barra de información del sonido (altura ~8% de pantalla) */}
      <div className="h-[8vh] flex items-center px-4 border-t border-gray-100">
        {/* Ícono play: extremo izquierdo, tamaño pequeño */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Play className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700 font-medium">
            {formatDuration(audio?.duration || 0)}
          </span>
        </div>
        
        {/* "Original sound by: (usuario)" centro-izquierda */}
        <div className="flex-1 ml-6">
          <p className="text-sm text-gray-500">
            Original sound by: <span className="font-medium text-gray-700">{originalUser || audio?.created_by || audio?.artist || 'Usuario original'}</span>
          </p>
        </div>
        
        {/* Número de personas que utilizaron ese sonido: extremo derecho */}
        <div className="flex-shrink-0 ml-4">
          <span className="text-sm text-gray-400">
            {formatNumber(audio?.uses_count || 0)} usuarios
          </span>
        </div>
      </div>

      {/* Botones de acción (altura ~10% de pantalla) */}
      <div className="h-[10vh] flex items-center justify-center px-4">
        <div className="flex w-full gap-[10%]">
          {/* Botón Add to music app - 45% del ancho */}
          <Button 
            onClick={handleAddToItunes}
            className="w-[45%] h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-lg flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add to music app
          </Button>
          
          {/* Botón Add to Favorites - 45% del ancho */}
          <Button 
            onClick={handleSave}
            className="w-[45%] h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-lg flex items-center justify-center gap-2 font-medium"
          >
            <Bookmark className="w-4 h-4" />
            Add to Favorites
          </Button>
        </div>
      </div>

      {/* Cuadrícula 3x3 (altura ~45% de pantalla) */}
      <div className="h-[45vh] px-1">
        {postsLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">Cargando contenido...</p>
            </div>
          </div>
        ) : posts.length > 0 ? (
          /* Grid 3x3 con celdas cuadradas uniformes y separación mínima (~2px) */
          <div className="grid grid-cols-3 gap-0.5 h-full">
            {posts.slice(0, 9).map((post, index) => {
              // Determinar si este es el post original (el más antiguo)
              const sortedByDate = [...posts].sort((a, b) => 
                new Date(a.created_at) - new Date(b.created_at)
              );
              const isOriginal = sortedByDate.length > 0 && post.id === sortedByDate[0].id;
              
              return (
                <div key={post.id} className="relative group cursor-pointer bg-gray-100">
                  {/* Celda cuadrada (~33% del ancho disponible) */}
                  <div className="aspect-square w-full h-full bg-gray-200">
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
                        <MessageCircle className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Etiqueta "Original" azul: esquina superior izquierda, ~20% del ancho de celda */}
                    {isOriginal && (
                      <div className="absolute top-1 left-1">
                        <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-medium leading-tight">
                          Original
                        </span>
                      </div>
                    )}
                    
                    {/* Overlay hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200"></div>
                  </div>
                </div>
              );
            })}
            
            {/* Llenar celdas vacías si hay menos de 9 posts */}
            {Array.from({ length: Math.max(0, 9 - posts.length) }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square bg-gray-50 flex items-center justify-center">
                <div className="text-gray-300">
                  <Plus className="w-8 h-8" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Estado vacío */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No hay contenido aún</h4>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Sé el primero en usar este audio en tu contenido
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Botones inferiores (altura ~12% de pantalla) */}
      <div className="h-[12vh] flex items-center justify-center px-4">
        {/* Botón central "Use sound": ~40% del ancho, fondo verde, esquinas muy redondeadas */}
        <Button 
          onClick={handleUseThisSound}
          className="w-[40%] h-14 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-2xl text-lg transition-colors"
        >
          Use sound
        </Button>
      </div>
    </div>
  );
};

export default AudioDetailPage;