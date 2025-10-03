import React from 'react';
import { User, Hash, Music, Play, Heart, MessageCircle, Share, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/use-toast';

const SearchResultItem = ({ result, onItemClick }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleClick = () => {
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

  const handleFollowClick = (e) => {
    e.stopPropagation();
    toast({
      title: "Follow functionality",
      description: "Following system will be implemented here"
    });
  };

  // Render user result
  if (result.type === 'user') {
    return (
      <div 
        onClick={handleClick}
        className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
      >
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden">
            {result.avatar ? (
              <img src={result.avatar} alt={result.username} className="w-full h-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </div>
        </div>
        
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {result.display_name || result.username}
            </p>
            {result.verified && (
              <CheckCircle size={16} className="text-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">@{result.username}</p>
          {result.bio && (
            <p className="text-xs text-gray-400 truncate mt-1">{result.bio}</p>
          )}
          <p className="text-xs text-gray-400">
            {result.followers_count} seguidores
          </p>
        </div>
        
        <div className="ml-3 flex-shrink-0">
          {!result.is_following && (
            <button
              onClick={handleFollowClick}
              className="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-colors"
            >
              Seguir
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render post result
  if (result.type === 'post') {
    return (
      <div 
        onClick={handleClick}
        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
      >
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
              {result.author?.avatar ? (
                <img src={result.author.avatar} alt={result.author.username} className="w-full h-full object-cover" />
              ) : (
                <User size={16} />
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {result.author?.display_name || result.author?.username}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-500">Post</span>
            </div>
            
            {result.title && (
              <h3 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2">
                {result.title}
              </h3>
            )}
            
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {result.content}
            </p>
            
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center space-x-1">
                <Heart size={12} />
                <span>{result.votes_count || 0}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MessageCircle size={12} />
                <span>{result.comments_count || 0}</span>
              </span>
            </div>
          </div>
          
          {result.image_url && (
            <div className="flex-shrink-0">
              <img 
                src={result.image_url} 
                alt="Post thumbnail"
                className="w-16 h-16 rounded-lg object-cover"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render hashtag result
  if (result.type === 'hashtag') {
    return (
      <div 
        onClick={handleClick}
        className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
      >
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white">
            <Hash size={20} />
          </div>
        </div>
        
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{result.hashtag}</p>
          <p className="text-sm text-gray-500">
            {result.posts_count} publicaciones
          </p>
          
          {result.recent_posts && result.recent_posts.length > 0 && (
            <div className="flex space-x-2 mt-2">
              {result.recent_posts.slice(0, 3).map((post, index) => (
                post.image_url && (
                  <img
                    key={post.id || `post-${index}`}
                    src={post.image_url}
                    alt="Recent post"
                    className="w-8 h-8 rounded object-cover"
                  />
                )
              ))}
            </div>
          )}
        </div>
        
        <div className="ml-3 flex-shrink-0">
          <span className="text-xs text-gray-400">Hashtag</span>
        </div>
      </div>
    );
  }

  // Render sound result
  if (result.type === 'sound') {
    return (
      <div 
        onClick={handleClick}
        className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
      >
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-white overflow-hidden">
            {result.cover_image ? (
              <img src={result.cover_image} alt={result.title} className="w-full h-full object-cover" />
            ) : (
              <Music size={20} />
            )}
          </div>
        </div>
        
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{result.title}</p>
          <p className="text-sm text-gray-500 truncate">
            {result.author?.display_name || result.author?.username}
          </p>
          {result.description && (
            <p className="text-xs text-gray-400 truncate mt-1">{result.description}</p>
          )}
          <p className="text-xs text-gray-400">
            {result.posts_using_count} videos • {result.duration}s
          </p>
        </div>
        
        <div className="ml-3 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast({
                title: "🎵 Reproduciendo...",
                description: result.title
              });
            }}
            className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
          >
            <Play size={16} className="text-gray-700 ml-0.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default SearchResultItem;