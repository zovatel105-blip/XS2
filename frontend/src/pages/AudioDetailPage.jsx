import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Music, Users, Share2, Plus, Heart
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import audioManager from '../services/AudioManager';
import pollService from '../services/pollService';
import { Button } from '../components/ui/button';
import CreatePollModal from '../components/CreatePollModal';
import TikTokScrollView from '../components/TikTokScrollView';
import TikTokProfileGrid from '../components/TikTokProfileGrid';

const AudioDetailPage = () => {
  const { audioId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [audio, setAudio] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
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

  const handleVideoClick = (post) => {
    // Find the index of the post in the posts array
    const index = posts.findIndex(p => p.id === post.id);
    setSelectedPostIndex(index >= 0 ? index : 0);
    setShowTikTokView(true);
  };

  const handleCreatePoll = async (newPoll) => {
    setShowCreateModal(false);
    setPreSelectedAudio(null);
    await fetchPostsUsingAudio();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Cargando audio...</p>
        </div>
      </div>
    );
  }

  if (error || !audio) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <Music className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Audio no encontrado</h2>
          <p className="text-gray-600">Este audio no está disponible</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          
          <h1 className="text-lg font-semibold text-gray-900">Audio</h1>
          
          <div className="w-10"></div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Audio Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {audio.cover_url ? (
                <img 
                  src={audio.cover_url} 
                  alt={audio.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Music className="w-8 h-8 text-purple-600" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {audio.title}
              </h2>
              {audio.artist && (
                <p className="text-gray-600 truncate">{audio.artist}</p>
              )}
              <p className="text-sm text-gray-500">
                {posts.length || audio.uses_count || 0} usos
              </p>
            </div>

            <Button
              onClick={handlePlayPause}
              size="lg"
              className="w-12 h-12 rounded-full p-0"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleUseThisSound}
            className="flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Usar</span>
          </Button>
          
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex items-center justify-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir</span>
          </Button>
        </div>

        {/* Posts using this audio */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Videos con este audio
            </h3>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{posts.length}</span>
            </div>
          </div>
          
          {postsLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando videos...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleVideoClick(post, index)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {post.media_url ? (
                        <img 
                          src={post.media_url} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {post.title || 'Video sin título'}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        @{post.author?.username || post.author?.display_name || 'usuario'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {post.totalVotes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">
                Sin videos aún
              </h4>
              <p className="text-gray-500 text-sm mb-6">
                Sé el primero en crear contenido con este audio
              </p>
              <Button onClick={handleUseThisSound}>
                Crear video
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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