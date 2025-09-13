import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, MessageCircle, Share, MoreHorizontal, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FollowingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef(null);

  // Mock data for following posts - replace with actual API call
  const mockFollowingPosts = [
    {
      id: '1',
      user: {
        id: 'user1',
        username: 'maria_art',
        display_name: 'María García',
        avatar_url: 'https://via.placeholder.com/150',
        is_verified: true
      },
      title: '¿Cuál prefieres para mi próximo dibujo?',
      description: 'Decidiendo entre estos dos estilos para mi nueva ilustración 🎨 #arte #dibujo',
      options: [
        {
          id: 'opt1',
          text: 'Estilo realista',
          media: {
            type: 'image',
            url: 'https://via.placeholder.com/400x700/FF6B6B/white?text=Estilo+Realista',
            thumbnail: 'https://via.placeholder.com/200x350/FF6B6B/white?text=Realista'
          },
          votes: 1250,
          hasVoted: false
        },
        {
          id: 'opt2', 
          text: 'Estilo cartoon',
          media: {
            type: 'image',
            url: 'https://via.placeholder.com/400x700/4ECDC4/white?text=Estilo+Cartoon',
            thumbnail: 'https://via.placeholder.com/200x350/4ECDC4/white?text=Cartoon'
          },
          votes: 980,
          hasVoted: false
        }
      ],
      totalVotes: 2230,
      likes: 12400,
      isLiked: false,
      commentsCount: 89,
      sharesCount: 156,
      createdAt: '2h',
      music: {
        name: 'Creative Vibes',
        artist: 'LoFi Sounds'
      }
    },
    {
      id: '2',
      user: {
        id: 'user2',
        username: 'chef_carlos',
        display_name: 'Carlos Cocina',
        avatar_url: 'https://via.placeholder.com/150',
        is_verified: false
      },
      title: '¿Qué receta quieren que haga mañana?',
      description: 'Domingo de cocina en vivo! Ustedes deciden 👨‍🍳 #cocina #domingo',
      options: [
        {
          id: 'opt3',
          text: 'Pasta carbonara',
          media: {
            type: 'image',
            url: 'https://via.placeholder.com/400x700/FFE66D/black?text=Pasta+Carbonara',
            thumbnail: 'https://via.placeholder.com/200x350/FFE66D/black?text=Pasta'
          },
          votes: 850,
          hasVoted: true
        },
        {
          id: 'opt4',
          text: 'Tacos al pastor',
          media: {
            type: 'image', 
            url: 'https://via.placeholder.com/400x700/FF8B94/white?text=Tacos+Pastor',
            thumbnail: 'https://via.placeholder.com/200x350/FF8B94/white?text=Tacos'
          },
          votes: 1100,
          hasVoted: false
        }
      ],
      totalVotes: 1950,
      likes: 8900,
      isLiked: true,
      commentsCount: 234,
      sharesCount: 67,
      createdAt: '4h',
      music: {
        name: 'Kitchen Beats',
        artist: 'Chef Music'
      }
    },
    {
      id: '3',
      user: {
        id: 'user3',
        username: 'fitness_ana',
        display_name: 'Ana Fitness',
        avatar_url: 'https://via.placeholder.com/150', 
        is_verified: true
      },
      title: '¿Cuál rutina haremos hoy?',
      description: 'Lunes de energía! ¿Con cuál empezamos? 💪 #fitness #lunes',
      options: [
        {
          id: 'opt5',
          text: 'Cardio intenso',
          media: {
            type: 'image',
            url: 'https://via.placeholder.com/400x700/A8E6CF/black?text=Cardio+Intenso',
            thumbnail: 'https://via.placeholder.com/200x350/A8E6CF/black?text=Cardio'
          },
          votes: 2100,
          hasVoted: false
        },
        {
          id: 'opt6',
          text: 'Fuerza y resistencia',
          media: {
            type: 'image',
            url: 'https://via.placeholder.com/400x700/C7CEEA/black?text=Fuerza+Resistencia',
            thumbnail: 'https://via.placeholder.com/200x350/C7CEEA/black?text=Fuerza'
          },
          votes: 1800,
          hasVoted: false
        }
      ],
      totalVotes: 3900,
      likes: 15600,
      isLiked: false,
      commentsCount: 445,
      sharesCount: 289,
      createdAt: '1h',
      music: {
        name: 'Workout Energy',
        artist: 'Fitness Beats'
      }
    }
  ];

  useEffect(() => {
    // Simulate loading following posts
    setLoading(true);
    setTimeout(() => {
      setPosts(mockFollowingPosts);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const windowHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / windowHeight);
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
        setCurrentIndex(newIndex);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentIndex, posts.length]);

  const handleVote = (postId, optionId) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          options: post.options.map(option => ({
            ...option,
            hasVoted: option.id === optionId,
            votes: option.id === optionId ? option.votes + 1 : 
                   (option.hasVoted ? option.votes - 1 : option.votes)
          }))
        };
      }
      return post;
    }));
  };

  const handleLike = (postId) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Cargando Following...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center space-x-4">
            <h1 className="text-white text-lg font-semibold">Following</h1>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Posts Container */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {posts.map((post, index) => (
          <div key={post.id} className="h-full w-full snap-start relative flex">
            {/* Main Content - Poll Options */}
            <div className="flex-1 flex">
              {post.options.map((option, optionIndex) => (
                <div 
                  key={option.id}
                  className="flex-1 relative cursor-pointer group"
                  onClick={() => handleVote(post.id, option.id)}
                >
                  {/* Option Image/Video */}
                  <div className="absolute inset-0">
                    <img 
                      src={option.media.url}
                      alt={option.text}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                    
                    {/* Vote indicator */}
                    {option.hasVoted && (
                      <div className="absolute inset-0 bg-blue-500/20 border-4 border-blue-500">
                        <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          ✓ Votaste aquí
                        </div>
                      </div>
                    )}
                    
                    {/* Option text and votes */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-white font-semibold text-lg mb-1">{option.text}</p>
                        <p className="text-white/80 text-sm">{formatNumber(option.votes)} votos</p>
                      </div>
                    </div>
                    
                    {/* Divider line */}
                    {optionIndex === 0 && (
                      <div className="absolute top-0 bottom-0 right-0 w-px bg-white/20" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Sidebar */}
            <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-6 z-10">
              {/* User Avatar */}
              <div className="relative">
                <button className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                  <img 
                    src={post.user.avatar_url} 
                    alt={post.user.username}
                    className="w-full h-full object-cover"
                  />
                </button>
                {post.user.is_verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>

              {/* Like button */}
              <button
                onClick={() => handleLike(post.id)}
                className="flex flex-col items-center space-y-1 group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  post.isLiked ? 'bg-red-500' : 'bg-black/50 backdrop-blur-sm group-hover:bg-black/70'
                }`}>
                  <Heart className={`w-6 h-6 ${post.isLiked ? 'text-white fill-current' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs font-medium">{formatNumber(post.likes)}</span>
              </button>

              {/* Comment button */}
              <button className="flex flex-col items-center space-y-1 group">
                <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/70 transition-colors">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">{formatNumber(post.commentsCount)}</span>
              </button>

              {/* Share button */}
              <button className="flex flex-col items-center space-y-1 group">
                <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/70 transition-colors">
                  <Share className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">{formatNumber(post.sharesCount)}</span>
              </button>

              {/* More options */}
              <button className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
                <MoreHorizontal className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-20 p-4 z-10">
              <div className="space-y-3">
                {/* User info */}
                <div className="flex items-center space-x-3">
                  <span className="text-white font-semibold">@{post.user.username}</span>
                  <span className="text-white/60 text-sm">{post.createdAt}</span>
                </div>

                {/* Post title */}
                <h2 className="text-white text-xl font-bold leading-tight">{post.title}</h2>
                
                {/* Description */}
                <p className="text-white/90 text-sm leading-relaxed">{post.description}</p>

                {/* Music info */}
                {post.music && (
                  <div className="flex items-center space-x-2 text-white/80 text-sm">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center animate-spin">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span>♪ {post.music.name} - {post.music.artist}</span>
                  </div>
                )}

                {/* Vote count */}
                <div className="text-white/60 text-sm">
                  {formatNumber(post.totalVotes)} votos totales
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20">
        <div className="flex flex-col space-y-1">
          {posts.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-8 rounded-full transition-all ${
                index === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FollowingPage;