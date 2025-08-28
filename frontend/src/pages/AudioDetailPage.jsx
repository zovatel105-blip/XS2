import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Music, Users, Clock, Calendar, Volume2, Share2, Heart, 
  MessageCircle, MoreVertical, Plus, TrendingUp, Download, Repeat, Shuffle,
  BarChart3, Star, Eye, Headphones, Radio, Disc3, Send, Apple
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useTranslation } from '../hooks/useTranslation';
import { useResponsiveLayout, useDynamicClasses } from '../hooks/useResponsiveLayout';
import audioManager from '../services/AudioManager';
import { Button } from '../components/ui/button';
import PollCard from '../components/PollCard';
import PollModal from '../components/PollModal';
import AudioWaveform from '../components/AudioWaveform';
import TikTokScrollView from '../components/TikTokScrollView';

const AudioDetailPage = () => {
  const { audioId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, formatNumber, formatDuration, formatDate } = useTranslation();
  const layout = useResponsiveLayout();
  const classes = useDynamicClasses(layout);
  
  const [audio, setAudio] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [originalUser, setOriginalUser] = useState(null);
  
  // Infinite scroll states
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  
  // Poll modal states
  const [showPollModal, setShowPollModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);

  // Remove old hardcoded waveform generation
  // Generate mock waveform data - REMOVED (now using real AudioWaveform component)

  useEffect(() => {
    fetchAudioDetails();
    fetchPostsUsingAudio(0, false); // Cargar posts iniciales
  }, [audioId]);

  // Check favorites and determine original user after audio is loaded
  useEffect(() => {
    console.log('🔄 useEffect triggered - audio y posts cambiaron');
    console.log('🔄 Audio exists:', !!audio);
    console.log('🔄 Posts length:', posts?.length || 0);
    console.log('🔄 Posts loading:', postsLoading);
    
    if (audio) {
      checkIfFavorited();
      
      // Solo determinar usuario original si no estamos cargando posts
      if (!postsLoading) {
        console.log('✅ Condiciones cumplidas - determinando usuario original');
        determineOriginalUser();
      } else {
        console.log('⏳ Posts aún cargando - esperando...');
      }
    }
  }, [audio, posts, postsLoading]); // Agregamos postsLoading a las dependencias

  const determineOriginalUser = () => {
    console.log('🔍 === DETERMINANDO USUARIO ORIGINAL ===');
    console.log('🔍 Audio título:', audio?.title);
    console.log('🔍 Posts disponibles:', posts.length);
    console.log('🔍 Posts loading:', postsLoading);
    
    // PRIORIDAD 1: Usuario que hizo la primera publicación con este audio
    if (posts && posts.length > 0) {
      console.log(`📊 Encontrados ${posts.length} posts usando este audio`);
      console.log('📊 Posts completos:', posts);
      
      // Ordenar por fecha de creación (más antiguo primero)
      const sortedByDate = [...posts].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
      
      console.log('📅 Posts ordenados por fecha:', sortedByDate.map(p => ({
        id: p.id,
        title: p.title,
        created_at: p.created_at,
        author: p.author,
        user: p.user
      })));
      
      const firstPost = sortedByDate[0];
      console.log('📅 PRIMERA PUBLICACIÓN identificada:', firstPost);
      
      // Obtener el nombre del usuario que hizo la primera publicación
      let originalUserName = null;
      
      // Intentar obtener información del usuario de múltiples fuentes
      if (firstPost?.author) {
        // Prioridad al objeto author
        originalUserName = firstPost.author.display_name || 
                          firstPost.author.username || 
                          null;
        console.log('✅ Usuario encontrado en AUTHOR:', originalUserName, firstPost.author);
      } 
      
      if (!originalUserName && firstPost?.user) {
        // Backup al objeto user
        originalUserName = firstPost.user.display_name || 
                          firstPost.user.username || 
                          null;
        console.log('✅ Usuario encontrado en USER:', originalUserName, firstPost.user);
      } 
      
      if (!originalUserName && firstPost?.created_by) {
        // Último intento con created_by string
        originalUserName = firstPost.created_by;
        console.log('✅ Usuario encontrado en CREATED_BY:', originalUserName);
      }
      
      if (originalUserName) {
        setOriginalUser(originalUserName);
        console.log('🎯 ✅ USUARIO ORIGINAL DETERMINADO DESDE POSTS:', originalUserName);
        return;
      } else {
        console.log('❌ No se pudo extraer información de usuario de la primera publicación');
      }
    } else {
      console.log('⚠️ NO HAY POSTS o array está vacío');
    }
    
    // FALLBACK: Solo si NO hay ninguna publicación que use este audio
    console.log('⚠️ === USANDO FALLBACKS ===');
    console.log('🔍 Audio info para fallback:', {
      is_system_music: audio?.is_system_music,
      source: audio?.source,
      artist: audio?.artist,
      created_by: audio?.created_by
    });
    
    if (audio?.is_system_music || audio?.source === 'iTunes' || audio?.source === 'iTunes API') {
      // Para música del sistema sin posts, indicar que es música original
      const fallbackName = `${audio.artist} (música original)`;
      setOriginalUser(fallbackName);
      console.log('🎵 ⚠️ FALLBACK - música del sistema:', fallbackName);
    } else if (audio?.created_by) {
      // Para audio de usuario sin posts, usar quien lo subió
      setOriginalUser(audio.created_by);
      console.log('🎵 ⚠️ FALLBACK - creador del audio:', audio.created_by);
    } else {
      // Último fallback
      setOriginalUser(t('audioDetail.firstToUse'));
      console.log('🎵 ⚠️ FALLBACK final');
    }
    console.log('🔍 === FIN DETERMINACIÓN ===');
  };

  const loadMorePosts = async () => {
    if (!hasMorePosts || loadingMorePosts) return;
    
    console.log(`📚 Cargando más posts desde offset: ${currentOffset}`);
    await fetchPostsUsingAudio(currentOffset, true);
  };

  // Infinite scroll handler
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px before bottom
    
    if (scrolledToBottom && hasMorePosts && !loadingMorePosts && !postsLoading) {
      console.log('📚 Usuario llegó al final, cargando más posts...');
      loadMorePosts();
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
      setError(t('toast.errorLoading'));
      toast({
        title: t('toast.error'),
        description: t('toast.errorLoading'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPostsUsingAudio = async (offset = 0, append = false) => {
    try {
      if (offset === 0) {
        setPostsLoading(true);
      } else {
        setLoadingMorePosts(true);
      }
      
      const token = localStorage.getItem('authToken');
      
      console.log(`🔍 INICIANDO FETCH POSTS:`, {
        audioId,
        offset,
        append,
        token: token ? 'EXISTS' : 'MISSING'
      });
      
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/audio/${audioId}/posts?limit=12&offset=${offset}`;
      console.log(`📡 Llamando URL:`, url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📡 Response status:`, response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ RESPUESTA COMPLETA RECIBIDA:', {
          success: data.success,
          audio_id: data.audio_id,
          postsCount: data.posts?.length || 0,
          total: data.total,
          has_more: data.has_more,
          limit: data.limit,
          offset: data.offset,
          message: data.message
        });
        
        const postsData = data.posts || [];
        const total = data.total || 0;
        const hasMore = data.has_more || false;
        
        console.log('📊 POSTS RECIBIDOS:', postsData.map(p => ({
          id: p.id,
          title: p.title,
          author: p.author?.username || 'N/A',
          options_count: p.options?.length || 0,
          created_at: p.created_at,
          media_url: p.media_url || 'NO_MEDIA'
        })));
        
        if (append) {
          setPosts(prevPosts => {
            const newPosts = [...prevPosts, ...postsData];
            console.log(`📊 POSTS AGREGADOS - Antes: ${prevPosts.length}, Agregados: ${postsData.length}, Total: ${newPosts.length}`);
            return newPosts;
          });
        } else {
          setPosts(postsData);
          console.log(`📊 POSTS INICIALES ESTABLECIDOS: ${postsData.length}`);
        }
        
        setTotalPosts(total);
        setHasMorePosts(hasMore);
        setCurrentOffset(offset + postsData.length);
        
        console.log(`📊 ESTADO ACTUALIZADO:`, {
          totalPosts: total,
          hasMorePosts: hasMore,
          newOffset: offset + postsData.length
        });
        
      } else {
        console.error('❌ ERROR EN RESPONSE:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('❌ Error details:', errorData);
        
        if (offset === 0) {
          setPosts([]);
          setTotalPosts(0);
          setHasMorePosts(false);
        }
      }
    } catch (error) {
      console.error('❌ ERROR EN FETCH:', error);
      
      if (offset === 0) {
        setPosts([]);
        setTotalPosts(0);
        setHasMorePosts(false);
      }
    } finally {
      if (offset === 0) {
        setPostsLoading(false);
        console.log('🏁 POSTS LOADING TERMINADO');
      } else {
        setLoadingMorePosts(false);
        console.log('🏁 LOADING MORE POSTS TERMINADO');
      }
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
        title: t('toast.error'),
        description: t('toast.errorPlaying'),
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
      title: t('toast.audioSelected'),
      description: t('toast.audioSelectedDesc', { title: audio.title, artist: audio.artist })
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
          title: t('toast.sharedSuccess'),
          description: t('toast.sharedDesc')
        });
      } else {
        // Fallback to clipboard
        const textToCopy = `${shareText}\n${url}`;
        await navigator.clipboard.writeText(textToCopy);
        
        toast({
          title: t('toast.linkCopied'),
          description: t('toast.linkCopiedDesc')
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      
      // Final fallback - just copy URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: t('toast.linkCopied'),
          description: t('toast.linkCopiedDesc')
        });
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        toast({
          title: t('toast.error'),
          description: t('toast.errorSharing'),
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
            title: t('toast.removedFromFavorites'),
            description: t('toast.removedFromFavoritesDesc', { title: audio.title })
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
            title: t('toast.addedToFavorites'),
            description: t('toast.addedToFavoritesDesc', { title: audio.title })
          });
        } else if (response.status === 400) {
          // Already in favorites
          setIsLiked(true);
          toast({
            title: t('toast.alreadyInFavorites'),
            description: t('toast.alreadyInFavoritesDesc', { title: audio.title })
          });
        } else {
          throw new Error('Error adding to favorites');
        }
      }
    } catch (error) {
      console.error('Error managing favorites:', error);
      toast({
        title: t('toast.error'),
        description: t('toast.errorFavorites'),
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
        title: t('toast.openingAppleMusic'),
        description: t('toast.openingAppleMusicDesc', { title: audio.title, artist: audio.artist })
      });
    } else {
      toast({
        title: t('toast.customAudio'),
        description: t('toast.customAudioDesc'),
        variant: "destructive"
      });
    }
  };

  // Poll modal handlers
  const handlePollClick = (post) => {
    console.log('🎯 Opening poll modal for:', post);
    setSelectedPoll(post);
    setShowPollModal(true);
  };

  const handlePollVote = (pollId, optionId) => {
    console.log('🗳️ Vote:', pollId, optionId);
    // TODO: Implement voting functionality
  };

  const handlePollLike = (pollId) => {
    console.log('❤️ Like poll:', pollId);
    // TODO: Implement like functionality
  };

  const handlePollShare = (pollId) => {
    console.log('📤 Share poll:', pollId);
    // TODO: Implement share functionality
  };

  // Utility functions now handled by i18n system

  if (loading) {
    return (
      <div className={classes.container}>
        {/* Contenedor del header con degradado difuminado */}
        <div className="relative">
          {/* Fondo degradado que se extiende desde header hacia abajo */}
          <div className={`${classes.gradientBg} h-[17.5vh]`}></div>
          
          {/* Encabezado con degradado verde/beige */}
          <div className={classes.header}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="text-gray-900 hover:bg-white/50 p-3"
            >
              <ArrowLeft className={`${layout.iconSize} stroke-2`} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-900 hover:bg-white/50 p-3"
            >
              <Share2 className={`${layout.iconSize} stroke-2`} />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              <Music className="w-6 h-6 text-green-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-600 text-lg font-medium">{t('audioDetail.loading')}</p>
            <p className="text-gray-500 text-sm mt-2">{t('audioDetail.audioId', { id: audioId })}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !audio) {
    return (
      <div className={classes.container}>
        {/* Contenedor del header con degradado difuminado */}
        <div className="relative">
          {/* Fondo degradado que se extiende desde header hacia abajo */}
          <div className={`${classes.gradientBg} h-[17.5vh]`}></div>
          
          {/* Encabezado con degradado verde/beige */}
          <div className={classes.header}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="text-gray-900 hover:bg-white/50 p-3"
            >
              <ArrowLeft className={`${layout.iconSize} stroke-2`} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-900 hover:bg-white/50 p-3"
            >
              <Share2 className={`${layout.iconSize} stroke-2`} />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 max-w-md">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-medium mb-2">{t('audioDetail.notFound')}</p>
            <p className="text-gray-500 text-sm mb-4">{t('audioDetail.audioId', { id: audioId })}</p>
            {error && (
              <p className="text-red-600 text-sm mb-4 bg-red-50 px-4 py-2 rounded-lg inline-block">
                {error}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/feed')} className="bg-green-600 hover:bg-green-700">
                {t('audioDetail.backToFeed')}
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)} className="border-gray-300 hover:bg-gray-50">
                {t('audioDetail.previousPage')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      {/* Contenedor del header y sección audio con degradado difuminado */}
      <div className="relative">
        {/* Fondo degradado que se extiende desde header hasta mitad del audio */}
        <div className={`${classes.gradientBg} h-[17.5vh]`}></div>
        
        {/* Encabezado superior */}
        <div className={classes.header}>
          {/* Flecha izquierda (←) esquina superior izquierda */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-gray-900 hover:bg-white/50 p-3"
          >
            <ArrowLeft className={`${layout.iconSize} stroke-2`} />
          </Button>
          
          {/* Flecha derecha (→) esquina superior derecha */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="text-gray-900 hover:bg-white/50 p-3"
          >
            <Share2 className={`${layout.iconSize} stroke-2`} />
          </Button>
        </div>

        {/* Sección del audio */}
        <div className={classes.audioSection}>
          {/* Miniatura cuadrada del álbum: lado izquierdo */}
          <div className={classes.cover}>
            <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              {audio?.cover_url ? (
                <img 
                  src={audio.cover_url} 
                  alt={audio.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Music className={`${layout.iconSize} text-gray-400`} />
                </div>
              )}
            </div>
            
            {/* Botón de play superpuesto */}
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            >
              {isPlaying ? (
                <Pause className={`${layout.playIconSize} text-white`} />
              ) : (
                <Play className={`${layout.playIconSize} text-white ml-0.5`} />
              )}
            </button>
          </div>

          {/* Información del audio: ocupa el ancho restante */}
          <div className="flex-1 ml-4 flex flex-col justify-center min-w-0">
            {/* Título dinámico */}
            <h2 className={classes.title}>
              {t('audioDetail.contains')} {audio?.title || 'Título no disponible'}
            </h2>
            
            {/* Fila del artista con avatar, nombre y checkmark */}
            <div className="flex items-center gap-2">
              {/* Avatar circular pequeño */}
              <div className={`${layout.avatarSize} rounded-full bg-gray-300 flex-shrink-0 overflow-hidden`}>
                {audio?.artist ? (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {audio.artist[0].toUpperCase()}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-400"></div>
                )}
              </div>
              
              {/* Nombre del artista en mayúsculas */}
              <span className={`${classes.artist} text-gray-900`}>
                {(audio?.artist || 'Artista desconocido').toUpperCase()}
              </span>
              
              {/* Checkmark azul verificado */}
              <div className={`${layout.iconSize} bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0`}>
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de información del sonido */}
      <div className={classes.infoBar}>
        {/* Ícono play: extremo izquierdo, tamaño pequeño */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Play className={`${layout.iconSize} text-gray-600`} />
          <span className={`${classes.infoText} text-gray-700 font-medium`}>
            {formatDuration(audio?.duration || 0)}
          </span>
        </div>
        
        {/* "Original sound by: (usuario)" centro-izquierda */}
        <div className="flex-1 ml-6">
          <p className={classes.infoText}>
            <span className="text-gray-500">{t('audioDetail.originalSoundBy')} </span>
            <span className="font-medium text-gray-700">
              {postsLoading ? t('audioDetail.searchingFirst') : (originalUser || t('audioDetail.determining'))}
            </span>
          </p>
        </div>
        
        {/* Número de personas que utilizaron ese sonido: extremo derecho */}
        <div className="flex-shrink-0 ml-4">
          <span className={`${classes.infoText} text-gray-400`}>
            {totalPosts > 0 ? 
              t('audioDetail.users', { count: formatNumber(totalPosts) }) : 
              t('audioDetail.users', { count: formatNumber(audio?.uses_count || 0) })
            }
          </span>
        </div>
      </div>

      {/* Botones de acción */}
      <div className={classes.actionButtons}>
        <div className="flex w-full gap-[10%]">
          {/* Botón Add to music app - 45% del ancho */}
          <Button 
            onClick={handleAddToItunes}
            className={`${classes.actionButton} bg-gray-100 hover:bg-gray-200 text-gray-700`}
          >
            <Apple className={layout.iconSize} />
            {audio?.source === 'iTunes' || audio?.is_system_music ? 
              t('buttons.openAppleMusic') : 
              t('buttons.notAvailable')
            }
          </Button>
          
          {/* Botón Add to Favorites - 45% del ancho */}
          <Button 
            onClick={handleLike}
            className={`${classes.actionButton} transition-colors ${
              isLiked 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Heart className={`${layout.iconSize} ${isLiked ? 'fill-current' : ''}`} />
            {isLiked ? t('buttons.inFavorites') : t('buttons.addToFavorites')}
          </Button>
        </div>
      </div>

      {/* Feed estilo TikTok de publicaciones que usan este audio */}
      <div className={classes.grid}>
        {postsLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className={`${classes.infoText} text-gray-500`}>{t('audioDetail.loadingContent')}</p>
            </div>
          </div>
        ) : posts && posts.length > 0 ? (
          /* Vista TikTok de publicaciones */
          <TikTokScrollView
            polls={posts}
            onVote={handlePollVote}
            onLike={handlePollLike}
            onShare={handlePollShare}
            onComment={handlePollComment}
            onSave={handlePollSave}
            showLogo={false}
            className="h-full"
          />
        ) : (
          /* Estado vacío */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className={`${layout.iconSize} text-gray-400`} />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">{t('audioDetail.noContent')}</h4>
              <p className={`${classes.infoText} text-gray-500 max-w-sm mx-auto`}>
                {t('audioDetail.beFirst')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Botón inferior */}
      <div className={classes.bottomButton}>
        {/* Botón central "Use sound" */}
        <Button 
          onClick={handleUseThisSound}
          className={classes.mainButton}
        >
          {t('buttons.useSound')}
        </Button>
      </div>

      {/* Poll Modal */}
      <PollModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        poll={selectedPoll}
        onVote={handlePollVote}
        onLike={handlePollLike}
        onShare={handlePollShare}
      />
    </div>
  );
};

export default AudioDetailPage;