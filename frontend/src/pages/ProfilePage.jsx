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
  Settings, Users, Vote, Trophy, Heart, Share, ArrowLeft, AtSign, Bookmark, LayoutDashboard, Check, 
  Share2, UserPlus, UserCheck, Menu, ChevronDown, Plus, BarChart3, Mail, MessageCircle, Send, Hash, Bell, BellOff, UserCircle 
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const { toast } = useToast();
  const { user: authUser, refreshUser } = useAuth();
  const { getUserFollowers, getUserFollowing, followUser, unfollowUser, isFollowing, getFollowStatus, followStateVersion, refreshTrigger, getUserByUsername } = useFollow();
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
      console.log('🔄 LOADING FOLLOW STATS:');
      console.log('  Current Profile User ID (userId):', userId);
      console.log('  Current Auth User ID (authUser?.id):', authUser?.id);
      console.log('  Target User ID (will load stats for):', userId || authUser?.id);
      console.log('  Follow State Version:', followStateVersion);
      console.log('  Refresh Trigger:', refreshTrigger);
      console.log('  Triggered by global follow state change');
      
      if (!authUser?.id && !userId) return;
      
      setFollowStatsLoading(true);
      try {
        const targetUserId = userId || authUser?.id;
        console.log('  📡 Making API calls for user:', targetUserId);
        
        // Load followers and following counts
        const [followersData, followingData] = await Promise.all([
          getUserFollowers(targetUserId),
          getUserFollowing(targetUserId)
        ]);
        
        console.log('  📊 API Results received:');
        console.log('    Followers Data:', followersData);
        console.log('    Following Data:', followingData);
        console.log('    About to set:', {
          followersCount: followersData.total || 0,
          followingCount: followingData.total || 0
        });
        
        setFollowersCount(followersData.total || 0);
        setFollowingCount(followingData.total || 0);
        
        console.log('✅ FOLLOW STATS UPDATED:');
        console.log(`  User ${targetUserId} - Followers: ${followersData.total}, Following: ${followingData.total}`);
        console.log('  Follow State Version:', followStateVersion);
        console.log('  State should now reflect these new values');
      } catch (error) {
        console.error('❌ ERROR loading follow stats:', error);
        // Don't show toast for follow stats errors to avoid spam
        setFollowersCount(0);
        setFollowingCount(0);
      } finally {
        setFollowStatsLoading(false);
      }
    };

    loadFollowStats();
  }, [authUser?.id, userId, getUserFollowers, getUserFollowing, followStateVersion, refreshTrigger]);

  // Load followers list when tab is activated
  const loadFollowersList = async () => {
    if (followersLoading) return;
    
    setFollowersLoading(true);
    try {
      let targetUserId = userId || authUser?.id;
      
      // 🔧 RESOLVER USERNAME A UUID SI ES NECESARIO
      if (userId && !userId.includes('-') && userId.length > 3) {
        console.log('🔄 RESOLVING USERNAME TO UUID:', userId);
        const user = await getUserByUsername(userId);
        if (user?.id) {
          targetUserId = user.id;
          console.log('✅ USERNAME RESOLVED:', userId, '->', targetUserId);
        } else {
          console.log('❌ USERNAME NOT FOUND:', userId);
        }
      }
      
      console.log('🔍 LOADING FOLLOWERS LIST:');
      console.log('  Original userId:', userId);
      console.log('  Resolved Target User ID:', targetUserId);
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
      let targetUserId = userId || authUser?.id;
      
      // 🔧 RESOLVER USERNAME A UUID SI ES NECESARIO
      if (userId && !userId.includes('-') && userId.length > 3) {
        console.log('🔄 RESOLVING USERNAME TO UUID:', userId);
        const user = await getUserByUsername(userId);
        if (user?.id) {
          targetUserId = user.id;
          console.log('✅ USERNAME RESOLVED:', userId, '->', targetUserId);
        } else {
          console.log('❌ USERNAME NOT FOUND:', userId);
        }
      }
      
      console.log('🔍 LOADING FOLLOWING LIST:');
      console.log('  Original userId:', userId);
      console.log('  Resolved Target User ID:', targetUserId);
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
      const isCurrentlyFollowing = isFollowing(user.id);
      
      if (isCurrentlyFollowing) {
        await unfollowUser(user.id);
        toast({
          title: "Dejaste de seguir",
          description: `Ya no sigues a @${user.username}`,
        });
      } else {
        await followUser(user.id);
        toast({
          title: "Siguiendo",
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
      console.error('Error toggling follow status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de seguimiento",
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
            bio: profile.bio || '',
            totalVotes: profile.total_votes || 0,
            totalLikes: profile.likes_count || 0,
            totalShares: 0, // Can be added to backend later
            pollsCreated: profile.total_polls_created || 0,
            totalPolls: profile.total_polls_created || 0
          };
          
          setViewedUser(transformedUser);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Show error message instead of falling back to mock data
          toast({
            title: "Usuario no encontrado",
            description: "El perfil que buscas no existe o no se pudo cargar",
            variant: "destructive"
          });
          navigate('/profile');
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
  const isOwnProfile = !userId || (authUser && (userId === authUser?.username || userId === authUser?.id));
  
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
    bio: authUser?.bio || '',
    occupation: authUser?.occupation || '', // ✅ ADDED: Include occupation field
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
  } : viewedUser; // Use real viewed user data, no fallback to mock data

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
    poll.mentioned_users?.includes(displayUser?.id) ||
    // Check if user is mentioned in any of the options
    poll.options.some(option => 
      option.mentioned_users?.includes(displayUser?.id)
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
    if (!authUser) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para votar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistic update for main polls array
      setPolls(prev => prev.map(poll => {
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

      // Update tikTokPolls if it exists
      setTikTokPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
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

      // Send vote to backend
      await pollService.voteOnPoll(pollId, optionId);
      
      toast({
        title: "¡Voto registrado!",
        description: "Tu voto ha sido contabilizado exitosamente",
      });
      
      // Refresh poll data to get accurate counts
      const updatedPoll = await pollService.refreshPoll(pollId);
      if (updatedPoll) {
        setPolls(prev => prev.map(poll => 
          poll.id === pollId ? updatedPoll : poll
        ));
        setTikTokPolls(prev => prev.map(poll => 
          poll.id === pollId ? updatedPoll : poll
        ));
      }
    } catch (error) {
      console.error('Error voting:', error);
      
      // Revert optimistic update
      setPolls(prev => prev.map(poll => {
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

      setTikTokPolls(prev => prev.map(poll => {
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

  const handleLike = async (pollId) => {
    if (!authUser) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para dar like",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistic update for main polls array
      let wasLiked = false;
      setPolls(prev => prev.map(poll => {
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

      // Update tikTokPolls if it exists
      setTikTokPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            userLiked: !poll.userLiked,
            likes: poll.userLiked ? poll.likes - 1 : poll.likes + 1
          };
        }
        return poll;
      }));

      // Send like to backend
      const result = await pollService.toggleLike(pollId);
      
      // Update with actual server response
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            userLiked: result.liked,
            likes: result.likes
          };
        }
        return poll;
      }));

      setTikTokPolls(prev => prev.map(poll => {
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
        description: result.liked ? "Has dado like a esta votación" : "Ya no te gusta esta votación",
      });
    } catch (error) {
      console.error('Error liking poll:', error);
      
      // Revert optimistic update
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            userLiked: !poll.userLiked,
            likes: poll.userLiked ? poll.likes + 1 : poll.likes - 1
          };
        }
        return poll;
      }));

      setTikTokPolls(prev => prev.map(poll => {
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
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">@{displayUser?.username || 'usuario'}</h1>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100 p-2 sm:p-2 active:scale-95 transition-transform min-w-[36px] min-h-[36px]">
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
            
            {/* Botón dinámico (derecha) - Ajustes para perfil propio, Compartir para perfil ajeno */}
            {isOwnProfile ? (
              <Button variant="ghost" size="sm" className="hover:bg-gray-100 p-3 active:scale-95 transition-transform min-w-[44px] min-h-[44px]" onClick={handleSettingsClick}>
                <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-gray-100 p-3 active:scale-95 transition-transform min-w-[44px] min-h-[44px]" 
                onClick={() => shareProfile(displayUser)}
              >
                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            )}
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
                  <p className="text-sm sm:text-base font-bold text-gray-900 leading-none">{isOwnProfile ? (displayUser?.totalVotes || 0) : (displayUser?.votes || 0)}</p>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-none mt-0.5">Votos</p>
                </div>
              </div>
              
              {/* Seguidores con ícono - perfectamente alineado */}
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 transition-colors active:scale-95 -m-1.5"
                onClick={handleFollowersClick}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-500" />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <p className="text-sm sm:text-base font-bold text-gray-900 leading-none">{isOwnProfile ? followersCount : (displayUser?.followers || 0)}</p>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-none mt-0.5">Seguidores</p>
                </div>
              </div>
            </div>

            {/* AVATAR EN EL CENTRO - PERFECTAMENTE CENTRADO */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
              {/* Borde degradado solo si hay historia */}
              {displayUser?.hasStory ? (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full p-0.5">
                  <div className="w-full h-full bg-white rounded-full overflow-hidden relative">
                    {isOwnProfile ? (
                      <AvatarUpload
                        currentAvatar={displayUser?.avatar}
                        onAvatarUpdate={(result, avatarUrl) => {
                          setViewedUser(prev => ({ ...prev, avatar: avatarUrl }));
                        }}
                        className="w-full h-full"
                        showUploadButton={false}
                      />
                    ) : (
                      <Avatar className="w-full h-full">
                        <AvatarImage 
                          src={displayUser?.avatar} 
                          alt={displayUser?.username || 'Usuario'}
                          className="w-full h-full object-cover object-center"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg sm:text-xl md:text-2xl font-bold w-full h-full flex items-center justify-center">
                          {(displayUser?.displayName || displayUser?.username || 'U').charAt(0).toUpperCase()}
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
                      currentAvatar={displayUser?.avatar}
                      onAvatarUpdate={(result, avatarUrl) => {
                        setViewedUser(prev => ({ ...prev, avatar: avatarUrl }));
                      }}
                      className="w-full h-full"
                      showUploadButton={false}
                    />
                  ) : (
                    <Avatar className="w-full h-full">
                      <AvatarImage 
                        src={displayUser?.avatar} 
                        alt={displayUser?.username || 'Usuario'}
                        className="w-full h-full object-cover object-center"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg sm:text-xl md:text-2xl font-bold w-full h-full flex items-center justify-center">
                        {(displayUser?.displayName || displayUser?.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}
              
              {/* Botón de acción "+" centrado en la parte inferior - Solo para perfil propio */}
              {isOwnProfile && (
                <button className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 z-10">
                  <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white" />
                </button>
              )}
            </div>

            {/* LADO DERECHO: Me gusta y Seguidos - perfectamente alineado */}
            <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Me gusta con ícono - alineación derecha perfecta */}
              <div className="flex items-center gap-2 justify-end">
                <div className="flex flex-col justify-center min-w-0 text-right">
                  <p className="text-sm sm:text-base font-bold text-gray-900 leading-none">{isOwnProfile ? (displayUser?.totalLikes || 0) : (displayUser?.likes || 0)}</p>
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
                  <p className="text-sm sm:text-base font-bold text-gray-900 leading-none">{isOwnProfile ? followingCount : (displayUser?.following || 0)}</p>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-none mt-0.5">Seguidos</p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-neutral-500" />
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
                {displayUser?.displayName || displayUser?.username || 'Usuario'}
              </h2>
              {displayUser?.verified && (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
            
            {/* Separador y rol - Solo mostrar si hay ocupación */}
            {displayUser?.occupation && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-px h-4 sm:h-6 bg-gray-300 hidden sm:block"></div>
                <span className="text-gray-400 sm:hidden">•</span>
                <p className="text-xs sm:text-base font-semibold text-gray-600 sm:text-gray-700">
                  {displayUser.occupation}
                </p>
              </div>
            )}
            
            {/* Solo mostrar "Agregar profesión" en perfil propio cuando no hay ocupación */}
            {isOwnProfile && !displayUser?.occupation && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-px h-4 sm:h-6 bg-gray-300 hidden sm:block"></div>
                <span className="text-gray-400 sm:hidden">•</span>
                <p className="text-xs sm:text-base font-semibold text-gray-400 sm:text-gray-500 cursor-pointer hover:text-gray-600 transition-colors"
                   onClick={() => setEditProfileModalOpen(true)}>
                  Agregar profesión
                </p>
              </div>
            )}
          </div>
        </div>

        {/* BIOGRAFÍA EXPANDIDA */}
        <div className="bg-white rounded-none sm:rounded-lg p-2 sm:p-4 shadow-sm mx-0">
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {displayUser?.bio || (isOwnProfile ? "Agregar biografía..." : "")}
          </p>
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
            // Botones para perfil ajeno - Solo Seguir y Mensaje
            <>
              <Button 
                variant="outline" 
                className={`w-full rounded-full py-3 sm:py-3 text-sm sm:text-base font-semibold text-white min-h-[48px] active:scale-95 transition-transform flex items-center justify-center gap-2 ${
                  isFollowing(viewedUser?.id || userId) 
                    ? 'bg-slate-500 hover:bg-slate-600 text-slate-100' 
                    : 'bg-gray-500 hover:bg-gray-600 text-gray-100'
                }`}
                onClick={async () => {
                  const targetUserId = viewedUser?.id || userId;
                  try {
                    if (isFollowing(targetUserId)) {
                      await unfollowUser(targetUserId);
                      setNotificationsEnabled(false); // Reset notifications cuando se deja de seguir
                      toast({
                        title: "Dejaste de seguir",
                        description: `Ya no sigues a @${viewedUser?.username || userId}`,
                      });
                    } else {
                      await followUser(targetUserId);
                      toast({
                        title: "Siguiendo",
                        description: `Ahora sigues a @${viewedUser?.username || userId}`,
                      });
                    }
                  } catch (error) {
                    console.error('Error toggling follow status:', error);
                    toast({
                      title: "Error",
                      description: "No se pudo actualizar el estado de seguimiento",
                      variant: "destructive",
                    });
                  }
                }}
              >
                {isFollowing(viewedUser?.id || userId) ? (
                  <>
                    <span>Siguiendo</span>
                    <button
                      className="ml-1 p-1 hover:bg-slate-400 rounded-full transition-colors text-slate-600"
                      onClick={(e) => {
                        e.stopPropagation(); // Evitar que se ejecute el onClick del botón principal
                        setNotificationsEnabled(!notificationsEnabled);
                        toast({
                          title: notificationsEnabled ? "Notificaciones desactivadas" : "Notificaciones activadas",
                          description: notificationsEnabled 
                            ? `Ya no recibirás notificaciones de @${viewedUser?.username || userId}`
                            : `Recibirás notificaciones cuando @${viewedUser?.username || userId} publique contenido`,
                        });
                      }}
                    >
                      {notificationsEnabled ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </button>
                  </>
                ) : (
                  'Seguir'
                )}
              </Button>
              <Button 
                variant="outline" 
                className="w-full rounded-full py-3 sm:py-3 text-sm sm:text-base font-semibold bg-gray-100 hover:bg-gray-200 border-gray-300 min-h-[48px] active:scale-95 transition-transform"
                onClick={() => navigate(`/messages?user=${viewedUser?.username || userId}`)}
              >
                Mensaje
              </Button>
              {/* Tercer espacio vacío para mantener grid de 3 columnas */}
              <div></div>
            </>
          )}
        </div>

        {/* TABS EXPANDIDAS - ANCHO COMPLETO */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-4' : 'grid-cols-2'} bg-white rounded-none sm:rounded-lg shadow-sm h-auto p-1 mx-0`}>
            <TabsTrigger value="polls" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-[48px] active:scale-95 transition-transform">
              <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Publicaciones</span>
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="liked" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-[48px] active:scale-95 transition-transform">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              </TabsTrigger>
            )}
            <TabsTrigger value="mentions" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-[48px] active:scale-95 transition-transform">
              <UserCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Menciones</span>
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="saved" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-[48px] active:scale-95 transition-transform">
                <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="polls" className="space-y-6">
            {userPolls.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LayoutDashboard className="w-12 h-12 text-gray-400" />
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

          {isOwnProfile && (
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
          )}

          <TabsContent value="mentions" className="space-y-6">
            {mentionedPolls.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No tienes menciones</h3>
                <p className="text-gray-600 mb-6">Las publicaciones donde seas mencionado aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <UserCircle className="w-5 h-5 text-purple-600" />
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

          {isOwnProfile && (
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
          )}

        </Tabs>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-gray-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  {followersList.length} Seguidores
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
                <UserCheck className="w-6 h-6 text-slate-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  {followingList.length} Siguiendo
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