import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import PollCard from '../components/PollCard';
import EditProfileModal from '../components/EditProfileModal';
import CommentsModal from '../components/CommentsModal';
import ShareModal from '../components/ShareModal';
import TikTokProfileGrid from '../components/TikTokProfileGrid';
import TikTokScrollView from '../components/TikTokScrollView';
import AvatarUpload from '../components/AvatarUpload';
import { Settings, Users, Vote, Trophy, Heart, Share, ArrowLeft, AtSign, Bookmark, Grid3X3, Check, Share2 } from 'lucide-react';
import pollService from '../services/pollService';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { useFollow } from '../contexts/FollowContext';
import { useShare } from '../hooks/useShare';
import { cn } from '../lib/utils';

const StatCard = ({ icon: Icon, label, value, color = "blue" }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          color === "blue" && "bg-blue-100 text-blue-600",
          color === "green" && "bg-green-100 text-green-600",
          color === "purple" && "bg-purple-100 text-purple-600",
          color === "pink" && "bg-pink-100 text-pink-600",
          color === "red" && "bg-red-100 text-red-600"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("polls");
  const [polls, setPolls] = useState([]);
  const [viewedUser, setViewedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedPolls, setSavedPolls] = useState([]);
  const [pollsLoading, setPollsLoading] = useState(true);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState(null);
  const [selectedPollTitle, setSelectedPollTitle] = useState('');
  const [selectedPollAuthor, setSelectedPollAuthor] = useState('');
  const [showTikTokView, setShowTikTokView] = useState(false);
  const [tikTokPolls, setTikTokPolls] = useState([]);
  const [initialPollIndex, setInitialPollIndex] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followStatsLoading, setFollowStatsLoading] = useState(true);
  const { toast } = useToast();
  const { user: authUser, refreshUser } = useAuth();
  const { getUserFollowers, getUserFollowing } = useFollow();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { shareModal, shareProfile, closeShareModal } = useShare();

  // Load user's polls
  useEffect(() => {
    const loadUserPolls = async () => {
      if (!authUser?.id && !userId) return;
      
      setPollsLoading(true);
      try {
        // Get all polls first
        const allPolls = await pollService.getPollsForFrontend({ limit: 100 });
        const targetUserId = userId || authUser?.id;
        const targetUsername = userId || authUser?.username;
        
        console.log('Target user ID:', targetUserId);
        console.log('Target username:', targetUsername);
        console.log('All polls:', allPolls.length);
        
        // Filter polls by the target user (check both ID and username)
        const userPolls = allPolls.filter(poll => {
          const authorMatches = poll.authorUser?.id === targetUserId || 
                               poll.authorUser?.username === targetUserId ||
                               poll.authorUser?.username === targetUsername;
                               
          console.log(`Poll "${poll.title}" by ${poll.authorUser?.username} (${poll.authorUser?.id}) - matches: ${authorMatches}`);
          return authorMatches;
        });
        
        console.log('Filtered user polls:', userPolls.length);
        setPolls(userPolls);
      } catch (error) {
        console.error('Error loading user polls:', error);
        toast({
          title: "Error al cargar votaciones",
          description: "No se pudieron cargar las votaciones del usuario",
          variant: "destructive",
        });
      } finally {
        setPollsLoading(false);
      }
    };

    loadUserPolls();
  }, [authUser?.id, authUser?.username, userId, toast]);

  // Load follow statistics
  useEffect(() => {
    const loadFollowStats = async () => {
      if (!authUser?.id && !userId) return;
      
      setFollowStatsLoading(true);
      try {
        const targetUserId = userId || authUser?.id;
        
        // Load followers and following counts
        const [followersData, followingData] = await Promise.all([
          getUserFollowers(targetUserId),
          getUserFollowing(targetUserId)
        ]);
        
        setFollowersCount(followersData.total || 0);
        setFollowingCount(followingData.total || 0);
        
        console.log(`User ${targetUserId} - Followers: ${followersData.total}, Following: ${followingData.total}`);
      } catch (error) {
        console.error('Error loading follow stats:', error);
        // Don't show toast for follow stats errors to avoid spam
        setFollowersCount(0);
        setFollowingCount(0);
      } finally {
        setFollowStatsLoading(false);
      }
    };

    loadFollowStats();
  }, [authUser?.id, userId, getUserFollowers, getUserFollowing]);

  // Create a comprehensive user database from actual polls
  const allUsers = [
    // Add current authenticated user
    ...(authUser ? [{
      id: authUser.id,
      username: authUser.username,
      displayName: authUser.display_name,
      avatar: authUser.avatar_url,
      verified: authUser.is_verified || false,
      followers: followersCount || 0, // Use real data for current user
      bio: authUser.bio || ''
    }] : []),
    // Add users from polls
    ...polls.flatMap(poll => [
      // Poll author
      ...(poll.authorUser ? [{
        id: poll.authorUser.username,
        username: poll.authorUser.username,
        displayName: poll.authorUser.displayName,
        avatar: poll.authorUser.avatar,
        verified: poll.authorUser.verified || false,
        followers: poll.authorUser.followers || 0,
        bio: 'Bio from poll data'
      }] : []),
      // Option users
      ...poll.options.map(option => ({
        id: option.user.username,
        username: option.user.username,
        displayName: option.user.displayName,
        avatar: option.user.avatar,
        verified: option.user.verified || false,
        followers: option.user.followers || 0,
        bio: 'Bio from option data'
      }))
    ])
  ];

  // Remove duplicates by username
  const uniqueUsers = allUsers.filter((user, index, self) => 
    index === self.findIndex((u) => u.username === user.username)
  );

  // Function to get user by ID/username
  const getUserById = (id) => {
    return uniqueUsers.find(user => user.username === id || user.id === id);
  };

  // Load user data when userId changes
  useEffect(() => {
    if (userId) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const user = getUserById(userId);
        if (user) {
          setViewedUser(user);
        } else {
          toast({
            title: "Usuario no encontrado",
            description: "El perfil que buscas no existe",
            variant: "destructive"
          });
          navigate('/profile');
        }
        setLoading(false);
      }, 500);
    } else {
      setViewedUser(null);
      setLoading(false);
    }
  }, [userId, navigate, toast]);

  // Initialize saved polls (mock data)
  useEffect(() => {
    // In real app, this would be fetched from backend
    const mockSavedPolls = polls.filter((poll, index) => index % 3 === 0); // Every 3rd poll as example
    setSavedPolls(mockSavedPolls);
  }, [polls]);

  const handleShareProfile = () => {
    // Intentar usar Web Share API primero (mejor para móviles)
    if (navigator.share) {
      navigator.share({
        title: `Perfil de ${viewedUser?.display_name || viewedUser?.username}`,
        text: `Mira el perfil de ${viewedUser?.display_name || viewedUser?.username} en nuestra plataforma`,
        url: window.location.href,
      }).then(() => {
        toast({
          title: "Perfil compartido",
          description: "El perfil ha sido compartido exitosamente",
        });
      }).catch((error) => {
        console.log('Error sharing:', error);
        // Si falla Web Share API, abrir modal
        if (viewedUser) {
          shareProfile(viewedUser);
        }
      });
    } else {
      // Si Web Share API no está disponible, abrir modal de compartir
      if (viewedUser) {
        shareProfile(viewedUser);
      }
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast({
          title: "URL copiada",
          description: "La URL del perfil ha sido copiada al portapapeles",
        });
      }).catch(() => {
        // Fallback más básico
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      toast({
        title: "URL copiada",
        description: "La URL del perfil ha sido copiada al portapapeles",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo copiar la URL del perfil",
        variant: "destructive"
      });
    }
    document.body.removeChild(textArea);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Determine which user to display and calculate dynamic stats
  const isOwnProfile = !userId || userId === authUser?.username;
  
  // Filter user's polls based on actual author ID (must be before displayUser calculation)
  const userPolls = polls.filter(poll => {
    if (isOwnProfile) {
      // For own profile, match by authenticated user ID
      return poll.authorUser?.id === authUser?.id;
    } else {
      // For other profiles, match by the viewed user ID/username
      return poll.authorUser?.id === userId || poll.authorUser?.username === userId;
    }
  });
  
  // Calculate dynamic statistics from actual user polls
  const totalVotesReceived = userPolls.reduce((total, poll) => total + (poll.totalVotes || 0), 0);
  const totalLikesReceived = userPolls.reduce((total, poll) => total + (poll.likes || 0), 0);
  const totalSharesReceived = userPolls.reduce((total, poll) => total + (poll.shares || 0), 0);
  
  const displayUser = isOwnProfile ? {
    id: authUser?.id || '1',
    username: authUser?.username || 'usuario_actual',
    displayName: authUser?.display_name || authUser?.username || 'Mi Perfil',
    email: authUser?.email || 'user@example.com',
    bio: authUser?.bio || '🎯 Creando votaciones épicas | 📊 Fan de las estadísticas | 🚀 Siempre innovando',
    avatar: authUser?.avatar_url || null,
    followers: followersCount, // Dynamic from follow system
    following: followingCount,  // Dynamic from follow system
    totalVotes: totalVotesReceived,
    totalLikes: totalLikesReceived,
    totalShares: totalSharesReceived,
    pollsCreated: userPolls.length,
    totalPolls: userPolls.length,
    verified: authUser?.is_verified || false
  } : viewedUser || {
    id: 'default_user',
    username: 'usuario',
    displayName: 'Usuario',
    email: 'usuario@example.com',
    bio: 'Perfil de usuario',
    avatar: null,
    followers: followersCount,
    following: followingCount,
    totalVotes: 0,
    totalLikes: 0, 
    totalShares: 0,
    pollsCreated: 0,
    totalPolls: 0,
    verified: false
  };

  // Add null safety check to prevent charAt errors
  if (!displayUser || (!displayUser.displayName && !displayUser.username)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const likedPolls = polls.filter(poll => poll.userLiked);
  
  // Mock mentions - polls where user is mentioned in options
  const mentionedPolls = polls.filter(poll => 
    poll.options.some(option => 
      option.user?.username === displayUser.username || 
      option.user?.displayName === displayUser.displayName
    )
  );
  

  
  // Function to toggle save status
  const handleSave = (pollId) => {
    const isSaved = savedPolls.some(poll => poll.id === pollId);
    if (isSaved) {
      setSavedPolls(savedPolls.filter(poll => poll.id !== pollId));
      toast({
        title: "Publicación eliminada",
        description: "La publicación ha sido removida de guardados",
      });
    } else {
      const pollToSave = polls.find(poll => poll.id === pollId);
      if (pollToSave) {
        setSavedPolls([...savedPolls, pollToSave]);
        toast({
          title: "¡Publicación guardada!",
          description: "La publicación ha sido guardada exitosamente",
        });
      }
    }
  };

  const handleVote = async (pollId, optionId) => {
    try {
      // In a real implementation, this would call the backend API
      // For now, we'll just show a success message
      toast({
        title: "¡Voto registrado!",
        description: "Tu voto ha sido contabilizado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error al votar",
        description: "No se pudo registrar tu voto",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (pollId) => {
    try {
      // In a real implementation, this would call the backend API
      // For now, we'll just show a success message
      toast({
        title: "¡Te gusta!",
        description: "Has dado like a esta votación",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo dar like a la votación",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (pollId) => {
    const shareUrl = `${window.location.origin}/poll/${pollId}`;
    
    // Intentar usar Web Share API primero (mejor para móviles)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vota en esta encuesta',
          text: 'Mira esta increíble votación',
          url: shareUrl,
        });
        toast({
          title: "¡Compartido exitosamente!",
          description: "La votación ha sido compartida",
        });
        return;
      } catch (err) {
        // Si el usuario cancela el share, no mostrar error
        if (err.name !== 'AbortError') {
          console.log('Error al compartir:', err);
        }
      }
    }
    
    // Fallback: intentar copiar al portapapeles
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace de la votación ha sido copiado al portapapeles",
      });
    } catch (err) {
      // Fallback final: crear elemento temporal para copiar
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        toast({
          title: "¡Enlace copiado!",
          description: "El enlace de la votación ha sido copiado al portapapeles",
        });
      } catch (fallbackErr) {
        // Si todo falla, mostrar el enlace para copiar manualmente
        toast({
          title: "Copiar enlace",
          description: `Copia este enlace: ${shareUrl}`,
          duration: 8000,
        });
      }
    }
  };

  const handlePollClick = (poll) => {
    // Encontrar el índice de la publicación seleccionada dentro de la lista actual
    const currentPolls = activeTab === 'polls' ? userPolls : 
                        activeTab === 'liked' ? likedPolls :
                        activeTab === 'mentions' ? mentionedPolls :
                        activeTab === 'saved' ? savedPolls : [];
    
    const pollIndex = currentPolls.findIndex(p => p.id === poll.id);
    
    setTikTokPolls(currentPolls);
    setInitialPollIndex(pollIndex >= 0 ? pollIndex : 0);
    setShowTikTokView(true);
  };

  const handleComment = (pollId) => {
    const poll = polls.find(p => p.id === pollId);
    if (poll) {
      setSelectedPollId(pollId);
      setSelectedPollTitle(poll.title);
      setSelectedPollAuthor(poll.author);
      setShowCommentsModal(true);
    }
  };

  const handleProfileUpdate = async () => {
    // Refresh user data after profile update
    await refreshUser();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {!isOwnProfile && (
                <Button variant="ghost" size="sm" onClick={handleBack} className="hover:bg-gray-100">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <h1 className="text-xl font-bold text-gray-900">
                {isOwnProfile ? 'Mi Perfil' : `@${displayUser.username}`}
              </h1>
            </div>
            {isOwnProfile && (
              <Button variant="ghost" size="sm" className="hover:bg-gray-100" onClick={handleSettingsClick}>
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Profile Header */}
        <Card className="mb-6 overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                {isOwnProfile ? (
                  <AvatarUpload
                    currentAvatar={displayUser.avatar}
                    onAvatarUpdate={(result, avatarUrl) => {
                      // Update the displayed user's avatar
                      setViewedUser(prev => ({ ...prev, avatar: avatarUrl }));
                      
                      toast({
                        title: "Avatar actualizado",
                        description: "Tu foto de perfil se actualizó correctamente",
                      });
                    }}
                    size="xl"
                    showUploadButton={false}
                    className="ring-4 ring-white/20"
                  />
                ) : (
                  <Avatar className="w-32 h-32 ring-4 ring-white/20">
                    <AvatarImage src={displayUser.avatar} alt={displayUser.displayName} />
                    <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                      {((displayUser?.displayName || displayUser?.username || 'U') + '').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {displayUser.verified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center ring-4 ring-white">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{displayUser.displayName}</h2>
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    @{displayUser.username}
                  </Badge>
                  {/* Removed level badge */}
                </div>
                
                <p className="text-white/90 max-w-md">{displayUser.bio}</p>
                

              </div>

              <div className="flex gap-2">
                {isOwnProfile ? (
                  <>
                    <Button 
                      variant="outline" 
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => setEditProfileModalOpen(true)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-blue-500/20 border-blue-500/30 text-white hover:bg-blue-500/30"
                      onClick={handleShareProfile}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                      <Users className="w-4 h-4 mr-2" />
                      Seguir
                    </Button>
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Heart className="w-4 h-4 mr-2" />
                      Me gusta
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Users}
            label="Seguidores"
            value={followStatsLoading ? "..." : displayUser.followers.toLocaleString()}
            color="blue"
          />
          <StatCard
            icon={Vote}
            label="Votaciones"
            value={displayUser.totalPolls}
            color="green"
          />
          <StatCard
            icon={Heart}
            label="Me gusta"
            value={displayUser.totalLikes || 0}
            color="pink"
          />
          <StatCard
            icon={Users}
            label="Siguiendo"
            value={displayUser.following}
            color="purple"
          />
        </div>

        {/* Progress Bar - Removed gamification stats */}

        {/* Content Tabs */}
        <Tabs defaultValue="polls" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="polls" className="flex items-center justify-center">
              <Grid3X3 className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="mentions" className="flex items-center justify-center">
              <AtSign className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="polls" className="space-y-6">
            {userPolls.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Grid3X3 className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No has creado publicaciones</h3>
                <p className="text-gray-600 mb-6">¡Crea tu primera publicación para empezar a obtener votos!</p>
              </div>
            ) : (
              <TikTokProfileGrid 
                polls={userPolls} 
                onPollClick={handlePollClick}
              />
            )}
          </TabsContent>

          <TabsContent value="liked" className="space-y-6">
            {likedPolls.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No tienes publicaciones favoritas</h3>
                <p className="text-gray-600 mb-6">¡Dale like a las publicaciones que más te gusten!</p>
              </div>
            ) : (
              <TikTokProfileGrid 
                polls={likedPolls} 
                onPollClick={handlePollClick}
              />
            )}
          </TabsContent>

          <TabsContent value="mentions" className="space-y-6">
            {mentionedPolls.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AtSign className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No tienes menciones</h3>
                <p className="text-gray-600 mb-6">Las publicaciones donde seas mencionado aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <AtSign className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {mentionedPolls.length} menciones encontradas
                  </h3>
                </div>
                <TikTokProfileGrid 
                  polls={mentionedPolls} 
                  onPollClick={handlePollClick}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            {savedPolls.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bookmark className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No tienes publicaciones guardadas</h3>
                <p className="text-gray-600 mb-6">Guarda las votaciones interesantes para verlas más tarde</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {savedPolls.length} publicaciones guardadas
                    </h3>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSavedPolls([]);
                      toast({
                        title: "Guardados limpiados",
                        description: "Todas las publicaciones guardadas han sido eliminadas",
                      });
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Limpiar todo
                  </Button>
                </div>
                <TikTokProfileGrid 
                  polls={savedPolls} 
                  onPollClick={handlePollClick}
                />
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        onUpdate={handleProfileUpdate}
      />

      {/* Comments Modal */}
      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        pollId={selectedPollId}
        pollTitle={selectedPollTitle}
        pollAuthor={selectedPollAuthor}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={closeShareModal}
        content={shareModal.content}
      />

      {/* TikTok View Modal */}
      {showTikTokView && (
        <div className="fixed inset-0 bg-black z-50">
          <TikTokScrollView
            polls={tikTokPolls}
            onVote={handleVote}
            onLike={handleLike}
            onShare={handleShare}
            onComment={handleComment}
            initialIndex={initialPollIndex}
            onClose={() => setShowTikTokView(false)}
            showLogo={false}
          />
        </div>
      )}
    </div>
  );
};

export default ProfilePage;