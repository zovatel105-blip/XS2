/**
 * FastFeedPost - Optimized post component with lazy loading
 * Handles videos, images, and content efficiently
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Play, Volume2, VolumeX } from 'lucide-react';

const FastFeedPost = ({ 
  post, 
  isVisible = false, 
  onLoadDetails, 
  onVote, 
  onLike, 
  onSave,
  isLightweight = false 
}) => {
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const observerRef = useRef(null);

  // Lazy load details when post becomes visible
  useEffect(() => {
    if (isVisible && isLightweight && !detailsLoaded && onLoadDetails) {
      const loadDetails = async () => {
        try {
          await onLoadDetails(post.id);
          setDetailsLoaded(true);
        } catch (error) {
          console.error('Failed to load post details:', error);
        }
      };
      
      // Delay to avoid loading all at once
      const timer = setTimeout(loadDetails, 200);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isLightweight, detailsLoaded, post.id, onLoadDetails]);

  // Video playback management
  useEffect(() => {
    if (videoRef.current && isVisible) {
      if (isPlaying) {
        videoRef.current.play().catch(console.warn);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isVisible]);

  // Auto-pause when not visible
  useEffect(() => {
    if (!isVisible && isPlaying) {
      setIsPlaying(false);
    }
  }, [isVisible, isPlaying]);

  // Intersection Observer for lazy loading media
  useEffect(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !mediaLoaded) {
            setMediaLoaded(true);
          }
        },
        { threshold: 0.1 }
      );
    }

    const currentRef = videoRef.current;
    if (currentRef) {
      observerRef.current.observe(currentRef);
    }

    return () => {
      if (currentRef && observerRef.current) {
        observerRef.current.unobserve(currentRef);
      }
    };
  }, [mediaLoaded]);

  // Render loading skeleton for lightweight posts
  const renderSkeleton = () => (
    <div className="bg-black text-white p-4 animate-pulse">
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 bg-gray-600 rounded-full mr-3"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-600 rounded mb-2 w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
      <div className="h-6 bg-gray-600 rounded mb-4 w-full"></div>
      <div className="h-40 bg-gray-700 rounded mb-4"></div>
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-600 rounded"></div>
              <div className="w-8 h-4 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Get the appropriate data source
  const postData = useMemo(() => {
    if (isLightweight && !detailsLoaded) {
      return {
        ...post,
        options: post.preview_option ? [post.preview_option] : [],
        limited: true
      };
    }
    return post;
  }, [post, isLightweight, detailsLoaded]);

  // Handle media type detection
  const getMediaType = (option) => {
    if (!option || !option.media_url) return 'text';
    
    const url = option.media_url.toLowerCase();
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || option.media_type === 'video') {
      return 'video';
    }
    if (url.includes('.jpg') || url.includes('.png') || url.includes('.gif') || option.media_type === 'image') {
      return 'image';
    }
    return 'text';
  };

  // Render media with lazy loading
  const renderMedia = (option, index) => {
    const mediaType = getMediaType(option);
    
    if (!mediaLoaded) {
      return (
        <div className="w-full h-40 bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-gray-400">
            {mediaType === 'video' ? '📹' : '🖼️'} Loading...
          </div>
        </div>
      );
    }

    switch (mediaType) {
      case 'video':
        return (
          <div className="relative w-full h-40 bg-black rounded-lg overflow-hidden group">
            <video
              ref={index === 0 ? videoRef : null}
              className="w-full h-full object-cover"
              muted={isMuted}
              loop
              playsInline
              poster={option.thumbnail_url}
              onLoadedData={() => setMediaLoaded(true)}
            >
              <source src={option.media_url} type="video/mp4" />
            </video>
            
            {/* Video Controls Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white"
              >
                {isPlaying ? <Volume2 size={24} /> : <Play size={24} />}
              </button>
            </div>
            
            {/* Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        );

      case 'image':
        return (
          <div className="w-full h-40 bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={option.media_url}
              alt={option.text}
              className="w-full h-full object-cover"
              loading="lazy"
              onLoad={() => setMediaLoaded(true)}
              onError={(e) => {
                e.target.src = '/placeholder.jpg';
                setMediaLoaded(true);
              }}
            />
          </div>
        );

      default:
        return (
          <div className="w-full p-4 bg-gray-800 rounded-lg">
            <p className="text-white text-center">{option.text}</p>
          </div>
        );
    }
  };

  // Show skeleton for lightweight posts that haven't loaded details
  if (isLightweight && !detailsLoaded) {
    return renderSkeleton();
  }

  // Render full post
  return (
    <div className="bg-black text-white p-4 min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center mb-4">
        <img
          src={postData.author?.avatar_url || '/default-avatar.jpg'}
          alt={postData.author?.username}
          className="w-10 h-10 rounded-full mr-3"
          loading="lazy"
        />
        <div className="flex-1">
          <p className="font-semibold">{postData.author?.display_name || postData.author?.username}</p>
          <p className="text-gray-400 text-sm">@{postData.author?.username}</p>
        </div>
        {postData.author?.is_verified && (
          <span className="text-blue-400 ml-2">✓</span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-lg font-bold mb-4">{postData.title}</h2>

      {/* Options */}
      <div className="flex-1 space-y-4 mb-6">
        {postData.options?.map((option, index) => (
          <div
            key={option.id || index}
            className="border border-gray-600 rounded-lg overflow-hidden cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => onVote && onVote(postData.id, option.id)}
          >
            {/* Media */}
            {option.media_url && renderMedia(option, index)}
            
            {/* Option Text */}
            {option.text && (
              <div className="p-3">
                <p className="text-white">{option.text}</p>
              </div>
            )}
            
            {/* Vote Count */}
            <div className="p-2 bg-gray-900">
              <span className="text-sm text-gray-400">
                {option.votes || 0} votos
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center py-4 border-t border-gray-800">
        <div className="flex space-x-6">
          <button
            onClick={() => onLike && onLike(postData.id)}
            className={`flex items-center space-x-2 ${
              postData.userLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            } transition-colors`}
          >
            <Heart size={20} fill={postData.userLiked ? 'currentColor' : 'none'} />
            <span className="text-sm">{postData.likes_count || 0}</span>
          </button>

          <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <MessageCircle size={20} />
            <span className="text-sm">{postData.comments_count || 0}</span>
          </button>

          <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <Share2 size={20} />
          </button>
        </div>

        <button
          onClick={() => onSave && onSave(postData.id)}
          className="text-gray-400 hover:text-yellow-500 transition-colors"
        >
          <Bookmark size={20} fill={postData.userSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Limited Mode Indicator */}
      {postData.limited && (
        <div className="text-xs text-gray-500 text-center mt-2">
          ⚡ Preview mode - Full details loading...
        </div>
      )}
    </div>
  );
};

export default React.memo(FastFeedPost);