import React, { useState, useEffect, useMemo } from 'react';
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
import { 
  Settings, Users, Vote, Trophy, Heart, Share, ArrowLeft, AtSign, Bookmark, Grid3X3, Check, 
  Share2, UserPlus, UserCheck, Menu, ChevronDown, Plus, BarChart3, Mail, MessageCircle 
} from 'lucide-react';
import pollService from '../services/pollService';
import userService from '../services/userService';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { useFollow } from '../contexts/FollowContext';
import { useShare } from '../hooks/useShare';
import { useTikTok } from '../contexts/TikTokContext';
import { cn } from '../lib/utils';

const StatCard = ({ icon: Icon, label, value, color = "blue", onClick, clickable = false }) => (
  <Card 
    className={cn(
      "transition-all duration-300",
      clickable ? "hover:shadow-lg hover:scale-105 cursor-pointer hover:bg-gray-50" : "hover:shadow-md",
    )}
    onClick={clickable ? onClick : undefined}
  >
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
          <p className={cn(
            "text-sm",
            clickable ? "text-blue-600 font-medium" : "text-gray-600"
          )}>
            {label}
          </p>
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
  const [tikTokPolls, setTikTokPolls] = useState([]);
  const [initialPollIndex, setInitialPollIndex] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followStatsLoading, setFollowStatsLoading] = useState(true);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const { toast } = useToast();
  const { user: authUser, refreshUser } = useAuth();
  const { getUserFollowers, getUserFollowing, followUser, unfollowUser, isFollowing, getFollowStatus } = useFollow();
  const { shareModal, shareProfile, closeShareModal } = useShare();
  const { enterTikTokMode, exitTikTokMode, isTikTokMode } = useTikTok();
  const { userId } = useParams();
  const navigate = useNavigate();

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

  // Load followers list when tab is activated
  const loadFollowersList = async () => {
    if (followersLoading) return;
    
    setFollowersLoading(true);
    try {
      const targetUserId = userId || authUser?.id;
      console.log('🔍 LOADING FOLLOWERS LIST:');
      console.log('  Target User ID:', targetUserId);
      console.log('  Current Auth User:', authUser?.username);
      
      const followersData = await getUserFollowers(targetUserId);
      console.log('📊 FOLLOWERS DATA RECEIVED:', followersData);
      console.log('  Followers Array:', followersData.followers);
      console.log('  Total Count:', followersData.total);
      console.log('  Array Length:', followersData.followers ? followersData.followers.length : 'undefined');
      
      setFollowersList(followersData.followers || []);
      
      if (followersData.followers && followersData.followers.length > 0) {
        console.log('✅ First follower:', followersData.followers[0]);
      } else {
        console.log('⚠️ No followers found in response');
      }
    } catch (error) {
      console.error('❌ Error loading followers list:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los seguidores",
        variant: "destructive",
      });
    } finally {
      setFollowersLoading(false);
    }
  };

  // Load following list when tab is activated
  const loadFollowingList = async () => {
    if (followingLoading) return;
    
    setFollowingLoading(true);
    try {
      const targetUserId = userId || authUser?.id;
      console.log('🔍 LOADING FOLLOWING LIST:');
      console.log('  Target User ID:', targetUserId);
      console.log('  Current Auth User:', authUser?.username);
      
      const followingData = await getUserFollowing(targetUserId);
      console.log('📊 FOLLOWING DATA RECEIVED:', followingData);
      console.log('  Following Array:', followingData.following);
      console.log('  Total Count:', followingData.total);
      console.log('  Array Length:', followingData.following ? followingData.following.length : 'undefined');
      
      setFollowingList(followingData.following || []);
      
      if (followingData.following && followingData.following.length > 0) {
        console.log('✅ First following user:', followingData.following[0]);
      } else {
        console.log('⚠️ No following users found in response');
      }
    } catch (error) {
      console.error('❌ Error loading following list:', error);
      toast({
        title: "Error", 
        description: "No se pudo cargar la lista de siguiendo",
        variant: "destructive",
      });
    } finally {
      setFollowingLoading(false);
    }
  };

  // Handle follow/unfollow actions
  const handleFollowToggle = async (user) => {
    try {
      if (isFollowing(user.id)) {
        await unfollowUser(user.id);
        toast({
          title: "Dejaste de seguir",
          description: `Ya no sigues a @${user.username}`,
        });
      } else {
        await followUser(user.id);
        toast({
          title: "¡Ahora sigues!",
          description: `Ahora sigues a @${user.username}`,
        });
      }
      
      // Refresh the lists after follow action
      if (showFollowersModal) {
        await loadFollowersList();
      } else if (showFollowingModal) {
        await loadFollowingList();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el seguimiento",
        variant: "destructive",
      });
    }
  };

  // Handle clicks on followers/following stats
  const handleFollowersClick = async () => {
    setShowFollowersModal(true);
    await loadFollowersList();
  };

  const handleFollowingClick = async () => {
    setShowFollowingModal(true);
    await loadFollowingList();
  };

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
      
      // Fetch user profile from backend
      const fetchUserProfile = async () => {
        try {
          const profile = await userService.getUserProfile(userId);
          
          // Transform backend profile to frontend format
          const transformedUser = {
            id: profile.id,
            username: profile.username || profile.id,
            displayName: profile.display_name || profile.username || profile.id,
            avatar: profile.avatar_url || '',
            verified: profile.is_verified || false,
            followers: profile.followers_count || 0,
            following: profile.following_count || 0,
            likes: profile.likes_count || 0,
            votes: profile.votes_count || 0,
            bio: profile.bio || ''
          };
          
          setViewedUser(transformedUser);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          
          // Fallback to mock data if API fails
          const user = getUserById(userId);
          if (user) {
            setViewedUser(user);
          } else {
            toast({
              title: "Usuario no encontrado",
              description: "El perfil que buscas no existe o no se pudo cargar",
              variant: "destructive"
            });
            navigate('/profile');
          }
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserProfile();
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
  const isOwnProfile = !userId || userId === authUser?.username || userId === authUser?.id;
  
  // Debug logging
  console.log('🔍 PROFILE DEBUG:', {
    userId,
    authUser: authUser?.username,
    authUserId: authUser?.id,
    isOwnProfile,
    viewedUser: viewedUser?.username,
    loading
  });

  // Loading guard - return early if we're still loading user data
  if (loading || (!isOwnProfile && !viewedUser)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando perfil...</p>
        </div>
      </div>
    );
  }
  
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
    verified: authUser?.is_verified || false,
    hasStory: Math.random() > 0.5, // Simulación temporal - luego conectar con backend real
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
    verified: false,
    hasStory: Math.random() > 0.5, // Simulación temporal - luego conectar con backend real
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
  
  // Real mentions - polls where user is actually mentioned in options or poll
  const mentionedPolls = polls.filter(poll => 
    // Check if user is mentioned in the poll itself
    poll.mentioned_users?.includes(displayUser.id) ||
    // Check if user is mentioned in any of the options
    poll.options.some(option => 
      option.mentioned_users?.includes(displayUser.id)
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
    
    // DEBUG: Log data structure
    console.log('🔍 PROFILE DEBUG - Active tab:', activeTab);
    console.log('🔍 PROFILE DEBUG - Poll clicked:', poll);
    console.log('🔍 PROFILE DEBUG - Current polls array length:', currentPolls?.length);
    console.log('🔍 PROFILE DEBUG - Poll index found:', pollIndex);
    
    // Verificar que los datos tienen la estructura correcta
    const validPolls = currentPolls.filter(p => p && p.id && p.authorUser);
    if (validPolls.length !== currentPolls.length) {
      console.warn('⚠️ PROFILE WARNING - Some polls have invalid structure, filtering...');
    }
    
    // Use TikTok context instead of manual state
    setTikTokPolls(validPolls);
    setInitialPollIndex(pollIndex >= 0 ? pollIndex : 0);
    enterTikTokMode(); // This will properly set up TikTok mode with context
  };

  const handleCreatePoll = () => {
    // Exit TikTok mode when user wants to create content
    exitTikTokMode();
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

  const handleProfileUpdate = async (updatedUserData) => {
    // The EditProfileModal already updates the user state via updateUser()
    // This function can be used for any additional UI updates if needed
    console.log('Profile updated successfully:', updatedUserData);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <>
      {/* TikTok mode rendering - same as FeedPage */}
      {isTikTokMode && (
        <>
          <TikTokScrollView
            polls={tikTokPolls}
            onVote={handleVote}
            onLike={handleLike}
            onShare={handleShare}
            onComment={handleComment}
            onSave={handleSave}
            onCreatePoll={handleCreatePoll}
            initialIndex={initialPollIndex}
            onExitTikTok={exitTikTokMode}
            showLogo={false}
          />
        </>
      )}

      {/* Normal profile view - only show when NOT in TikTok mode */}
      {!isTikTokMode && (
        <div className="min-h-screen bg-gray-50">
      {/* ENCABEZADO SUPERIOR OPTIMIZADO MÓVIL - ANCHO COMPLETO */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-2 py-3">
          <div className="flex items-center justify-between">
            {/* Menú hamburguesa (izquierda) */}
            <Button variant="ghost" size="sm" className="hover:bg-gray-100 p-3 active:scale-95 transition-transform min-w-[44px] min-h-[44px]">
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            
            {/* Nombre de usuario + switch de cuentas (centro) */}
            <div className="flex items-center gap-1 sm:gap-2 max-w-[200px] sm:max-w-none">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">@{displayUser.username}</h1>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100 p-2 sm:p-2 active:scale-95 transition-transform min-w-[36px] min-h-[36px]">
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
            
            {/* Ícono de configuración (derecha) */}
            <Button variant="ghost" size="sm" className="hover:bg-gray-100 p-3 active:scale-95 transition-transform min-w-[44px] min-h-[44px]" onClick={handleSettingsClick}>
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL ANCHO COMPLETO - SIN LIMITACIONES */}
      <div className="px-0 sm:px-2 py-4 sm:py-6 space-y-2 sm:space-y-4">
        
        {/* AVATAR + MÉTRICAS EXPANDIDO - USANDO TODO EL ANCHO */}
        <div className="bg-white rounded-none sm:rounded-lg p-2 sm:p-4 shadow-sm mx-0">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            
            {/* LADO IZQUIERDO: Votos y Seguidores */}
            <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Votos con ícono - perfectamente alineado */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Vote className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-600" />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <p className="text-sm sm:text-base font-bold text-gray-900 leading-none">{displayUser.totalVotes || 0}</p>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-none mt-0.5">Votos</p>
                </div>
              </div>
              
              {/* Seguidores con ícono - perfectamente alineado */}
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 transition-colors active:scale-95 -m-1.5"
                onClick={handleFollowersClick}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-green-600" />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <p className="text-sm sm:text-base font-bold text-gray-900 leading-none">{followersCount}</p>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-none mt-0.5">Seguidores</p>
                </div>
              </div>
            </div>

            {/* AVATAR EN EL CENTRO - PERFECTAMENTE CENTRADO */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
              {/* Borde degradado solo si hay historia */}
              {displayUser.hasStory ? (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full p-0.5">
                  <div className="w-full h-full bg-white rounded-full overflow-hidden relative">
                    {isOwnProfile ? (
                      <AvatarUpload
                        currentAvatar={displayUser.avatar}
                        onAvatarUpdate={(result, avatarUrl) => {
                          setViewedUser(prev => ({ ...prev, avatar: avatarUrl }));
                        }}
                        className="w-full h-full"
                        showUploadButton={false}
                      />
                    ) : (
                      <Avatar className="w-full h-full">
                        <AvatarImage 
                          src={displayUser.avatar} 
                          alt={displayUser.username}
                          className="w-full h-full object-cover object-center"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg sm:text-xl md:text-2xl font-bold w-full h-full flex items-center justify-center">
                          {(displayUser.displayName || displayUser.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ) : (
                // Sin borde degradado si no hay historia
                <div className="w-full h-full bg-white rounded-full overflow-hidden relative border-2 border-gray-200">
                  {isOwnProfile ? (
                    <AvatarUpload
                      currentAvatar={displayUser.avatar}
                      onAvatarUpdate={(result, avatarUrl) => {
                        setViewedUser(prev => ({ ...prev, avatar: avatarUrl }));
                      }}
                      className="w-full h-full"
                      showUploadButton={false}
                    />
                  ) : (
                    <Avatar className="w-full h-full">
                      <AvatarImage 
                        src={displayUser.avatar} 
                        alt={displayUser.username}
                        className="w-full h-full object-cover object-center"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg sm:text-xl md:text-2xl font-bold w-full h-full flex items-center justify-center">
                        {(displayUser.displayName || displayUser.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}
              
              {/* Botón de acción "+" centrado en la parte inferior */}
              <button className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 z-10">
                <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white" />
              </button>
            </div>

            {/* LADO DERECHO: Me gusta y Seguidos - perfectamente alineado */}
            <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Me gusta con ícono - alineación derecha perfecta */}
              <div className="flex items-center gap-2 justify-end">
                <div className="flex flex-col justify-center min-w-0 text-right">
                  <p className="text-sm sm:text-base font-bold text-gray-900 leading-none">{displayUser.totalLikes || 0}</p>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-none mt-0.5">Me gusta</p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-red-600" />
                </div>
              </div>
              
              {/* Seguidos con ícono - alineación derecha perfecta */}
              <div 
                className="flex items-center gap-2 justify-end cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 transition-colors active:scale-95 -m-1.5"
                onClick={handleFollowingClick}
              >
                <div className="flex flex-col justify-center min-w-0 text-right">
                  <p className="text-sm sm:text-base font-bold text-gray-900 leading-none">{followingCount}</p>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-none mt-0.5">Seguidos</p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NOMBRE + ROL EXPANDIDO */}
        <div className="bg-white rounded-none sm:rounded-lg p-2 sm:p-4 shadow-sm mx-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            {/* Nombre principal */}
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate flex-shrink-0">
                {displayUser.displayName || displayUser.username}
              </h2>
              {displayUser.verified && (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
            
            {/* Separador y rol */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-px h-4 sm:h-6 bg-gray-300 hidden sm:block"></div>
              <span className="text-gray-400 sm:hidden">•</span>
              <p className="text-xs sm:text-base font-semibold text-gray-600 sm:text-gray-700">
                {isOwnProfile ? "Creador de contenido" : "Usuario activo"}
              </p>
            </div>
          </div>
        </div>

        {/* BIOGRAFÍA EXPANDIDA */}
        <div className="bg-white rounded-none sm:rounded-lg p-2 sm:p-4 shadow-sm mx-0">
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-2">
            {displayUser.bio || "🎯 Creando votaciones épicas | 📊 Fan de las estadísticas | 🚀 Siempre innovando"}
          </p>
          <p className="text-sm sm:text-base text-blue-600 font-medium">@{displayUser.username}</p>
        </div>

        {/* BOTONES DE ACCIÓN EXPANDIDOS - USO COMPLETO DEL ANCHO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mx-0">
          {isOwnProfile ? (
            // Botones para perfil propio
            <>
              <Button 
                variant="outline" 
                className="w-full rounded-full py-3 sm:py-3 text-sm sm:text-base font-semibold bg-gray-100 hover:bg-gray-200 border-gray-300 min-h-[48px] active:scale-95 transition-transform"
                onClick={() => setEditProfileModalOpen(true)}
              >
                Edit profile
              </Button>
              <Button 
                variant="outline" 
                className="w-full rounded-full py-3 sm:py-3 text-sm sm:text-base font-semibold bg-gray-100 hover:bg-gray-200 border-gray-300 min-h-[48px] active:scale-95 transition-transform"
                onClick={() => navigate('/statistics')}
              >
                Statistics
              </Button>
              <Button 
                className="w-full rounded-full py-3 sm:py-3 text-sm sm:text-base font-semibold bg-blue-600 hover:bg-blue-700 min-h-[48px] active:scale-95 transition-transform"
                onClick={() => navigate('/contact')}
              >
                Contact
              </Button>
            </>
          ) : (
            // Botones para perfil ajeno
            <>
              <Button 
                variant="outline" 
                className="w-full rounded-full py-3 sm:py-3 text-sm sm:text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white min-h-[48px] active:scale-95 transition-transform"
                onClick={() => {
                  const targetUserId = viewedUser?.id || userId;
                  if (isFollowing(targetUserId)) {
                    unfollowUser(targetUserId);
                    toast({
                      title: "Dejaste de seguir",
                      description: `Ya no sigues a @${viewedUser?.username || userId}`,
                    });
                  } else {
                    followUser(targetUserId);
                    toast({
                      title: "Siguiendo",
                      description: `Ahora sigues a @${viewedUser?.username || userId}`,
                    });
                  }
                }}
              >
                {isFollowing(viewedUser?.id || userId) ? 'Siguiendo' : 'Seguir'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full rounded-full py-3 sm:py-3 text-sm sm:text-base font-semibold bg-gray-100 hover:bg-gray-200 border-gray-300 min-h-[48px] active:scale-95 transition-transform"
                onClick={() => navigate(`/messages?user=${viewedUser?.username || userId}`)}
              >
                Mensaje
              </Button>
              <Button 
                variant="outline"
                className="w-full rounded-full py-3 sm:py-3 text-sm sm:text-base font-semibold bg-gray-100 hover:bg-gray-200 border-gray-300 min-h-[48px] active:scale-95 transition-transform"
                onClick={() => shareProfile(viewedUser || { username: userId })}
              >
                Compartir
              </Button>
            </>
          )}
        </div>

        {/* TABS EXPANDIDAS - ANCHO COMPLETO */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white rounded-none sm:rounded-lg shadow-sm h-auto p-1 mx-0">
            <TabsTrigger value="polls" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-[48px] active:scale-95 transition-transform">
              <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Publicaciones</span>
              <span className="sm:hidden text-[10px]">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-[48px] active:scale-95 transition-transform">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Me gusta</span>
              <span className="sm:hidden text-[10px]">Likes</span>
            </TabsTrigger>
            <TabsTrigger value="mentions" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-[48px] active:scale-95 transition-transform">
              <AtSign className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Menciones</span>
              <span className="sm:hidden text-[10px]">@</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-[48px] active:scale-95 transition-transform">
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Guardados</span>
              <span className="sm:hidden text-[10px]">Saved</span>
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
              <div className="px-1">
                <TikTokProfileGrid 
                  polls={userPolls} 
                  onPollClick={handlePollClick}
                />
              </div>
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
              <div className="px-1">
                <TikTokProfileGrid 
                  polls={likedPolls} 
                  onPollClick={handlePollClick}
                />
              </div>
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
                <div className="px-1">
                  <TikTokProfileGrid 
                    polls={mentionedPolls} 
                    onPollClick={handlePollClick}
                  />
                </div>
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
                <div className="px-1">
                  <TikTokProfileGrid 
                    polls={savedPolls} 
                    onPollClick={handlePollClick}
                  />
                </div>
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  {followersCount} Seguidores
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFollowersModal(false)}
                className="hover:bg-gray-100 rounded-full"
              >
                ✕
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {followersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : followersList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin seguidores aún</h3>
                  <p className="text-gray-500">Crea contenido increíble para atraer seguidores</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {followersList.map((follower) => (
                    <div key={follower.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={follower.avatar_url} alt={follower.username} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                            {follower.display_name?.charAt(0) || follower.username?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {follower.display_name || follower.username}
                            </h4>
                            {follower.is_verified && (
                              <Check className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">@{follower.username}</p>
                        </div>
                      </div>
                      {follower.id !== authUser?.id && (
                        <Button
                          size="sm"
                          variant={isFollowing(follower.id) ? "outline" : "default"}
                          onClick={() => handleFollowToggle(follower)}
                          className={isFollowing(follower.id) ? 
                            "hover:bg-red-50 hover:text-red-600 hover:border-red-300" : 
                            "bg-blue-600 hover:bg-blue-700"
                          }
                        >
                          {isFollowing(follower.id) ? "Siguiendo" : "Seguir"}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  {followingCount} Siguiendo
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFollowingModal(false)}
                className="hover:bg-gray-100 rounded-full"
              >
                ✕
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {followingLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : followingList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCheck className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No sigues a nadie aún</h3>
                  <p className="text-gray-500">Busca usuarios interesantes para seguir</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {followingList.map((followedUser) => (
                    <div key={followedUser.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={followedUser.avatar_url} alt={followedUser.username} />
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white font-semibold">
                            {followedUser.display_name?.charAt(0) || followedUser.username?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {followedUser.display_name || followedUser.username}
                            </h4>
                            {followedUser.is_verified && (
                              <Check className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">@{followedUser.username}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFollowToggle(followedUser)}
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                      >
                        Siguiendo
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal - Solo para perfil propio */}
      {isOwnProfile && (
        <EditProfileModal
          isOpen={editProfileModalOpen}
          onClose={() => setEditProfileModalOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

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
        </div>
      )}
    </>
  );
};

export default ProfilePage;