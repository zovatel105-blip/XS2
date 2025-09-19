import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Music, Users, Clock, Calendar, Volume2, Share2, Heart, 
  MessageCircle, MoreVertical, Plus, TrendingUp, Download, Repeat, Shuffle,
  BarChart3, Star, Eye, Headphones, Radio, Disc3, Send, Apple
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



import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Music, Users, Heart, Share2, Plus, 
  UserPlus, Mic, Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../hooks/use-toast';
import { useTranslation } from '../hooks/useTranslation';
import audioManager from '../services/AudioManager';
import pollService from '../services/pollService';
import { Button } from '../components/ui/button';
import CreatePollModal from '../components/CreatePollModal';
import TikTokScrollView from '../components/TikTokScrollView';

const AudioDetailPage = () => {
  const { audioId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, formatNumber, formatDuration } = useTranslation();
  
  const [audio, setAudio] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [preSelectedAudio, setPreSelectedAudio] = useState(null);
  const [showTikTokView, setShowTikTokView] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);

  useEffect(() => {
    fetchAudioDetails();
    fetchPostsUsingAudio();
  }, [audioId]);

  const fetchAudioDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/audio/${audioId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAudio(data.audio);
      } else {
        const musicResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/music/library-with-previews?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (musicResponse.ok) {
          const musicData = await musicResponse.json();
          const musicTrack = musicData.music?.find(m => m.id === audioId);
          if (musicTrack) {
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
          } else {
            throw new Error('Audio not found');
          }
        } else {
          throw new Error('Audio not found');
        }
      }
    } catch (error) {
      console.error('Error fetching audio details:', error);
      setError('Audio no encontrado');
      toast({
        title: "Error",
        description: "No se pudo cargar el audio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPostsUsingAudio = async () => {
    try {
      setPostsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/audio/${audioId}/posts?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const transformedPosts = (data.posts || []).map(post => ({
          ...post,
          userVote: post.user_vote,
          userLiked: post.user_liked,
          totalVotes: post.total_votes,
          authorUser: post.author,
          commentsCount: post.comments_count
        }));
        setPosts(transformedPosts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
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
    if (!audio) return;

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
    
    setPreSelectedAudio(audioForCreation);
    setShowCreateModal(true);
    
    toast({
      title: "Audio seleccionado",
      description: `${audio.title} listo para crear contenido`
    });
  };

  const handleFollowAudio = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Dejaste de seguir" : "Siguiendo",
      description: isFollowing ? "Ya no recibirás notificaciones de este sonido" : "Recibirás actualizaciones de este sonido"
    });
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;
      const shareText = `🎵 "${audio.title}" - ${audio.artist}`;
      
      if (navigator.share && navigator.canShare) {
        await navigator.share({
          title: `${audio.title} - ${audio.artist}`,
          text: shareText,
          url: url
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        toast({
          title: "Enlace copiado",
          description: "Se ha copiado al portapapeles"
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleVideoClick = (post, index) => {
    setSelectedPostIndex(index);
    setShowTikTokView(true);
  };

  const handleCreatePoll = async (newPoll) => {
    setShowCreateModal(false);
    setPreSelectedAudio(null);
    await fetchPostsUsingAudio();
  };

  const getAudioTypeLabel = () => {
    if (audio?.is_system_music) return 'Música';
    if (audio?.category === 'voice') return 'Voz';
    if (audio?.category === 'effect') return 'Efecto';
    return 'Audio';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Cargando sonido...</p>
        </div>
      </div>
    );
  }

  if (error || !audio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <Music className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Sonido no encontrado</h2>
          <p className="text-gray-600">Este sonido no está disponible</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header minimalista */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </Button>
          
          <h1 className="text-lg font-medium text-gray-900">Detalles del sonido</h1>
          
          <div className="w-10"></div> {/* Spacer para centrar el título */}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        
        {/* 1. EL AUDIO COMO PROTAGONISTA */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="space-y-6">
            
            {/* Nombre y etiqueta */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {audio.title}
              </h2>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-600">
                {getAudioTypeLabel()}
              </div>
            </div>

            {/* Botón de reproducción y contador */}
            <div className="flex items-center justify-center space-x-8">
              
              {/* Botón de reproducción circular */}
              <motion.button
                onClick={handlePlayPause}
                className="w-16 h-16 bg-gray-900 hover:bg-gray-800 rounded-full flex items-center justify-center shadow-lg transition-colors"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </motion.button>

              {/* Contador de usos discreto */}
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(posts.length || audio.uses_count || 0)}
                </p>
                <p className="text-sm text-gray-500">usos</p>
              </div>
            </div>

            {/* Información del artista */}
            {audio.artist && (
              <div className="text-center">
                <p className="text-gray-600">
                  <span className="font-medium">{audio.artist}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 2. LA COMUNIDAD DETRÁS DEL SONIDO */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 px-2">
            Creaciones con este sonido
          </h3>
          
          {postsLoading ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando contenido...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-3">
              {posts.slice(0, 10).map((post, index) => (
                <motion.div
                  key={post.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-200"
                  onClick={() => handleVideoClick(post, index)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center space-x-4">
                    
                    {/* Miniatura */}
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                      {post.media_url ? (
                        <img 
                          src={post.media_url} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Barra de progreso sutil */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20">
                        <div 
                          className="h-full bg-white"
                          style={{ width: `${Math.random() * 70 + 20}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Información del creador */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {post.title || 'Video sin título'}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        @{post.author?.username || post.author?.display_name || 'usuario'}
                      </p>
                    </div>

                    {/* Indicador de popularidad silencioso */}
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        (post.totalVotes || 0) > 50 ? 'bg-green-400' : 
                        (post.totalVotes || 0) > 20 ? 'bg-yellow-400' : 'bg-gray-300'
                      }`}></div>
                      <span className="text-xs text-gray-500">
                        {formatNumber(post.totalVotes || 0)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {posts.length > 10 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">
                    +{posts.length - 10} creaciones más
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">
                Sé el primero en usar este sonido
              </h4>
              <p className="text-gray-500 text-sm mb-6">
                Crea el primer contenido con este audio
              </p>
              <Button onClick={handleUseThisSound} className="bg-gray-900 hover:bg-gray-800">
                Crear ahora
              </Button>
            </div>
          )}
        </div>

        {/* 3. ACCIONES CONSCIENTES */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <div className="grid grid-cols-1 gap-4">
            
            {/* Usar este audio */}
            <motion.button
              onClick={handleUseThisSound}
              className="flex items-center justify-center space-x-3 py-4 px-6 bg-amber-50 hover:bg-amber-100 rounded-2xl border border-amber-200 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5 text-amber-700" />
              <span className="font-medium text-amber-800">Usar este audio</span>
            </motion.button>

            {/* Seguir este sonido */}
            <motion.button
              onClick={handleFollowAudio}
              className={`flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl border transition-colors ${
                isFollowing 
                  ? 'bg-blue-50 border-blue-200 text-blue-800' 
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserPlus className="w-5 h-5" />
              <span className="font-medium">
                {isFollowing ? 'Siguiendo sonido' : 'Seguir este sonido'}
              </span>
            </motion.button>

            {/* Compartir */}
            <motion.button
              onClick={handleShare}
              className="flex items-center justify-center space-x-3 py-4 px-6 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-200 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Share2 className="w-5 h-5 text-gray-700" />
              <span className="font-medium text-gray-700">Compartir</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Modales */}
      <CreatePollModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setPreSelectedAudio(null);
        }}
        preSelectedAudio={preSelectedAudio}
        onCreatePoll={handleCreatePoll}
      />

      {/* TikTok View */}
      {showTikTokView && (
        <div className="fixed inset-0 z-50 bg-black">
          <TikTokScrollView
            polls={posts}
            initialIndex={selectedPostIndex}
            onExitTikTok={() => setShowTikTokView(false)}
            showLogo={false}
            currentAudio={audio}
            onUseSound={handleUseThisSound}
          />
        </div>
      )}
    </div>
  );
};

export default AudioDetailPage;