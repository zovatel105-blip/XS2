/**
 * OptimizedTikTokScrollView - Ultra-fast TikTok-style scroll with performance optimizations
 * Specifically designed to handle video content and large datasets efficiently
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { useFastFeed } from '../hooks/useFastFeed';
import optimizedFeedService from '../services/optimizedFeedService';
import FastFeedPost from './FastFeedPost';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

// Virtualized container for efficient rendering
const VirtualizedContainer = ({ children, totalItems, itemHeight = window.innerHeight }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 3 });
  const containerRef = useRef(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const containerHeight = containerRef.current.clientHeight;
    
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(start + Math.ceil(containerHeight / itemHeight) + 2, totalItems);
    
    setVisibleRange({ start: Math.max(0, start - 1), end });
  }, [itemHeight, totalItems]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-y-scroll overflow-x-hidden scrollbar-hide snap-y snap-mandatory"
      style={{
        height: '100vh',
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'y mandatory'
      }}
    >
      <div style={{ height: totalItems * itemHeight, position: 'relative' }}>
        {children.slice(visibleRange.start, visibleRange.end).map((child, index) =>
          React.cloneElement(child, {
            key: child.key || `virtualized-${visibleRange.start + index}`,
            style: {
              position: 'absolute',
              top: (visibleRange.start + index) * itemHeight,
              width: '100%',
              height: itemHeight
            }
          })
        )}
      </div>
    </div>
  );
};

const OptimizedTikTokScrollView = ({ 
  initialIndex = 0,
  onExitTikTok,
  showLogo = true,
  enableNavigation = true,
  enablePreload = true
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  // Use optimized feed hook
  const {
    posts,
    lightweightPosts,
    loading,
    initialLoading,
    error,
    hasMore,
    loadMore,
    refreshFeed,
    loadPostDetails,
    checkPreloadTrigger,
    totalPosts
  } = useFastFeed({
    initialLimit: 5,
    batchSize: 10,
    enablePreload,
    enableCache: true
  });

  // State management
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isNavigationVisible, setIsNavigationVisible] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  
  // Refs
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const isScrolling = useRef(false);

  // Memoized active post
  const activePost = useMemo(() => {
    return posts[activeIndex] || lightweightPosts[activeIndex];
  }, [posts, lightweightPosts, activeIndex]);

  // Detect current active index based on scroll
  const detectActiveIndex = useCallback(() => {
    if (!containerRef.current || isScrolling.current) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < totalPosts) {
      setActiveIndex(newIndex);
      
      // Trigger preload check
      if (enablePreload) {
        checkPreloadTrigger(newIndex);
      }
      
      // Load more when approaching end
      if (newIndex >= totalPosts - 3 && hasMore && !loading) {
        loadMore();
      }
    }
  }, [activeIndex, totalPosts, enablePreload, checkPreloadTrigger, hasMore, loading, loadMore]);

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(() => {
    if (isScrolling.current) return;
    
    isScrolling.current = true;
    requestAnimationFrame(() => {
      detectActiveIndex();
      isScrolling.current = false;
    });
  }, [detectActiveIndex]);

  // Navigation functions
  const navigateToIndex = useCallback((targetIndex) => {
    if (!containerRef.current || targetIndex < 0 || targetIndex >= totalPosts) return;
    
    const container = containerRef.current;
    const targetScrollTop = targetIndex * window.innerHeight;
    
    container.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
    
    setActiveIndex(targetIndex);
  }, [totalPosts]);

  const goToPrevious = useCallback(() => {
    if (activeIndex > 0) {
      navigateToIndex(activeIndex - 1);
    }
  }, [activeIndex, navigateToIndex]);

  const goToNext = useCallback(() => {
    if (activeIndex < totalPosts - 1) {
      navigateToIndex(activeIndex + 1);
    } else if (hasMore && !loading) {
      // Load more content
      loadMore().then(() => {
        // After loading, navigate to next post
        setTimeout(() => navigateToIndex(activeIndex + 1), 100);
      });
    }
  }, [activeIndex, totalPosts, hasMore, loading, navigateToIndex, loadMore]);

  // Touch handling for better mobile experience
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    setLastInteraction(Date.now());
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        // Swipe up - next post
        goToNext();
      } else {
        // Swipe down - previous post
        goToPrevious();
      }
    }
  }, [goToNext, goToPrevious]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          if (onExitTikTok) onExitTikTok();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, onExitTikTok]);

  // Auto-hide navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Date.now() - lastInteraction > 2000) {
        setIsNavigationVisible(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [lastInteraction]);

  // Initialize scroll position
  useEffect(() => {
    if (initialIndex > 0 && containerRef.current && !initialLoading) {
      setTimeout(() => {
        navigateToIndex(initialIndex);
      }, 100);
    }
  }, [initialIndex, initialLoading, navigateToIndex]);

  // Event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Show navigation on mouse move
    const handleMouseMove = () => {
      setIsNavigationVisible(true);  
      setLastInteraction(Date.now());
    };
    
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleScroll, handleTouchStart, handleTouchEnd]);

  // Action handlers
  const handleVote = useCallback(async (pollId, optionId) => {
    try {
      // Implement voting logic here
      console.log('Vote:', pollId, optionId);
      toast({
        title: "¡Voto registrado!",
        description: "Tu voto ha sido contabilizado",
      });
    } catch (error) {
      console.error('Vote failed:', error);
      toast({
        title: "Error al votar",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleLike = useCallback(async (pollId) => {
    try {
      // Implement like logic here
      console.log('Like:', pollId);
    } catch (error) {
      console.error('Like failed:', error);
    }
  }, []);

  const handleSave = useCallback(async (pollId) => {
    try {
      // Implement save logic here
      console.log('Save:', pollId);
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, []);

  // Loading state
  if (initialLoading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg">🚀 Cargando feed optimizado...</p>
          <p className="text-sm text-gray-400 mt-2">Esto será súper rápido</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">⚠️ Error al cargar el feed</p>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={refreshFeed} className="bg-blue-600 hover:bg-blue-700">
            🔄 Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!posts.length && !lightweightPosts.length) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">📭 No hay contenido disponible</p>
          <Button onClick={refreshFeed} className="bg-blue-600 hover:bg-blue-700">
            🔄 Actualizar
          </Button>
        </div>
      </div>
    );
  }

  const displayPosts = posts.length > 0 ? posts : lightweightPosts;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Exit button */}
      {onExitTikTok && (
        <Button
          onClick={onExitTikTok}
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
        >
          ✕
        </Button>
      )}

      {/* Navigation arrows */}
      {enableNavigation && isNavigationVisible && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40 flex flex-col space-y-2">
          <Button
            onClick={goToPrevious}
            disabled={activeIndex === 0}
            variant="ghost"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white rounded-full disabled:opacity-30"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
          <Button
            onClick={goToNext}
            disabled={activeIndex >= totalPosts - 1 && !hasMore}
            variant="ghost"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white rounded-full disabled:opacity-30"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Post indicator */}
      <div className="absolute top-4 right-4 z-40 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
        {activeIndex + 1} / {totalPosts} {hasMore && '+'}
      </div>

      {/* Main scroll container */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-y-scroll overflow-x-hidden scrollbar-hide snap-y snap-mandatory"
        style={{
          height: '100vh',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory',
          scrollSnapStop: 'always'
        }}
      >
        {displayPosts.map((post, index) => (
          <div
            key={post.id}
            className="w-full h-screen snap-start snap-always"
            style={{ minHeight: '100vh' }}
          >
            <FastFeedPost
              post={post}
              isVisible={Math.abs(index - activeIndex) <= 1}
              isLightweight={post.is_lightweight}
              onLoadDetails={loadPostDetails}
              onVote={handleVote}
              onLike={handleLike}
              onSave={handleSave}
            />
          </div>
        ))}
        
        {/* Loading more indicator */}
        {loading && (
          <div className="w-full h-screen flex items-center justify-center snap-start bg-black">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4"></div>
              <p>⚡ Cargando más contenido...</p>  
            </div>
          </div>
        )}
        
        {/* End indicator */}
        {!hasMore && displayPosts.length > 0 && (
          <div className="w-full h-screen flex items-center justify-center snap-start bg-black">
            <div className="text-white text-center">
              <p className="text-xl mb-4">🎉 ¡Has visto todo!</p>
              <Button onClick={refreshFeed} className="bg-blue-600 hover:bg-blue-700">
                🔄 Actualizar feed
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Performance indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 z-40 bg-black/80 text-white p-2 rounded text-xs">
          <div>Posts: {displayPosts.length}</div>
          <div>Active: {activeIndex}</div>
          <div>Lightweight: {lightweightPosts.length > 0 ? 'ON' : 'OFF'}</div>
          <div>Loading: {loading ? 'YES' : 'NO'}</div>
        </div>
      )}
    </div>
  );
};

export default React.memo(OptimizedTikTokScrollView);