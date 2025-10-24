import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const StoriesViewer = ({ storiesGroups, onClose, initialUserIndex = 0 }) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentGroup = storiesGroups[currentUserIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  // Auto advance story
  useEffect(() => {
    if (!currentStory) return;

    const duration = 5000; // 5 seconds per story
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);

      if (elapsed >= duration) {
        nextStory();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentUserIndex, currentStoryIndex]);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.viewed_by_me) {
      markAsViewed(currentStory.id);
    }
  }, [currentStory]);

  const markAsViewed = async (storyId) => {
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      await fetch(`${backendUrl}/api/stories/${storyId}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  };

  const nextStory = () => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      nextUser();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    } else {
      prevUser();
    }
  };

  const nextUser = () => {
    if (currentUserIndex < storiesGroups.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prevUser = () => {
    if (currentUserIndex > 0) {
      setCurrentUserIndex(currentUserIndex - 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-2 px-2">
        <div className="flex gap-1">
          {currentGroup.stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all"
                style={{
                  width: index < currentStoryIndex ? '100%' : 
                         index === currentStoryIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-4 px-4">
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <img
              src={currentGroup.user.profile_picture || '/default-avatar.png'}
              alt={currentGroup.user.username}
              className="w-8 h-8 rounded-full border-2 border-white"
            />
            <span className="text-white font-semibold text-sm">
              {currentGroup.user.username}
            </span>
            <span className="text-white/60 text-xs">
              {new Date(currentStory.created_at).toLocaleTimeString('es', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Story content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {currentStory.media_type === 'image' ? (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            src={currentStory.media_url}
            className="w-full h-full object-contain"
            autoPlay
            muted
          />
        )}
      </div>

      {/* Navigation areas */}
      <div className="absolute inset-0 flex">
        <button
          onClick={prevStory}
          className="flex-1 cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        />
        <button
          onClick={nextStory}
          className="flex-1 cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        />
      </div>

      {/* Navigation arrows for desktop */}
      {currentUserIndex > 0 && (
        <button
          onClick={prevUser}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm items-center justify-center hover:bg-black/70 transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      {currentUserIndex < storiesGroups.length - 1 && (
        <button
          onClick={nextUser}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm items-center justify-center hover:bg-black/70 transition-all"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
};

export default StoriesViewer;
