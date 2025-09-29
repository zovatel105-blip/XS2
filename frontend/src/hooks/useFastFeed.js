/**
 * useFastFeed Hook - Optimized feed loading with progressive enhancement
 * Handles lazy loading, preloading, and infinite scroll efficiently
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import optimizedFeedService from '../services/optimizedFeedService';

export const useFastFeed = (options = {}) => {
  const {
    initialLimit = 5,
    batchSize = 10,
    preloadThreshold = 2, // Preload when 2 items from end
    enablePreload = true,
    enableCache = true
  } = options;

  // State management
  const [posts, setPosts] = useState([]);
  const [lightweightPosts, setLightweightPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  
  // Refs for managing loading state
  const currentOffset = useRef(0);
  const isPreloading = useRef(false);
  const preloadedPosts = useRef([]);

  // 🚀 INITIAL FAST LOAD
  const loadInitialFeed = useCallback(async () => {
    try {
      setInitialLoading(true);
      setError(null);
      
      console.log('🚀 Loading initial fast feed...');
      
      // Get fast lightweight data first
      const result = await optimizedFeedService.getProgressiveFeed(
        initialLimit, 
        initialLimit * 2
      );
      
      if (result.polls && result.polls.length > 0) {
        setLightweightPosts(result.polls);
        setPosts(result.polls);
        currentOffset.current = result.polls.length;
        
        console.log(`✅ Initial feed loaded: ${result.polls.length} posts`);
        
        // Preload next batch in background if enabled
        if (enablePreload) {
          setTimeout(() => {
            preloadNextBatch();
          }, 1000);
        }
      } else {
        setHasMore(false);
      }
      
    } catch (error) {
      console.error('❌ Initial feed load failed:', error);
      setError(error.message);
    } finally {
      setInitialLoading(false);
    }
  }, [initialLimit, enablePreload]);

  // ⚡ PRELOAD NEXT BATCH
  const preloadNextBatch = useCallback(async () => {
    if (isPreloading.current || !hasMore) return;
    
    try {
      isPreloading.current = true;
      console.log('⚡ Preloading next batch...');
      
      const result = await optimizedFeedService.preloadNextBatch(
        currentOffset.current,
        batchSize
      );
      
      if (result.polls && result.polls.length > 0) {
        // Store preloaded posts
        preloadedPosts.current = result.polls;
        console.log(`✅ Preloaded ${result.polls.length} posts`);
      } else {
        setHasMore(false);
      }
      
    } catch (error) {
      console.error('❌ Preload failed:', error);
    } finally {
      isPreloading.current = false;
    }
  }, [batchSize, hasMore]);

  // 📱 LOAD MORE (from preloaded or fetch new)
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      
      let newPosts = [];
      
      // Use preloaded posts if available
      if (preloadedPosts.current.length > 0) {
        console.log('📱 Using preloaded posts');
        newPosts = preloadedPosts.current;
        preloadedPosts.current = [];
        
        // Start preloading next batch
        if (enablePreload) {
          setTimeout(preloadNextBatch, 500);
        }
      } else {
        // Fetch new batch
        console.log('📱 Fetching new batch...');
        const result = await optimizedFeedService.getFastFeed({
          limit: batchSize,
          offset: currentOffset.current,
          lightweight: false
        });
        
        newPosts = result.polls || [];
      }
      
      if (newPosts.length > 0) {
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
        currentOffset.current += newPosts.length;
        console.log(`✅ Loaded ${newPosts.length} more posts`);
      } else {
        setHasMore(false);
        console.log('📭 No more posts available');
      }
      
    } catch (error) {
      console.error('❌ Load more failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, batchSize, enablePreload, preloadNextBatch]);

  // 📊 LOAD POST DETAILS ON DEMAND
  const loadPostDetails = useCallback(async (postId) => {
    try {
      console.log(`📊 Loading details for post: ${postId}`);
      const details = await optimizedFeedService.getPollDetails(postId);
      
      // Update the post in the current posts array
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, ...details, detailsLoaded: true }
            : post
        )
      );
      
      return details;
      
    } catch (error) {
      console.error(`❌ Failed to load details for ${postId}:`, error);
      throw error;
    }
  }, []);

  // 🔄 REFRESH FEED
  const refreshFeed = useCallback(async () => {
    console.log('🔄 Refreshing feed...');
    
    // Clear cache if enabled
    if (enableCache) {
      optimizedFeedService.clearCache();
    }
    
    // Reset state
    setPosts([]);
    setLightweightPosts([]);
    currentOffset.current = 0;
    preloadedPosts.current = [];
    setHasMore(true);
    setError(null);
    
    // Reload
    await loadInitialFeed();
  }, [enableCache, loadInitialFeed]);

  // 📊 LOAD ANALYTICS
  const loadAnalytics = useCallback(async () => {
    try {
      const analyticsData = await optimizedFeedService.getFeedAnalytics();
      setAnalytics(analyticsData);
      return analyticsData;
    } catch (error) {
      console.error('❌ Analytics failed:', error);
      return null;
    }
  }, []);

  // 🔍 AUTO-PRELOAD TRIGGER
  const checkPreloadTrigger = useCallback((currentIndex) => {
    const shouldPreload = currentIndex >= posts.length - preloadThreshold;
    
    if (shouldPreload && enablePreload && !isPreloading.current && hasMore) {
      if (preloadedPosts.current.length === 0) {
        preloadNextBatch();
      }
    }
  }, [posts.length, preloadThreshold, enablePreload, hasMore, preloadNextBatch]);

  // Initialize feed on mount
  useEffect(() => {
    loadInitialFeed();
  }, [loadInitialFeed]);

  return {
    // Data
    posts,
    lightweightPosts,
    analytics,
    
    // Loading states
    loading,
    initialLoading,
    error,
    hasMore,
    
    // Actions
    loadMore,
    refreshFeed,
    loadPostDetails,
    loadAnalytics,
    checkPreloadTrigger,
    
    // Utility
    clearCache: () => optimizedFeedService.clearCache(),
    getCacheStats: () => optimizedFeedService.getCacheStats(),
    
    // Metrics
    totalPosts: posts.length,
    currentOffset: currentOffset.current,
    isPreloading: isPreloading.current
  };
};