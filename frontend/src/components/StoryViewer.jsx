import React, { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, Volume2, VolumeX, ChevronLeft, ChevronRight, User } from 'lucide-react';

const StoryViewer = ({ stories, initialIndex = 0, onClose, onStoryView }) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef(null);
  const audioRef = useRef(null); // Reference for background music

  const currentUser = stories[currentUserIndex];
  const currentStory = currentUser?.stories[currentStoryIndex];
  const totalStories = currentUser?.stories.length || 0;

  // Mark story as viewed when it's displayed
  useEffect(() => {
    if (currentStory && currentStory.id && onStoryView && !currentStory.viewedByMe) {
      onStoryView(currentStory.id);
    }
  }, [currentStory, onStoryView]);

  // Handle background music playback
  useEffect(() => {
    if (!currentStory) return;

    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Play new audio if story has music
    if (currentStory.music && currentStory.music.preview_url) {
      console.log('🎵 Story has music:', currentStory.music);
      
      // Create new audio element
      const audio = new Audio(currentStory.music.preview_url);
      audio.loop = false; // Don't loop, story will advance
      audio.volume = isMuted ? 0 : 1;
      
      // Play audio automatically
      audio.play().catch(error => {
        console.error('Error playing story audio:', error);
      });

      audioRef.current = audio;
    }

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentUserIndex, currentStoryIndex, currentStory]);

  // Handle mute/unmute for background music
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 1;
    }
  }, [isMuted]);

  // Handle pause/play for background music
  useEffect(() => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error resuming story audio:', error);
        });
      }
    }
  }, [isPaused]);

  // Auto-advance story progress
  useEffect(() => {
    if (!currentStory || isPaused) return;

    const duration = 5000; // 5 seconds per story
    const intervalTime = 50; // Update every 50ms
    const increment = (100 / duration) * intervalTime;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentUserIndex, currentStoryIndex, isPaused]);

  const goToNextStory = () => {
    if (currentStoryIndex < totalStories - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else if (currentUserIndex < stories.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goToPreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      const prevUser = stories[currentUserIndex - 1];
      setCurrentUserIndex(currentUserIndex - 1);
      setCurrentStoryIndex(prevUser.stories.length - 1);
      setProgress(0);
    }
  };

  const handleClick = (e) => {
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;
    
    if (clickX < screenWidth / 3) {
      goToPreviousStory();
    } else if (clickX > (screenWidth * 2) / 3) {
      goToNextStory();
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!currentUser || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
        {currentUser.stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{
                width: index === currentStoryIndex 
                  ? `${progress}%` 
                  : index < currentStoryIndex 
                    ? '100%' 
                    : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4 pt-2">
        <div className="flex items-center gap-3">
          {currentUser.userAvatar ? (
            <img
              src={currentUser.userAvatar}
              alt={currentUser.username}
              className="w-10 h-10 rounded-full border-2 border-white object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-10 h-10 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center"
            style={{ display: currentUser.userAvatar ? 'none' : 'flex' }}
          >
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <div className="flex flex-col gap-0 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">{currentUser.username}</span>
              <span className="text-white/70 text-xs">{currentStory.timeAgo}</span>
            </div>
            {/* Music info - only show if story has music */}
            {currentStory.music && currentStory.music.preview_url && (
              <div className="flex items-center gap-1.5 max-w-[200px] overflow-hidden">
                <Volume2 className="w-3 h-3 text-white flex-shrink-0" />
                <span className="text-white text-xs truncate">
                  {currentStory.music.artist || 'Unknown Artist'} • {currentStory.music.title || 'Unknown Song'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mute/Unmute button - only show if story has music */}
          {currentStory.music && currentStory.music.preview_url && (
            <button
              onClick={toggleMute}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          )}
          <button
            onClick={togglePause}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            {isPaused ? (
              <Play className="w-5 h-5 text-white" />
            ) : (
              <Pause className="w-5 h-5 text-white" />
            )}
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onClick={handleClick}
      >
        {currentStory.type === 'image' ? (
          <img
            src={currentStory.url}
            alt="Story"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x600/667eea/ffffff?text=Historia';
            }}
          />
        ) : (
          <video
            src={currentStory.url}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted={isMuted}
            playsInline
          />
        )}
      </div>

      {/* Music info - show at bottom if story has music */}
      {currentStory.music && currentStory.music.preview_url && (
        <div className="absolute bottom-6 left-0 right-0 px-6 z-10">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 max-w-sm mx-auto">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {currentStory.music.title || 'Unknown Song'}
              </p>
              <p className="text-white/70 text-xs truncate">
                {currentStory.music.artist || 'Unknown Artist'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation hints (mobile) */}
      <div className="absolute inset-y-0 left-0 w-1/3 z-[5]" onClick={goToPreviousStory} />
      <div className="absolute inset-y-0 right-0 w-1/3 z-[5]" onClick={goToNextStory} />

      {/* Desktop navigation arrows */}
      <div className="hidden md:block">
        {currentUserIndex > 0 || currentStoryIndex > 0 ? (
          <button
            onClick={goToPreviousStory}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        ) : null}
        
        {currentUserIndex < stories.length - 1 || currentStoryIndex < totalStories - 1 ? (
          <button
            onClick={goToNextStory}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        ) : null}
      </div>

      {/* Story caption/text */}
      {currentStory.caption && (
        <div className="absolute bottom-20 left-0 right-0 px-6">
          <p className="text-white text-center text-lg font-medium drop-shadow-lg">
            {currentStory.caption}
          </p>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
