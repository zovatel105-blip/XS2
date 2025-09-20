import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Music, Users, Share2, Plus, Heart
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import audioManager from '../services/AudioManager';
import pollService from '../services/pollService';
import { Button } from '../components/ui/button';
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
    
    // Navigate to ContentCreationPage with preselected audio
    navigate('/content-creation', {
      state: {
        preSelectedAudio: audioForCreation
      }
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
    // This function is no longer needed since we navigate to ContentCreationPage
    await fetchPostsUsingAudio();
  };

  const handleSave = async (pollId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/polls/${pollId}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Publicación guardada",
          description: "La publicación se ha guardado exitosamente",
        });
        
        // Update the posts state to reflect the saved status
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === pollId 
              ? { ...post, isSaved: data.saved, saves: data.saves } 
              : post
          )
        );
      } else {
        throw new Error('Error al guardar la publicación');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la publicación",
        variant: "destructive"
      });
    }
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

      <div className="w-full px-4 py-6 space-y-6">
        
        {/* Audio Info */}
        <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6">
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
        <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
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
      </div>

      {/* Posts using this audio - SECCIÓN INDEPENDIENTE SIN PADDING LATERAL */}
      <div className="space-y-4">
        <div className="px-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Videos con este audio
            </h3>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{posts.length}</span>
            </div>
          </div>
        </div>
        
        {postsLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando videos...</p>
          </div>
        ) : posts.length > 0 ? (
          <TikTokProfileGrid 
            polls={posts} 
            onPollClick={handleVideoClick}
            onUpdatePoll={() => {}} // No update functionality needed here
            onDeletePoll={() => {}} // No delete functionality needed here
            currentUser={null} // Not needed for this view
            isOwnProfile={false}
          />
        ) : (
          <div className="text-center py-16 space-y-6 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-gray-900">
                Sin videos aún
              </h4>
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                Sé el primero en crear contenido con este audio
              </p>
            </div>
            <Button onClick={handleUseThisSound} className="mt-4">
              Crear video
            </Button>
          </div>
        )}
      </div>

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
            fromAudioDetailPage={true}
          />
        </div>
      )}
    </div>
  );
};

export default AudioDetailPage;