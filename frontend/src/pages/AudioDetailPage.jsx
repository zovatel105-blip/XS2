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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="mr-4 text-white hover:bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Audio Details</h1>
              <p className="text-gray-400 text-sm">Discover and explore music</p>
            </div>
          </div>
          <Button 
            variant="ghost"
            onClick={handleLike}
            className="text-white hover:bg-white/10"
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        {/* Hero Audio Card */}
        <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/20 shadow-2xl overflow-hidden">
          
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20 blur-sm"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row gap-8">
            
            {/* Enhanced Audio Cover */}
            <div className="relative flex-shrink-0 mx-auto lg:mx-0">
              <div className="relative w-64 h-64 rounded-3xl overflow-hidden shadow-2xl group">
                
                {/* Rotating vinyl effect for playing state */}
                {isPlaying && (
                  <div className="absolute inset-0 z-0">
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-4 bg-black rounded-full"></div>
                    <div className="absolute inset-8 bg-gray-800 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-gray-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                )}
                
                {audio?.cover_url ? (
                  <img 
                    src={audio.cover_url} 
                    alt={audio.title}
                    className={`relative z-10 w-full h-full object-cover transition-transform duration-300 ${isPlaying ? 'animate-pulse' : 'group-hover:scale-105'}`}
                  />
                ) : (
                  <div className="relative z-10 w-full h-full bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 flex items-center justify-center group-hover:from-purple-500 group-hover:to-pink-500 transition-colors">
                    <Music className="w-20 h-20 text-white" />
                  </div>
                )}
                
                {/* Enhanced Play Button */}
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 group-hover:bg-black/40"
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 transform hover:scale-110 transition-transform shadow-xl">
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-gray-900" />
                    ) : (
                      <Play className="w-8 h-8 text-gray-900 ml-1" />
                    )}
                  </div>
                </button>

                {/* Playing Indicator */}
                {isPlaying && (
                  <div className="absolute top-4 right-4 z-30">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Reproduciendo
                    </div>
                  </div>
                )}

                {/* Audio Quality Badge */}
                <div className="absolute bottom-4 left-4 z-30">
                  <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Headphones className="w-3 h-3" />
                    HD Audio
                  </div>
                </div>
              </div>

              {/* Waveform Visualization */}
              <div className="mt-6 bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <AudioWaveform className="w-4 h-4 text-purple-400" />
                  <span className="text-white text-sm font-medium">Waveform</span>
                </div>
                <div className="flex items-end gap-1 h-20" ref={waveformRef}>
                  {waveformData.map((height, index) => (
                    <div
                      key={index}
                      className={`bg-gradient-to-t from-purple-500 to-pink-400 rounded-full transition-all duration-300 ${
                        isPlaying && index < playbackPosition ? 'opacity-100' : 'opacity-40'
                      }`}
                      style={{
                        height: `${height}%`,
                        width: '4px',
                        animation: isPlaying ? `waveform 1s ease-in-out infinite ${index * 0.1}s` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Audio Info */}
            <div className="flex-1 min-w-0">
              
              {/* Title and Artist */}
              <div className="mb-6">
                <h2 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  {audio?.title}
                </h2>
                <p className="text-xl text-gray-300 mb-4 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-purple-400" />
                  {audio?.artist}
                </p>

                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-400 text-xs uppercase tracking-wide">Duración</span>
                    </div>
                    <p className="text-white font-bold text-lg">{formatDuration(audio?.duration || 0)}</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-green-400" />
                      <span className="text-gray-400 text-xs uppercase tracking-wide">Usos</span>
                    </div>
                    <p className="text-white font-bold text-lg">{formatNumber(audio?.uses_count || 0)}</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-400 text-xs uppercase tracking-wide">Vistas</span>
                    </div>
                    <p className="text-white font-bold text-lg">{formatNumber((audio?.uses_count || 0) * 4.7)}</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-400 text-xs uppercase tracking-wide">Rating</span>
                    </div>
                    <p className="text-white font-bold text-lg">4.8</p>
                  </div>
                </div>

                {/* Enhanced Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {audio?.is_system_music && (
                    <span className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30 flex items-center gap-2">
                      <Disc3 className="w-3 h-3" />
                      {audio.source}
                    </span>
                  )}
                  {audio?.category && (
                    <span className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30 flex items-center gap-2">
                      <BarChart3 className="w-3 h-3" />
                      {audio.category}
                    </span>
                  )}
                  {audio?.genre && (
                    <span className="px-4 py-2 bg-gradient-to-r from-pink-500/20 to-pink-600/20 text-pink-300 rounded-full text-sm font-medium border border-pink-500/30">
                      {audio.genre}
                    </span>
                  )}
                  <span className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 rounded-full text-sm font-medium border border-green-500/30 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </span>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleUseThisSound}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Usar este sonido
                  </Button>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handlePlayPause}
                      size="lg"
                      className="border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-2xl px-6"
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
                      size="lg"
                      className="border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-2xl px-6"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleDownload}
                      size="lg"
                      className="border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-2xl px-6"
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Posts Section */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-purple-400" />
              Publicaciones con este audio
              <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
                {posts.length}
              </span>
            </h3>
            {posts.length > 0 && (
              <Button 
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                Ver todas
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            )}
          </div>
          
          {postsLoading ? (
            <div className="text-center py-12">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <Music className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-gray-400 text-lg">Cargando publicaciones...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="grid gap-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors">
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
            <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto border border-purple-500/30">
                  <MessageCircle className="w-10 h-10 text-purple-400" />
                </div>
              </div>
              <h4 className="text-white text-xl font-bold mb-2">¡Sé el primero!</h4>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Aún no hay publicaciones con este increíble audio. ¿Por qué no crear la primera?
              </p>
              <Button 
                onClick={handleUseThisSound}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-2xl shadow-xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear primera publicación
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* Custom CSS for animations */}
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