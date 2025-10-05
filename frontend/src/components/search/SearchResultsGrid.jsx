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
      className="relative bg-white rounded-xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
      style={{ aspectRatio: '9/16' }} // Rectangular vertical format like TikTok
    >
      {/* Background Image or Video Thumbnail */}
      {(post.image_url || post.thumbnail_url || post.images?.[0]?.url || post.media_url) ? (
        <img 
          src={post.image_url || post.thumbnail_url || post.images?.[0]?.url || post.media_url} 
          alt={post.title || post.content || 'Post'}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            // Fallback to gradient background if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
      ) : null}
      
      {/* Fallback gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300"
        style={{ display: (post.image_url || post.thumbnail_url || post.images?.[0]?.url || post.media_url) ? 'none' : 'block' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
            <Play size={20} className="text-white ml-0.5" />
          </div>
        </div>
      </div>
      
      {/* Minimal overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
      
      {/* Play button overlay for videos - minimalist style */}
      {(post.video_url || post.image_url) && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play size={16} className="text-gray-800 ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}
      
      {/* Content overlay - minimalist bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        {/* Title - single line only */}
        {post.title && (
          <h3 className="text-sm font-semibold leading-tight mb-1 truncate">
            {post.title}
          </h3>
        )}
        
        {/* Author info - compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {post.author?.avatar ? (
                <img 
                  src={post.author.avatar} 
                  alt={post.author.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={8} />
              )}
            </div>
            <span className="text-xs font-medium truncate">
              {post.author?.username || 'Usuario'}
            </span>
          </div>
          
          {/* Engagement metrics - compact */}
          <div className="flex items-center space-x-2 text-xs flex-shrink-0">
            <div className="flex items-center space-x-1">
              <Heart size={10} />
              <span>{post.votes_count || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle size={10} />
              <span>{post.comments_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Post type indicator */}
      <div className="absolute top-2 right-2">
        <div className="w-6 h-6 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
          {post.video_url ? (
            <Play size={12} className="text-white" fill="currentColor" />
          ) : (
            <div className="w-2 h-2 bg-white rounded-full"></div>
          )}
        </div>
      </div>
    </div>
  );

  const UserCard = ({ user }) => (
    <div 
      onClick={() => handleItemClick(user)}
      className="relative bg-white rounded-xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
      style={{ aspectRatio: '9/16' }} // Consistent rectangular vertical format
    >
      {/* Background - minimalist */}
      <div className="absolute inset-0 bg-gray-50"></div>
      
      {/* Content - centered and clean */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center">
        {/* Avatar - larger and clean */}
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-4 group-hover:scale-105 transition-transform duration-300 ring-2 ring-white shadow-sm">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={24} className="text-gray-400" />
          )}
        </div>
        
        {/* User info - clean typography */}
        <div className="mb-3 w-full">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 text-center truncate max-w-full">
              {user.display_name || user.username}
            </h3>
            {user.verified && (
              <CheckCircle size={12} className="text-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">@{user.username}</p>
        </div>
        
        {/* Followers - clean metric */}
        <div className="mb-4">
          <p className="text-xs text-gray-400">
            {user.followers_count || 0} seguidores
          </p>
        </div>
        
        {/* Follow button - minimalist */}
        {!user.is_following && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle follow
            }}
            className="px-6 py-2 bg-black text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            Seguir
          </button>
        )}
      </div>
    </div>
  );

  const HashtagCard = ({ hashtag }) => (
    <div 
      onClick={() => handleItemClick(hashtag)}
      className="relative bg-white rounded-xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
      style={{ aspectRatio: '9/16' }} // Consistent rectangular vertical format
    >
      {/* Background - clean gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50"></div>
      
      {/* Content - centered and minimal */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center">
        {/* Hashtag icon - clean circle */}
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
          <Hash size={20} className="text-blue-600" />
        </div>
        
        {/* Hashtag - clean typography */}
        <h3 className="text-sm font-semibold mb-2 line-clamp-1 text-gray-900">
          {hashtag.hashtag}
        </h3>
        
        {/* Post count - subtle */}
        <p className="text-xs text-gray-500 mb-4">
          {hashtag.posts_count || 0} publicaciones
        </p>
        
        {/* Trending indicator */}
        <div className="px-3 py-1 bg-blue-100 rounded-full">
          <span className="text-xs font-medium text-blue-700">Trending</span>
        </div>
      </div>
    </div>
  );

  const SoundCard = ({ sound }) => (
    <div 
      onClick={() => handleItemClick(sound)}
      className="relative bg-gradient-to-br from-pink-500 to-red-600 rounded-lg overflow-hidden cursor-pointer group aspect-[3/4] shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Background */}
      {sound.cover_image ? (
        <img 
          src={sound.cover_image} 
          alt={sound.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center text-white">
        {/* Music icon */}
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Music size={28} />
        </div>
        
        {/* Sound info */}
        <h3 className="text-sm font-bold mb-1 line-clamp-2">
          {sound.title}
        </h3>
        
        <p className="text-xs opacity-90 mb-2">
          {sound.author?.username || 'Artista'}
        </p>
        
        <p className="text-xs opacity-75 mb-3">
          {sound.posts_using_count || 0} videos • {sound.duration || 0}s
        </p>
        
        {/* Play button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Handle play
          }}
          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <Play size={16} className="ml-0.5" fill="currentColor" />
        </button>
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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