import React from 'react';
import { Play, Heart, MessageCircle, User, Hash, Music, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const SearchResultsGrid = ({ results = [], onItemClick }) => {
  const navigate = useNavigate();

  const handleItemClick = (result) => {
    // Always call the callback first - SearchPage will handle navigation
    if (onItemClick) {
      onItemClick(result);
    } else {
      // Fallback navigation if no callback provided
      switch (result.type) {
        case 'user':
          navigate(`/profile/${result.username}`);
          break;
        case 'post':
          // Navigate to feed with the specific post ID as URL parameter
          navigate(`/feed?post=${result.id}`);
          break;
        case 'hashtag':
          navigate(`/search?q=${encodeURIComponent(result.hashtag)}&filter=hashtags`);
          break;
        case 'sound':
          navigate(`/audio/${result.id}`);
          break;
        default:
          break;
      }
    }
  };

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
    } catch {
      return '';
    }
  };

  const PostCard = ({ post }) => (
    <div 
      onClick={() => handleItemClick(post)}
      className="relative bg-gray-100 overflow-hidden cursor-pointer group"
      style={{ aspectRatio: '9/16' }}
    >
      {/* Background Image or Video Thumbnail */}
      {(post.image_url || post.thumbnail_url || post.images?.[0]?.url || post.media_url) ? (
        <img 
          src={post.image_url || post.thumbnail_url || post.images?.[0]?.url || post.media_url} 
          alt={post.title || post.content || 'Post'}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 flex items-center justify-center">
          <Play size={24} className="text-white opacity-50" />
        </div>
      )}
      
      {/* Overlay sutil en la parte inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
      
      {/* Metrics en la parte inferior */}
      <div className="absolute bottom-1 left-1 text-white text-xs font-semibold flex items-center space-x-1">
        <Play size={12} className="text-white" fill="currentColor" />
        <span>{post.votes_count || 0}</span>
      </div>
    </div>
  );

  const UserCard = ({ user }) => (
    <div 
      onClick={() => handleItemClick(user)}
      className="relative bg-gray-50 overflow-hidden cursor-pointer group"
      style={{ aspectRatio: '9/16' }}
    >
      {/* Content centrado */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-2 text-center">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-2">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={20} className="text-gray-400" />
          )}
        </div>
        
        {/* Username */}
        <div className="w-full px-1">
          <p className="text-xs font-semibold text-gray-900 truncate">
            {user.display_name || user.username}
          </p>
          <p className="text-[10px] text-gray-500 truncate">
            {user.followers_count || 0} seguidores
          </p>
        </div>
      </div>
    </div>
  );

  const HashtagCard = ({ hashtag }) => (
    <div 
      onClick={() => handleItemClick(hashtag)}
      className="relative bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden cursor-pointer group"
      style={{ aspectRatio: '9/16' }}
    >
      {/* Content centrado */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-2 text-center">
        {/* Hashtag icon */}
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
          <Hash size={16} className="text-blue-600" />
        </div>
        
        {/* Hashtag text */}
        <h3 className="text-xs font-semibold text-gray-900 truncate w-full px-1">
          {hashtag.hashtag}
        </h3>
        
        {/* Post count */}
        <p className="text-[10px] text-gray-500">
          {hashtag.posts_count || 0} posts
        </p>
      </div>
    </div>
  );

  const SoundCard = ({ sound }) => (
    <div 
      onClick={() => handleItemClick(sound)}
      className="relative bg-gradient-to-br from-pink-50 to-purple-50 overflow-hidden cursor-pointer group"
      style={{ aspectRatio: '9/16' }}
    >
      {/* Background */}
      {sound.cover_image && (
        <img 
          src={sound.cover_image} 
          alt={sound.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      {/* Overlay si hay imagen */}
      {sound.cover_image && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      )}
      
      {/* Content centrado */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-2 text-center">
        {/* Music icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
          sound.cover_image ? 'bg-white/20 backdrop-blur-sm' : 'bg-pink-100'
        }`}>
          <Music size={16} className={sound.cover_image ? 'text-white' : 'text-pink-600'} />
        </div>
        
        {/* Sound title */}
        <h3 className={`text-xs font-semibold truncate w-full px-1 ${
          sound.cover_image ? 'text-white' : 'text-gray-900'
        }`}>
          {sound.title}
        </h3>
        
        {/* Duration */}
        <p className={`text-[10px] ${
          sound.cover_image ? 'text-white/75' : 'text-gray-500'
        }`}>
          {sound.duration || 0}s
        </p>
      </div>
    </div>
  );

  // Group results by type for better organization
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-3 gap-1" 
         style={{ 
           maxWidth: '100%'
         }}>
      {results.map((result) => {
        const key = `${result.type}-${result.id}`;
        
        switch (result.type) {
          case 'post':
            return <PostCard key={key} post={result} />;
          case 'user':
            return <UserCard key={key} user={result} />;
          case 'hashtag':
            return <HashtagCard key={key} hashtag={result} />;
          case 'sound':
            return <SoundCard key={key} sound={result} />;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default SearchResultsGrid;