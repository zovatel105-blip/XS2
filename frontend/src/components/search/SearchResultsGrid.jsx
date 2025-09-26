import React from 'react';
import { Play, Heart, MessageCircle, User, Hash, Music, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const SearchResultsGrid = ({ results = [], onItemClick }) => {
  const navigate = useNavigate();

  const handleItemClick = (result) => {
    if (onItemClick) {
      onItemClick(result);
    }
    
    // Navigate based on result type
    switch (result.type) {
      case 'user':
        navigate(`/profile/${result.username}`);
        break;
      case 'post':
        navigate(`/post/${result.id}`);
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
      className="relative bg-black rounded-lg overflow-hidden cursor-pointer group aspect-[3/4] shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Background Image or Video Thumbnail */}
      {(post.image_url || post.thumbnail_url) ? (
        <img 
          src={post.image_url || post.thumbnail_url} 
          alt={post.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600"></div>
      )}
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300"></div>
      
      {/* Play button overlay for videos */}
      {(post.video_url || post.image_url) && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play size={24} className="text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-3 text-white">
        {/* Title and content */}
        <div className="mb-3">
          {post.title && (
            <h3 className="text-sm font-bold leading-tight mb-1 line-clamp-2 drop-shadow-lg">
              {post.title}
            </h3>
          )}
          {post.content && post.content.trim() && (
            <p className="text-xs leading-tight line-clamp-2 opacity-90 drop-shadow-md">
              {post.content}
            </p>
          )}
        </div>
        
        {/* Author and date */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              {post.author?.avatar ? (
                <img 
                  src={post.author.avatar} 
                  alt={post.author.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={12} />
              )}
            </div>
            <span className="text-xs font-medium drop-shadow-md">
              {post.author?.username || 'Usuario'}
            </span>
          </div>
          
          {post.created_at && (
            <span className="text-xs opacity-75 drop-shadow-md">
              {formatTimeAgo(post.created_at)}
            </span>
          )}
        </div>
        
        {/* Hashtags */}
        {(post.hashtags && post.hashtags.length > 0) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.hashtags.slice(0, 3).map((hashtag, index) => (
              <span key={index} className="text-xs font-medium opacity-90 drop-shadow-md">
                #{hashtag}
              </span>
            ))}
            {post.hashtags.length > 3 && (
              <span className="text-xs opacity-75">+{post.hashtags.length - 3}</span>
            )}
          </div>
        )}
        
        {/* Engagement metrics */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <Heart size={12} className="drop-shadow-sm" />
            <span className="drop-shadow-md">{post.votes_count || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle size={12} className="drop-shadow-sm" />
            <span className="drop-shadow-md">{post.comments_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const UserCard = ({ user }) => (
    <div 
      onClick={() => handleItemClick(user)}
      className="relative bg-white rounded-lg overflow-hidden cursor-pointer group aspect-[3/4] shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden mb-3 group-hover:scale-110 transition-transform duration-300">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={32} />
          )}
        </div>
        
        {/* User info */}
        <div className="mb-2">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <h3 className="text-sm font-bold text-gray-900 text-center line-clamp-1">
              {user.display_name || user.username}
            </h3>
            {user.verified && (
              <CheckCircle size={14} className="text-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-500">@{user.username}</p>
        </div>
        
        {/* Bio */}
        {user.bio && (
          <p className="text-xs text-gray-600 text-center line-clamp-2 mb-3">
            {user.bio}
          </p>
        )}
        
        {/* Followers */}
        <p className="text-xs text-gray-500 mb-3">
          {user.followers_count || 0} seguidores
        </p>
        
        {/* Follow button */}
        {!user.is_following && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle follow
            }}
            className="px-4 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-colors"
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
      className="relative bg-gradient-to-br from-green-500 to-blue-600 rounded-lg overflow-hidden cursor-pointer group aspect-[3/4] shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center text-white">
        {/* Hashtag icon */}
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Hash size={28} />
        </div>
        
        {/* Hashtag */}
        <h3 className="text-lg font-bold mb-2 line-clamp-1">
          {hashtag.hashtag}
        </h3>
        
        {/* Post count */}
        <p className="text-sm opacity-90 mb-4">
          {hashtag.posts_count || 0} publicaciones
        </p>
        
        {/* Recent posts preview */}
        {hashtag.recent_posts && hashtag.recent_posts.length > 0 && (
          <div className="flex space-x-1 justify-center">
            {hashtag.recent_posts.slice(0, 3).map((post, index) => (
              post.image_url && (
                <div key={index} className="w-8 h-8 rounded bg-white/20 overflow-hidden">
                  <img
                    src={post.image_url}
                    alt="Recent post"
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            ))}
          </div>
        )}
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
      {results.map((result, index) => {
        const key = `${result.type}-${result.id}-${index}`;
        
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