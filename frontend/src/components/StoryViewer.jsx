import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Volume2, VolumeX, Smile } from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker from 'emoji-picker-react';
import storyService from '../services/storyService';
import { useAuth } from '../contexts/AuthContext';

const StoryViewer = ({ stories = [], initialIndex = 0, onClose, onStoryEnd }) => {
  const { user, apiRequest } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const containerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const inputRef = useRef(null);

  const currentStory = stories[currentIndex];
  const storyDuration = currentStory?.duration || 15; // seconds
  
  // Determinar si la historia tiene audio/video para mostrar botón mute
  const hasAudio = currentStory?.story_type === 'video' && currentStory?.content_url;

  // Initialize story state
  useEffect(() => {
    if (currentStory) {
      setProgress(0);
      
      // Mark story as viewed
      markAsViewed(currentStory.id);
    }
  }, [currentIndex, currentStory]);

  // Progress animation
  useEffect(() => {
    if (!isPlaying || !currentStory) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (storyDuration * 10)); // Update every 100ms
        
        if (newProgress >= 100) {
          nextStory();
          return 0;
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, storyDuration]);

  const markAsViewed = async (storyId) => {
    try {
      await storyService.viewStory(storyId);
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  };

  const nextStory = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // End of stories
      if (onStoryEnd) onStoryEnd();
      else onClose();
    }
  }, [currentIndex, stories.length, onClose, onStoryEnd]);

  const previousStory = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  const sendMessageToUser = async () => {
    if (!message.trim() || sendingMessage || !currentStory) return;
    
    setSendingMessage(true);
    const messageContent = message.trim();
    
    try {
      console.log('📤 Sending message to story author:', currentStory.user_id);
      
      const messagePayload = {
        recipient_id: currentStory.user_id,
        content: messageContent
      };
      
      const response = await apiRequest('/api/messages', {
        method: 'POST',
        body: messagePayload
      });

      console.log('✅ Message sent successfully:', response);
      
      // Clear message input
      setMessage('');
      setShowEmojiPicker(false);
      
      // Show success toast
      toast.success('Mensaje enviado', {
        duration: 2000,
      });
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      toast.error('Error al enviar mensaje', {
        duration: 2000,
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsPlaying(false); // Pause on touch
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Check if it's a tap (small movement)
    if (Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50) {
      // Tap on left third = previous, right third = next, middle = play/pause
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      const tapX = touchEndX;
      
      if (tapX < containerWidth / 3) {
        previousStory();
      } else if (tapX > (containerWidth * 2) / 3) {
        nextStory();
      } else {
        togglePlay();
      }
    } else {
      // Swipe gestures
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 50) {
          previousStory();
        } else if (deltaX < -50) {
          nextStory();
        }
      } else {
        // Vertical swipe
        if (deltaY > 100) {
          onClose(); // Swipe down to close
        }
      }
    }
    
    setIsPlaying(true); // Resume playing
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          previousStory();
          break;
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextStory();
          break;
        case 'Escape':
          onClose();
          break;
        case 'l':
        case 'L':
          toggleLike();
          break;
        case 'p':
        case 'P':
          togglePlay();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextStory, previousStory, onClose, toggleLike, togglePlay]);

  if (!currentStory) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 flex space-x-1 z-20">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: index < currentIndex ? '100%' : 
                         index === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-12 left-4 right-4 flex items-center justify-between z-20">
          <div className="flex items-center space-x-3">
            <img
              src={currentStory.avatar_url || '/default-avatar.png'}
              alt={currentStory.display_name}
              className="w-8 h-8 rounded-full object-cover border-2 border-white"
            />
            <div>
              <p className="text-white font-semibold text-sm">
                {currentStory.display_name}
              </p>
              <p className="text-white/70 text-xs">
                {storyService.getStoryRemainingTime(currentStory)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlay}
              className="text-white/80 hover:text-white transition-colors"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/80 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Story content */}
        <div className="relative w-full h-full flex items-center justify-center">
          {currentStory.story_type === 'image' && currentStory.content_url && (
            <img
              src={currentStory.content_url}
              alt="Story content"
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          )}
          
          {currentStory.story_type === 'video' && currentStory.content_url && (
            <video
              src={currentStory.content_url}
              className="max-w-full max-h-full object-contain"
              autoPlay
              muted={isMuted}
              playsInline
              loop
            />
          )}
          
          {currentStory.story_type === 'text' && (
            <div
              className="flex items-center justify-center min-h-screen w-full p-8"
              style={{ backgroundColor: currentStory.background_color }}
            >
              <p
                className="text-center text-2xl font-bold max-w-md leading-relaxed"
                style={{
                  color: currentStory.text_color,
                  fontFamily: currentStory.font_style === 'bold' ? 'Arial Black' :
                             currentStory.font_style === 'script' ? 'Brush Script MT' :
                             'Arial'
                }}
              >
                {currentStory.text_content}
              </p>
            </div>
          )}
          
          {/* Text overlay for image/video stories */}
          {currentStory.text_content && currentStory.story_type !== 'text' && (
            <div className="absolute bottom-24 left-4 right-4">
              <p className="text-white text-lg font-medium text-center bg-black/50 rounded-lg p-3">
                {currentStory.text_content}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute bottom-8 right-4 flex flex-col items-center space-y-4 z-20">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={toggleLike}
            disabled={isLoading}
            className={`p-3 rounded-full transition-all duration-200 ${
              isLiked 
                ? 'bg-red-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
          </motion.button>
          
          {likesCount > 0 && (
            <p className="text-white text-xs font-semibold">
              {likesCount}
            </p>
          )}
          
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleShare}
            className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <Send size={24} />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.8 }}
            className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <MoreHorizontal size={24} />
          </motion.button>
        </div>

        {/* Navigation hints (subtle) */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute left-0 top-0 w-1/3 h-full flex items-center justify-start pl-8">
            <div className="text-white/20 text-6xl font-thin">‹</div>
          </div>
          <div className="absolute right-0 top-0 w-1/3 h-full flex items-center justify-end pr-8">
            <div className="text-white/20 text-6xl font-thin">›</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;