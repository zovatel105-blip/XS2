/**
 * Optimized Feed Service - Fast loading with smart caching
 * Designed to handle videos and large content efficiently
 */

import AppConfig from '../config/config';

class OptimizedFeedService {
  constructor() {
    this.baseURL = `${AppConfig.BACKEND_URL}/api`;
    this.cache = new Map();
    this.preloadCache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  // Get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // 🚀 FAST INITIAL LOAD - Lightweight data only
  async getFastFeed(options = {}) {
    const { 
      limit = 10, 
      offset = 0, 
      lightweight = true 
    } = options;

    const cacheKey = `fast_feed_${limit}_${offset}_${lightweight}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < this.cacheTTL) {
        console.log('🎯 Using cached fast feed');
        return data;
      }
    }

    try {
      console.log('🚀 Loading fast feed from backend...');
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        lightweight: lightweight.toString()
      });

      const url = `${this.baseURL}/polls/fast?${params}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      console.log(`✅ Fast feed loaded: ${data.polls?.length || 0} posts`);
      return data;

    } catch (error) {
      console.error('❌ Fast feed failed:', error);
      // Fallback to regular feed
      return this.getFallbackFeed(options);
    }
  }

  // 📱 ON-DEMAND DETAILS - Load full data when user views post
  async getPollDetails(pollId) {
    const cacheKey = `poll_details_${pollId}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < this.cacheTTL) {
        return data;
      }
    }

    try {
      const url = `${this.baseURL}/polls/${pollId}/details`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;

    } catch (error) {
      console.error(`❌ Failed to load details for poll ${pollId}:`, error);
      throw error;
    }
  }

  // ⚡ PRELOAD NEXT BATCH - Background loading for smooth scroll
  async preloadNextBatch(currentOffset, batchSize = 5) {
    const cacheKey = `preload_${currentOffset}_${batchSize}`;
    
    // Check if already preloading
    if (this.preloadCache.has(cacheKey)) {
      return this.preloadCache.get(cacheKey);
    }

    try {
      console.log(`⚡ Preloading next batch: offset ${currentOffset + batchSize}`);
      
      const params = new URLSearchParams({
        current_offset: currentOffset.toString(),
        batch_size: batchSize.toString()
      });

      const url = `${this.baseURL}/polls/preload?${params}`;
      const promise = fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }).then(response => this.handleResponse(response));

      // Cache the promise
      this.preloadCache.set(cacheKey, promise);
      
      const data = await promise;
      
      // Remove from preload cache and add to main cache
      this.preloadCache.delete(cacheKey);
      
      console.log(`✅ Preloaded ${data.polls?.length || 0} posts`);
      return data;

    } catch (error) {
      console.error('❌ Preload failed:', error);
      this.preloadCache.delete(cacheKey);
      return { polls: [], error: error.message };
    }
  }

  // 🖼️ LAZY THUMBNAIL - Load thumbnails on demand
  async getThumbnail(mediaId, size = 'small') {
    try {
      const url = `${this.baseURL}/media/thumbnail/${mediaId}?size=${size}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);

    } catch (error) {
      console.error(`❌ Thumbnail failed for ${mediaId}:`, error);
      return {
        media_id: mediaId,
        thumbnail_url: '/placeholder.jpg',
        cached: false
      };
    }
  }

  // 📊 GET ANALYTICS - Performance metrics
  async getFeedAnalytics() {
    try {
      const url = `${this.baseURL}/polls/analytics`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);

    } catch (error) {
      console.error('❌ Analytics failed:', error);
      return { error: error.message };
    }
  }

  // 🔄 FALLBACK FEED - Regular endpoint if optimized fails
  async getFallbackFeed(options = {}) {
    const { limit = 20, offset = 0 } = options;

    try {
      console.log('🔄 Using fallback feed endpoint...');
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      const url = `${this.baseURL}/polls?${params}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);
      
      // Transform to match optimized format
      return {
        polls: data,
        total: data.length,
        offset,
        limit,
        optimized: false,
        fallback: true
      };

    } catch (error) {
      console.error('❌ Fallback feed also failed:', error);
      throw error;
    }
  }

  // 🧹 CACHE MANAGEMENT
  clearCache() {
    this.cache.clear();
    this.preloadCache.clear();
    console.log('🧹 Feed cache cleared');
  }

  getCacheStats() {
    return {
      main_cache_size: this.cache.size,
      preload_cache_size: this.preloadCache.size,
      cache_ttl_minutes: this.cacheTTL / (60 * 1000)
    };
  }

  // 🔄 PROGRESSIVE LOADING STRATEGY
  async getProgressiveFeed(initialLimit = 5, fullLimit = 20) {
    try {
      console.log('🔄 Starting progressive feed loading...');
      
      // Step 1: Load minimal data very fast
      const lightData = await this.getFastFeed({ 
        limit: initialLimit, 
        lightweight: true 
      });

      // Step 2: Preload full data in background
      setTimeout(() => {
        this.getFastFeed({ 
          limit: fullLimit, 
          lightweight: false 
        }).catch(err => console.warn('Background full load failed:', err));
      }, 100);

      // Step 3: Preload next batch
      setTimeout(() => {
        this.preloadNextBatch(fullLimit).catch(err => 
          console.warn('Background preload failed:', err)
        );
      }, 500);

      return lightData;

    } catch (error) {
      console.error('❌ Progressive loading failed:', error);
      return this.getFallbackFeed({ limit: initialLimit });
    }
  }
}

// Export singleton instance
const optimizedFeedService = new OptimizedFeedService();
export default optimizedFeedService;