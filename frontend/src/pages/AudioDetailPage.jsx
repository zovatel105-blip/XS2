import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Music, Users, Clock, Calendar, Volume2, Share2, Heart, 
  MessageCircle, MoreVertical, Plus, TrendingUp, Download, Repeat, Shuffle,
  BarChart3, AudioWaveform, Star, Eye, Headphones, Radio, Disc3, Send, Apple
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

  // Check favorites and determine original user after audio is loaded
  useEffect(() => {
    if (audio) {
      checkIfFavorited();
      
      // Determinar usuario original de forma más simple y clara
      determineOriginalUser();
    }
  }, [audio, posts]); // Depende de audio Y posts

  const determineOriginalUser = () => {
    console.log('🔍 Determinando usuario original del audio:', audio?.title);
    
    // PRIORIDAD 1: Usuario que hizo la primera publicación con este audio
    if (posts && posts.length > 0) {
      console.log(`📊 Encontrados ${posts.length} posts usando este audio`);
      
      // Ordenar por fecha de creación (más antiguo primero)
      const sortedByDate = [...posts].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
      const firstPost = sortedByDate[0];
      
      console.log('📅 Primera publicación con este audio:', {
        date: firstPost?.created_at,
        user: firstPost?.user,
        author: firstPost?.author,
        title: firstPost?.title
      });
      
      // Obtener el nombre del usuario que hizo la primera publicación
      let originalUserName = 'Usuario desconocido';
      
      // Intentar obtener información del usuario de múltiples fuentes
      if (firstPost?.author) {
        // Prioridad al objeto author
        originalUserName = firstPost.author.display_name || 
                          firstPost.author.username || 
                          'Usuario desconocido';
        console.log('✅ Usuario encontrado en author:', originalUserName);
      } else if (firstPost?.user) {
        // Backup al objeto user
        originalUserName = firstPost.user.display_name || 
                          firstPost.user.username || 
                          'Usuario desconocido';
        console.log('✅ Usuario encontrado en user:', originalUserName);
      } else if (firstPost?.created_by) {
        // Último intento con created_by string
        originalUserName = firstPost.created_by;
        console.log('✅ Usuario encontrado en created_by:', originalUserName);
      }
      
      setOriginalUser(originalUserName);
      console.log('🎯 Usuario original del sonido determinado:', originalUserName);
      return;
    }
    
    // FALLBACK: Solo si NO hay ninguna publicación que use este audio
    console.log('⚠️ No hay publicaciones usando este audio, usando fallback');
    
    if (audio?.is_system_music || audio?.source === 'iTunes' || audio?.source === 'iTunes API') {
      // Para música del sistema sin posts, indicar que es música original
      const fallbackName = `${audio.artist} (música original)`;
      setOriginalUser(fallbackName);
      console.log('🎵 Fallback - música del sistema:', fallbackName);
    } else if (audio?.created_by) {
      // Para audio de usuario sin posts, usar quien lo subió
      setOriginalUser(audio.created_by);
      console.log('🎵 Fallback - creador del audio:', audio.created_by);
    } else {
      // Último fallback
      setOriginalUser('Sé el primero en usar este sonido');
      console.log('🎵 Fallback final');
    }
  };

  const checkIfFavorited = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token || !audio) return;
      
      const audioType = audio.is_system_music ? 'system' : 'user';
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/audio/favorites/${audio.id}/check?audio_type=${audioType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.is_favorite);
      }
    } catch (error) {
      console.error('Error checking if audio is favorited:', error);
    }
  };

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
      
      console.log('🔍 Buscando posts que usan el audio:', audioId);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/audio/${audioId}/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Respuesta completa de posts recibida:', JSON.stringify(data, null, 2));
        
        const postsData = data.posts || [];
        setPosts(postsData);
        console.log(`📊 Posts procesados y guardados:`, postsData.length);
        
        // Log detallado de cada post
        postsData.forEach((post, index) => {
          console.log(`📝 Post ${index + 1}:`, {
            id: post.id,
            title: post.title,
            created_at: post.created_at,
            author: post.author,
            user: post.user,
            hasAuthor: !!post.author,
            hasUser: !!post.user
          });
        });
        
      } else {
        console.error('❌ Error fetching posts:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error details:', errorData);
        
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching posts using audio:', error);
      setPosts([]);
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

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const audioType = audio.is_system_music ? 'system' : 'user';
      
      if (isLiked) {
        // Remove from favorites
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/audio/favorites/${audio.id}?audio_type=${audioType}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsLiked(false);
          toast({
            title: "Quitado de favoritos",
            description: `"${audio.title}" eliminado de tus favoritos`
          });
        } else {
          throw new Error('Error removing from favorites');
        }
      } else {
        // Add to favorites
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/audio/favorites`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            audio_id: audio.id,
            audio_type: audioType
          })
        });

        if (response.ok) {
          setIsLiked(true);
          toast({
            title: "Agregado a favoritos",
            description: `"${audio.title}" agregado a tus favoritos`
          });
        } else if (response.status === 400) {
          // Already in favorites
          setIsLiked(true);
          toast({
            title: "Ya en favoritos",
            description: `"${audio.title}" ya está en tus favoritos`
          });
        } else {
          throw new Error('Error adding to favorites');
        }
      }
    } catch (error) {
      console.error('Error managing favorites:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar favoritos",
        variant: "destructive"
      });
    }
  };

  const handleAddToItunes = () => {
    if (audio?.source === 'iTunes' || audio?.is_system_music) {
      // Try to open in Apple Music/iTunes if available
      const searchQuery = `${audio.artist} ${audio.title}`.replace(/\s+/g, '+');
      const appleMusicUrl = `https://music.apple.com/search?term=${searchQuery}`;
      
      if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        // Try Apple Music app on iOS
        window.location.href = `music://music.apple.com/search?term=${searchQuery}`;
        
        // Fallback to web version after a delay
        setTimeout(() => {
          window.open(appleMusicUrl, '_blank');
        }, 1000);
      } else {
        // Open Apple Music web on other devices
        window.open(appleMusicUrl, '_blank');
      }
      
      toast({
        title: "Abriendo Apple Music",
        description: `Buscando "${audio.title}" de ${audio.artist}`
      });
    } else {
      toast({
        title: "Audio personalizado",
        description: "Esta es música subida por usuarios, no disponible en tiendas de música",
        variant: "destructive"
      });
    }
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
      <div className="min-h-screen bg-white flex flex-col">
        {/* Contenedor del header con degradado difuminado */}
        <div className="relative">
          {/* Fondo degradado que se extiende desde header hacia abajo */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-100 via-green-50 to-transparent h-[17.5vh]"></div>
          
          {/* Encabezado con degradado verde/beige */}
          <div className="relative h-[10vh] flex items-center justify-between px-4 z-10">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="text-gray-900 hover:bg-white/50 p-3"
            >
              <ArrowLeft className="w-7 h-7 stroke-2" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-900 hover:bg-white/50 p-3"
            >
              <Share2 className="w-7 h-7 stroke-2" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
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
    );
  }

  if (error || !audio) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Contenedor del header con degradado difuminado */}
        <div className="relative">
          {/* Fondo degradado que se extiende desde header hacia abajo */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-100 via-green-50 to-transparent h-[17.5vh]"></div>
          
          {/* Encabezado con degradado verde/beige */}
          <div className="relative h-[10vh] flex items-center justify-between px-4 z-10">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="text-gray-900 hover:bg-white/50 p-3"
            >
              <ArrowLeft className="w-7 h-7 stroke-2" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-900 hover:bg-white/50 p-3"
            >
              <Share2 className="w-7 h-7 stroke-2" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 max-w-md">
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
      
      {/* Contenedor del header y sección audio con degradado difuminado */}
      <div className="relative">
        {/* Fondo degradado que se extiende desde header hasta mitad del audio */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-100 via-green-50 to-transparent h-[17.5vh]"></div>
        
        {/* Encabezado superior (altura ~10% de pantalla) */}
        <div className="relative h-[10vh] flex items-center justify-between px-4 z-10">
          {/* Flecha izquierda (←) esquina superior izquierda */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-gray-900 hover:bg-white/50 p-3"
          >
            <ArrowLeft className="w-7 h-7 stroke-2" />
          </Button>
          
          {/* Flecha derecha (→) esquina superior derecha */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="text-gray-900 hover:bg-white/50 p-3"
          >
            <Share2 className="w-7 h-7 stroke-2" />
          </Button>
        </div>

        {/* Sección del audio (altura ~15% de pantalla) - sin línea separadora */}
        <div className="relative h-[15vh] flex items-center px-4 py-2 z-10">
        {/* Miniatura cuadrada del álbum: lado izquierdo, más grande */}
        <div className="w-[18vw] h-[18vw] max-w-28 max-h-28 min-w-20 min-h-20 flex-shrink-0 relative">
          <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
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
            className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>
        </div>

        {/* Información del audio: ocupa el ancho restante */}
        <div className="flex-1 ml-4 flex flex-col justify-center min-w-0">
          {/* Título: "Contains: [nombre del audio]" - texto grande y bold */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2 truncate">
            Contains: {audio?.title || 'Título no disponible'}
          </h2>
          
          {/* Fila del artista con avatar, nombre y checkmark */}
          <div className="flex items-center gap-2">
            {/* Avatar circular pequeño */}
            <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
              {audio?.artist ? (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {audio.artist[0].toUpperCase()}
                </div>
              ) : (
                <div className="w-full h-full bg-gray-400"></div>
              )}
            </div>
            
            {/* Nombre del artista en mayúsculas - aún más pequeño */}
            <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              {(audio?.artist || 'Artista desconocido').toUpperCase()}
            </span>
            
            {/* Checkmark azul verificado */}
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Barra de información del sonido (altura ~8% de pantalla) */}
      <div className="h-[8vh] flex items-center px-4">
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
            Original sound by: <span className="font-medium text-gray-700">
              {postsLoading ? 'Buscando primera publicación...' : (originalUser || 'Determinando usuario...')}
            </span>
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
            <Apple className="w-4 h-4" />
            {audio?.source === 'iTunes' || audio?.is_system_music ? 'Open in Apple Music' : 'No disponible'}
          </Button>
          
          {/* Botón Add to Favorites - 45% del ancho */}
          <Button 
            onClick={handleLike}
            className={`w-[45%] h-12 border-0 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
              isLiked 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            {isLiked ? 'En Favoritos' : 'Add to Favorites'}
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
          <>
            {/* Debug logging */}
            {(() => {
              console.log('📊 Renderizando grid con', posts.length, 'posts:', posts.map(p => ({
                id: p.id, 
                title: p.title, 
                user: p.user || p.author,
                created_at: p.created_at
              })));
              return null;
            })()}
            <div className="grid grid-cols-3 gap-0.5 h-full">
            {posts.slice(0, 9).map((post, index) => {
              // Determinar si este es el post original (el más antiguo)
              const sortedByDate = [...posts].sort((a, b) => 
                new Date(a.created_at) - new Date(b.created_at)
              );
              const isOriginal = sortedByDate.length > 0 && post.id === sortedByDate[0].id;
              
              return (
                <div 
                  key={post.id} 
                  className="relative group cursor-pointer bg-gray-100"
                  onClick={() => navigate(`/poll/${post.id}`)}
                >
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
          </>
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