import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import storyService from '../services/storyService';
import { useAuth } from '../contexts/AuthContext';

const StoriesBar = ({ onStoryClick, onCreateStoryClick, className = '' }) => {
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const { authUser } = useAuth();

  // Group stories by user
  const groupedStories = React.useMemo(() => {
    const grouped = stories.reduce((acc, story) => {
      const userId = story.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user: {
            id: userId,
            username: story.username,
            display_name: story.display_name,
            avatar_url: story.avatar_url,
          },
          stories: [],
          hasUnviewed: false,
        };
      }
      acc[userId].stories.push(story);
      if (!story.is_viewed) {
        acc[userId].hasUnviewed = true;
      }
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => {
      // Sort by: unviewed first, then by latest story
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      
      const aLatest = Math.max(...a.stories.map(s => new Date(s.created_at).getTime()));
      const bLatest = Math.max(...b.stories.map(s => new Date(s.created_at).getTime()));
      
      return bLatest - aLatest;
    });
  }, [stories]);

  const loadStories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await storyService.getStories(100);
      setStories(response || []);
    } catch (error) {
      console.error('Error loading stories:', error);
      toast.error('Error al cargar las historias', {
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handleStoryClick = (userStories, userIndex) => {
    if (onStoryClick) {
      onStoryClick(userStories.stories, 0, userIndex);
    }
  };

  const handleScroll = (direction) => {
    const container = document.getElementById('stories-container');
    if (container) {
      const scrollAmount = 200;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      
      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-4 p-4 ${className}`}>
        {/* Loading skeletons */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 animate-pulse">
          <Plus size={24} className="text-gray-400" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Scroll buttons */}
      {groupedStories.length > 0 && (
        <>
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 
                     bg-white/90 hover:bg-white shadow-lg rounded-full p-1 transition-all"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 
                     bg-white/90 hover:bg-white shadow-lg rounded-full p-1 transition-all"
          >
            <ChevronRight size={20} className="text-gray-700" />
          </button>
        </>
      )}

      {/* Stories container */}
      <div
        id="stories-container"
        className="flex items-center space-x-4 p-4 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Create story button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onCreateStoryClick}
          className="flex-shrink-0 relative w-16 h-16 rounded-full bg-gradient-to-br 
                   from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 
                   border-2 border-gray-300 flex items-center justify-center transition-all duration-200"
        >
          <Plus size={20} className="text-gray-600" />
          
          {/* Your avatar small overlay */}
          {authUser?.avatar_url && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white overflow-hidden">
              <img
                src={authUser.avatar_url}
                alt="Tu avatar"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </motion.button>

        {/* Stories from other users */}
        {groupedStories.map((userStories, index) => (
          <motion.button
            key={userStories.user.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleStoryClick(userStories, index)}
            className="flex-shrink-0 relative"
          >
            {/* Gradient border for unviewed stories */}
            <div className={`w-18 h-18 rounded-full p-0.5 ${
              userStories.hasUnviewed
                ? 'bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600'
                : 'bg-gray-300'
            }`}>
              <div className="w-full h-full bg-white rounded-full p-0.5">
                <img
                  src={userStories.user.avatar_url || '/default-avatar.png'}
                  alt={userStories.user.display_name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            
            {/* Story count badge */}
            {userStories.stories.length > 1 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white 
                           text-xs font-bold rounded-full flex items-center justify-center">
                {userStories.stories.length}
              </div>
            )}
            
            {/* Username */}
            <p className="mt-1 text-xs text-center text-gray-700 font-medium max-w-16 truncate">
              {userStories.user.username}
            </p>
          </motion.button>
        ))}

        {/* Empty state */}
        {groupedStories.length === 0 && !isLoading && (
          <div className="flex items-center justify-center w-full py-8">
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-2">No hay historias disponibles</p>
              <p className="text-gray-400 text-xs">¡Sé el primero en compartir una historia!</p>
            </div>
          </div>
        )}
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default StoriesBar;