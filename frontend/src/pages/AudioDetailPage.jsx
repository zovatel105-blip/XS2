import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Music, Users, Clock, Calendar, Volume2, Share2, Heart, 
  MessageCircle, MoreVertical, Plus, TrendingUp, Download, Repeat, Shuffle,
  BarChart3, Star, Eye, Headphones, Radio, Disc3, Send, Apple, Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../hooks/use-toast';
import { useTranslation } from '../hooks/useTranslation';
import { useResponsiveLayout, useDynamicClasses } from '../hooks/useResponsiveLayout';
import { useTikTok } from '../contexts/TikTokContext';
import audioManager from '../services/AudioManager';
import pollService from '../services/pollService';
import { Button } from '../components/ui/button';
import PollCard from '../components/PollCard';
import PollModal from '../components/PollModal';
import CreatePollModal from '../components/CreatePollModal';
import AudioWaveform from '../components/AudioWaveform';
import TikTokScrollView from '../components/TikTokScrollView';
import TikTokProfileGrid from '../components/TikTokProfileGrid';



const AudioDetailPage = () => {
  const { audioId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, formatNumber, formatDuration, formatDate } = useTranslation();
  const layout = useResponsiveLayout();
  const classes = useDynamicClasses(layout);
  const { hideRightNavigationBar, showRightNavigationBar } = useTikTok();
  
  const [audio, setAudio] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [originalUser, setOriginalUser] = useState(null);
  const [dominantColor, setDominantColor] = useState('#10b981'); // Default green
  const [gradientColors, setGradientColors] = useState({
    primary: '#10b981',
    secondary: '#f59e0b'
  });
  
  // Infinite scroll states
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  
  // Poll modal states
  const [showPollModal, setShowPollModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  
  // Create poll modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [preSelectedAudio, setPreSelectedAudio] = useState(null);
  
  // TikTok view states
  const [showTikTokView, setShowTikTokView] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);

  // Function to extract dominant color and generate gradient colors from album cover
  const extractColorsFromCover = (imageUrl) => {
    return new Promise((resolve) => {
      if (!imageUrl) {
        resolve({
          dominant: '#10b981',
          gradients: { primary: '#10b981', secondary: '#f59e0b' }
        });
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          const colorMap = {};
          const allColors = [];
          
          // Sample every 4th pixel for performance
          for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Skip very light or very dark colors
            if (r + g + b < 50 || r + g + b > 650) continue;
            
            const color = `${r},${g},${b}`;
            colorMap[color] = (colorMap[color] || 0) + 1;
            allColors.push([r, g, b]);
          }
          
          // Find most frequent color (dominant)
          let maxCount = 0;
          let dominantRGB = [16, 185, 129]; // Default green RGB
          
          for (const [color, count] of Object.entries(colorMap)) {
            if (count > maxCount) {
              maxCount = count;
              dominantRGB = color.split(',').map(Number);
            }
          }
          
          // Generate gradient colors
          const [r, g, b] = dominantRGB;
          const dominantHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          
          // Create complementary/analogous colors for gradient
          const hsl = rgbToHsl(r, g, b);
          
          // Primary gradient color (slightly lighter/more saturated)
          const primaryHsl = [hsl[0], Math.min(100, hsl[1] + 20), Math.min(80, hsl[2] + 15)];
          const primaryRgb = hslToRgb(primaryHsl[0], primaryHsl[1], primaryHsl[2]);
          const primaryHex = `#${((1 << 24) + (primaryRgb[0] << 16) + (primaryRgb[1] << 8) + primaryRgb[2]).toString(16).slice(1)}`;
          
          // Secondary gradient color (complementary hue)
          const secondaryHsl = [(hsl[0] + 60) % 360, Math.max(30, hsl[1] - 10), Math.max(40, hsl[2] - 10)];
          const secondaryRgb = hslToRgb(secondaryHsl[0], secondaryHsl[1], secondaryHsl[2]);
          const secondaryHex = `#${((1 << 24) + (secondaryRgb[0] << 16) + (secondaryRgb[1] << 8) + secondaryRgb[2]).toString(16).slice(1)}`;
          
          resolve({
            dominant: dominantHex,
            gradients: {
              primary: primaryHex,
              secondary: secondaryHex
            }
          });
        } catch (error) {
          console.error('Error extracting colors:', error);
          resolve({
            dominant: '#10b981',
            gradients: { primary: '#10b981', secondary: '#f59e0b' }
          });
        }
      };
      
      img.onerror = () => resolve({
        dominant: '#10b981',
        gradients: { primary: '#10b981', secondary: '#f59e0b' }
      });
      img.src = imageUrl;
    });
  };

  // Helper functions for color conversion
  const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  };

  const hslToRgb = (h, s, l) => {
    h /= 360; s /= 100; l /= 100;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    if (s === 0) {
      return [l * 255, l * 255, l * 255];
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      return [
        Math.round(hue2rgb(p, q, h + 1/3) * 255),
        Math.round(hue2rgb(p, q, h) * 255),
        Math.round(hue2rgb(p, q, h - 1/3) * 255)
      ];
    }
  };

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
      
      // Extract colors from cover for dynamic theming
      if (audio.cover_url) {
        console.log('🎨 Extracting colors from:', audio.cover_url);
        extractColorsFromCover(audio.cover_url).then(colors => {
          console.log('🎨 Colors extracted:', colors);
          setDominantColor(colors.dominant);
          setGradientColors(colors.gradients);
        });
      }
      
      // Solo determinar usuario original si no estamos cargando posts
      if (!postsLoading) {
        console.log('✅ Condiciones cumplidas - determinando usuario original');
        determineOriginalUser();
      } else {
        console.log('⏳ Posts aún cargando - esperando...');
      }
    }
  }, [audio, posts, postsLoading]); // Agregamos postsLoading a las dependencias

  // 🎵 CLEANUP: Detener audio al desmontar componente
  useEffect(() => {
    return () => {
      console.log('🚪 AudioDetailPage unmounting - Stopping audio');
      import('../services/AudioManager').then(module => {
        module.default.stop().catch(console.error);
      });
    };
  }, []);

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
          media_url: p.media_url || 'NO_MEDIA',
          user_vote: p.user_vote || 'NO_VOTE',  // Log voting state
          user_liked: p.user_liked || false     // Log like state
        })));
        
        // Transform posts data to match frontend format (fixing snake_case to camelCase)
        const transformedPosts = postsData.map(post => ({
          ...post,
          userVote: post.user_vote,      // ✅ FIXED: Convert user_vote to userVote
          userLiked: post.user_liked,    // ✅ FIXED: Convert user_liked to userLiked
          totalVotes: post.total_votes,  // ✅ FIXED: Convert total_votes to totalVotes
          authorUser: post.author,       // ✅ Add authorUser for compatibility
          commentsCount: post.comments_count  // ✅ Add commentsCount for compatibility
        }));
        
        console.log('🔄 POSTS TRANSFORMADOS:', transformedPosts.map(p => ({
          id: p.id,
          title: p.title,
          userVote: p.userVote,   // Should now show actual vote
          userLiked: p.userLiked, // Should now show actual like status
          totalVotes: p.totalVotes
        })));
        
        if (append) {
          setPosts(prevPosts => {
            const newPosts = [...prevPosts, ...transformedPosts];  // ✅ FIXED: Use transformed data
            console.log(`📊 POSTS AGREGADOS - Antes: ${prevPosts.length}, Agregados: ${transformedPosts.length}, Total: ${newPosts.length}`);
            return newPosts;
          });
        } else {
          setPosts(transformedPosts);  // ✅ FIXED: Use transformed data
          console.log(`📊 POSTS INICIALES ESTABLECIDOS: ${transformedPosts.length}`);
        }
        
        setTotalPosts(total);
        setHasMorePosts(hasMore);
        setCurrentOffset(offset + transformedPosts.length);  // ✅ FIXED: Use transformed data length
        
        console.log(`📊 ESTADO ACTUALIZADO:`, {
          totalPosts: total,
          hasMorePosts: hasMore,
          newOffset: offset + transformedPosts.length  // ✅ FIXED: Use transformed data length
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
    console.log('🔥 BOTÓN USE SOUND PRESIONADO');
    console.log('🔥 Audio disponible:', !!audio);
    
    // Validar que tenemos el audio
    if (!audio) {
      console.error('❌ No hay audio disponible para usar');
      toast({
        title: "Error",
        description: "No se pudo cargar la información del audio",
        variant: "destructive"
      });
      return;
    }

    // Preparar el audio para el modal de creación
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
    
    console.log('🎵 Abriendo modal de creación con audio preseleccionado:', audioForCreation);
    
    // Abrir modal directamente con audio preseleccionado
    setPreSelectedAudio(audioForCreation);
    setShowCreateModal(true);
    
    toast({
      title: t('toast.audioSelected') || "Audio seleccionado",
      description: t('toast.audioSelectedDesc', { title: audio.title, artist: audio.artist }) || `${audio.title} - ${audio.artist} seleccionado para crear contenido`
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

  const handleCreatePoll = async (newPoll) => {
    try {
      // NOTE: El poll ya fue creado en CreatePollModal, aquí solo manejamos la UI
      console.log('✅ Nueva publicación creada:', newPoll);
      
      // Close modal
      setShowCreateModal(false);
      setPreSelectedAudio(null);
      
      // No mostramos toast aquí porque ya se muestra en CreatePollModal
      
      // Refresh posts to show new publication
      await fetchPostsUsingAudio(0, false);
      
    } catch (error) {
      console.error('Error handling new poll:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la publicación a la lista.",
        variant: "destructive"
      });
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
    console.log('🎬 AUDIODETAILPAGE DEBUG - Post clicked:', post);
    console.log('🎬 AUDIODETAILPAGE DEBUG - Current posts array length:', posts?.length);
    
    // Encontrar el índice del post seleccionado
    const index = posts.findIndex(p => p.id === post.id);
    console.log('🎬 AUDIODETAILPAGE DEBUG - Post index found:', index);
    
    // Verificar que los datos tienen la estructura correcta
    const validPosts = posts.filter(p => p && p.id && p.authorUser);
    if (validPosts.length !== posts.length) {
      console.warn('⚠️ AUDIODETAILPAGE WARNING - Some posts have invalid structure, filtering...');
      console.log('⚠️ Valid posts:', validPosts.length, 'Total posts:', posts.length);
    }
    
    setSelectedPostIndex(index >= 0 ? index : 0);
    
    // Ocultar la navegación lateral derecha cuando se abre desde AudioDetailPage
    hideRightNavigationBar();
    
    setShowTikTokView(true);
  };

  const handlePollVote = async (pollId, optionId) => {
    console.log('🗳️ Vote:', pollId, optionId);
    
    if (!localStorage.getItem('authToken')) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para votar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistic update
      setPosts(prev => prev.map(poll => {
        if (poll.id === pollId) {
          // Don't allow multiple votes
          if (poll.userVote) return poll;
          
          return {
            ...poll,
            userVote: optionId,
            options: poll.options.map(opt => ({
              ...opt,
              votes: opt.id === optionId ? opt.votes + 1 : opt.votes
            })),
            totalVotes: poll.totalVotes + 1
          };
        }
        return poll;
      }));

      // Send vote to backend using pollService
      await pollService.voteOnPoll(pollId, optionId);
      
      toast({
        title: "¡Voto registrado!",
        description: "Tu voto ha sido contabilizado exitosamente",
      });
      
      // Refresh poll data to get accurate counts
      const updatedPoll = await pollService.refreshPoll(pollId);
      if (updatedPoll) {
        setPosts(prev => prev.map(poll => 
          poll.id === pollId ? updatedPoll : poll
        ));
      }
      
    } catch (error) {
      console.error('Error voting:', error);
      
      // Revert optimistic update
      setPosts(prev => prev.map(poll => {
        if (poll.id === pollId && poll.userVote === optionId) {
          return {
            ...poll,
            userVote: null,
            options: poll.options.map(opt => ({
              ...opt,
              votes: opt.id === optionId ? opt.votes - 1 : opt.votes
            })),
            totalVotes: poll.totalVotes - 1
          };
        }
        return poll;
      }));
      
      toast({
        title: "Error al votar",
        description: error.message || "No se pudo registrar tu voto. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handlePollLike = async (pollId) => {
    console.log('❤️ Like poll:', pollId);
    
    if (!localStorage.getItem('authToken')) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para dar like",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistic update
      let wasLiked = false;
      setPosts(prev => prev.map(poll => {
        if (poll.id === pollId) {
          wasLiked = poll.userLiked;
          return {
            ...poll,
            userLiked: !poll.userLiked,
            likes: poll.userLiked ? poll.likes - 1 : poll.likes + 1
          };
        }
        return poll;
      }));

      // Send like to backend using pollService
      const result = await pollService.toggleLike(pollId);
      
      // Update with actual server response
      setPosts(prev => prev.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            userLiked: result.liked,
            likes: result.likes
          };
        }
        return poll;
      }));
      
      toast({
        title: result.liked ? "¡Te gusta!" : "Like removido",
        description: result.liked ? "Has dado like a esta publicación" : "Ya no te gusta esta publicación",
      });
      
    } catch (error) {
      console.error('Error liking poll:', error);
      
      // Revert optimistic update
      setPosts(prev => prev.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            userLiked: !poll.userLiked,
            likes: poll.userLiked ? poll.likes + 1 : poll.likes - 1
          };
        }
        return poll;
      }));
      
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar el like. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handlePollShare = async (pollId) => {
    console.log('📤 Share poll:', pollId);
    
    if (!localStorage.getItem('authToken')) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para compartir",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the poll to share
      const poll = posts.find(p => p.id === pollId);
      if (!poll) return;

      // Increment share count on backend using pollService
      const result = await pollService.sharePoll(pollId);
      
      // Update local state
      setPosts(prev => prev.map(p => {
        if (p.id === pollId) {
          return {
            ...p,
            shares: result.shares
          };
        }
        return p;
      }));
      
      // Try to use Web Share API first (better for mobile)
      if (navigator.share) {
        try {
          await navigator.share({
            title: poll.title || 'Vota en esta encuesta',
            text: 'Mira esta increíble votación',
            url: `${window.location.origin}/poll/${pollId}`,
          });
          toast({
            title: "¡Compartido exitosamente!",
            description: "La votación ha sido compartida",
          });
          return;
        } catch (err) {
          // If user cancels sharing, don't show error
          if (err.name !== 'AbortError') {
            console.log('Error sharing:', err);
            // If Web Share API fails, copy to clipboard
            await navigator.clipboard.writeText(`${window.location.origin}/poll/${pollId}`);
            toast({
              title: "Link copiado",
              description: "El enlace de la votación se ha copiado al portapapeles",
            });
          }
        }
      } else {
        // If Web Share API is not available, copy to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/poll/${pollId}`);
        toast({
          title: "Link copiado",
          description: "El enlace de la votación se ha copiado al portapapeles",
        });
      }
    } catch (error) {
      console.error('Error sharing poll:', error);
      toast({
        title: "Error al compartir",
        description: error.message || "No se pudo compartir la votación. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handlePollComment = (pollId) => {
    console.log('💬 Comment on poll:', pollId);
    // TODO: Implement comment functionality
  };

  const handlePollSave = (pollId) => {
    console.log('💾 Save poll:', pollId);
    // TODO: Implement save functionality
  };

  const handleExitTikTok = async () => {
    console.log('🚪 Exiting TikTok view - Stopping audio');
    
    // DETENER AUDIO antes de salir
    try {
      const audioManager = (await import('../services/AudioManager')).default;
      await audioManager.stop();
      console.log('✅ Audio stopped successfully on exit');
    } catch (error) {
      console.error('❌ Error stopping audio on exit:', error);
    }
    
    // Restaurar la navegación lateral derecha cuando se cierra
    showRightNavigationBar();
    
    setShowTikTokView(false);
  };

  // Utility functions now handled by i18n system



  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4">
          <button onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="w-6 h-6 text-black" />
          </button>
          <button className="p-2">
            <MoreVertical className="w-6 h-6 text-black" />
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
              <Music className="w-6 h-6 text-gray-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
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
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4">
          <button onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="w-6 h-6 text-black" />
          </button>
          <button className="p-2">
            <MoreVertical className="w-6 h-6 text-black" />
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center py-12 max-w-md">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-black text-lg font-medium mb-2">{t('audioDetail.notFound')}</p>
            <p className="text-gray-500 text-sm mb-4">{t('audioDetail.audioId', { id: audioId })}</p>
            {error && (
              <p className="text-red-600 text-sm mb-4 bg-red-50 px-4 py-2 rounded-lg inline-block">
                {error}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => navigate('/feed')} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium"
              >
                {t('audioDetail.backToFeed')}
              </button>
              <button 
                onClick={() => navigate(-1)} 
                className="border border-gray-300 hover:bg-gray-50 text-black px-6 py-2 rounded-full font-medium"
              >
                {t('audioDetail.previousPage')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
      {/* Hero Section con fondo dinámico */}
      <div className="relative overflow-hidden">
        {/* Fondo dinámico con blur */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-500/15 to-pink-500/20"
          style={{
            backgroundImage: audio?.cover_url ? `url(${audio.cover_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px) brightness(0.3)',
            transform: 'scale(1.1)',
          }}
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white" />
        
        {/* Header con glassmorphism */}
        <div className="relative z-20 flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className="text-white hover:bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/20"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShare}
              className="text-white hover:bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/20"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Audio Info Section */}
        <div className="relative z-10 px-6 pb-8 pt-4">
          {/* Portada con efecto moderno */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="w-40 h-40 rounded-3xl overflow-hidden bg-white shadow-2xl border-4 border-white/50 backdrop-blur-sm transform transition-all duration-300 group-hover:scale-105">
                {audio?.cover_url ? (
                  <img 
                    src={audio.cover_url} 
                    alt={audio.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <Music className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
              
              {/* Play button overlay moderno */}
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center transform transition-transform hover:scale-110">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-gray-800" />
                  ) : (
                    <Play className="w-8 h-8 text-gray-800 ml-1" />
                  )}
                </div>
              </button>
              
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            </div>
          </div>

          {/* Título y artista con mejor tipografía */}
          <div className="text-center text-white mb-6">
            <h1 className="text-3xl font-bold mb-3 leading-tight drop-shadow-lg">
              {audio?.title || 'Audio Track'}
            </h1>
            
            {/* Artista con badge verificado */}
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-white/30">
                <span className="text-white font-bold text-lg">
                  {audio?.artist ? audio.artist[0].toUpperCase() : 'A'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-xl">
                  {audio?.artist || 'Unknown Artist'}
                </span>
                
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border border-white/20">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            {/* Audio stats */}
            <div className="flex items-center justify-center gap-6 mt-4 text-white/80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{formatDuration(audio?.duration || 30)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{formatNumber(audio?.uses_count || 0)} uses</span>
              </div>
              
              {audio?.category && (
                <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm border border-white/20">
                  <span className="text-xs font-medium">{audio.category}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info strip mejorada */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium">Original sound by</span>
              <span className="font-bold text-black">
                {postsLoading ? 'Loading...' : (originalUser || 'Unknown')}
              </span>
            </div>
          </div>
          
          <div className="text-gray-600 font-medium">
            {totalPosts > 0 ? 
              `${formatNumber(totalPosts)} posts` : 
              `${formatNumber(audio?.uses_count || 0)} posts`
            }
          </div>
        </div>
      </div>

      {/* Action buttons mejorados */}
      <div className="bg-white px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Use This Sound - Botón principal destacado */}
          <button 
            onClick={handleUseThisSound}
            className="flex-1 flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            <Plus className="w-6 h-6" />
            <span>Use this sound</span>
          </button>
          
          {/* Apple Music button mejorado */}
          <button 
            onClick={handleAddToItunes}
            className="flex-1 flex items-center justify-center gap-3 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-medium transition-all duration-300 transform hover:scale-[1.02] border border-gray-200"
          >
            <Apple className="w-6 h-6" />
            <span>Apple Music</span>
          </button>
        </div>
        
        {/* Secondary actions */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button 
            onClick={handleLike}
            className={`p-3 rounded-full transition-all duration-300 ${
              isFavorite 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          
          <button 
            onClick={handleShare}
            className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-300"
          >
            <Share2 className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-300"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Posts Grid Section con diseño mejorado */}
      <div className="flex-1 bg-white">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Posts using this sound
            </h2>
            {posts && posts.length > 0 && (
              <span className="text-sm text-gray-500">
                {formatNumber(posts.length)} posts
              </span>
            )}
          </div>
          
          {postsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading posts...</p>
              </div>
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {posts.map((post, index) => (
                <div 
                  key={post.id}
                  onClick={() => handlePollClick(post)}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-lg"
                >
                  {post.options && post.options.length > 0 && post.options[0].media_url ? (
                    <div className="relative w-full h-full">
                      {post.options[0].media_url.includes('.mp4') ? (
                        <video 
                          src={post.options[0].media_url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img 
                          src={post.options[0].media_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                      
                      {/* Stats overlay */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center justify-between text-white text-xs">
                          <span className="bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                            {formatNumber(post.totalVotes || 0)} votes
                          </span>
                          {post.music && (
                            <Music className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-xs font-medium">{post.title}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Be the first to create content with this sound!
              </p>
              <button 
                onClick={handleUseThisSound}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <PollModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        poll={selectedPoll}
        onVote={handlePollVote}
        onLike={handlePollLike}
        onShare={handlePollShare}
      />

      {/* TikTok View Modal */}
      {showTikTokView && (
        <div className="fixed inset-0 z-50 bg-black">
          <TikTokScrollView
            polls={posts.filter(p => p && p.id && p.authorUser)}
            onVote={handlePollVote}
            onLike={handlePollLike}
            onShare={handlePollShare}
            onComment={handlePollComment}
            onSave={handlePollSave}
            onCreatePoll={handleCreatePoll}
            onExitTikTok={handleExitTikTok}
            showLogo={false}
            initialIndex={selectedPostIndex}
            fromAudioDetailPage={true}
            currentAudio={audio}
            onUseSound={handleUseThisSound}
          />
        </div>
      )}

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setPreSelectedAudio(null);
        }}
        preSelectedAudio={preSelectedAudio}
        onCreatePoll={handleCreatePoll}
      />
    </div>
  );
};

export default AudioDetailPage;