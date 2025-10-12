/**
 * Video Memory Manager - TikTok-style video optimization
 * Manages video loading, unloading, and memory usage for smooth scrolling
 */

class VideoMemoryManager {
  constructor() {
    this.activeVideos = new Map(); // Track active video elements
    this.videoCache = new Map();   // Cache video metadata
    this.memoryThreshold = 100;    // Max number of videos in memory
    this.cleanupInterval = 30000;  // Cleanup every 30 seconds
    this.observers = new Map();    // Intersection observers
    this.performanceMode = 'balanced'; // 'performance', 'balanced', 'quality'
    
    this.startCleanupTimer();
    this.detectPerformanceMode();
  }

  /**
   * Register a video element for optimization
   */
  registerVideo(videoElement, options = {}) {
    const {
      postId,
      optionId,
      priority = 'medium',
      layout = 'default',
      isActive = false,
      isVisible = false
    } = options;

    const videoKey = `${postId}_${optionId}`;
    
    const videoData = {
      element: videoElement,
      postId,
      optionId,
      priority,
      layout,
      isActive,
      isVisible,
      lastAccessed: Date.now(),
      loadState: 'registered',
      memoryUsage: 0
    };

    this.activeVideos.set(videoKey, videoData);
    
    // Set up intersection observer for this video
    this.setupVideoObserver(videoElement, videoKey);
    
    // Apply optimization based on current performance mode
    this.optimizeVideoElement(videoElement, videoData);
    
    console.log(`📹 Video registered: ${videoKey} (Layout: ${layout}, Priority: ${priority})`);
  }

  /**
   * Setup intersection observer for video visibility
   */
  setupVideoObserver(videoElement, videoKey) {
    if (this.observers.has(videoKey)) {
      this.observers.get(videoKey).disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const videoData = this.activeVideos.get(videoKey);
          if (!videoData) return;

          videoData.isVisible = entry.isIntersecting;
          videoData.lastAccessed = Date.now();

          if (entry.isIntersecting) {
            this.activateVideo(videoKey);
          } else {
            this.deactivateVideo(videoKey);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: '50px' // Start loading 50px before visible
      }
    );

    observer.observe(videoElement);
    this.observers.set(videoKey, observer);
  }

  /**
   * Activate video (start loading/playing)
   */
  activateVideo(videoKey) {
    const videoData = this.activeVideos.get(videoKey);
    if (!videoData) return;

    const { element, priority, layout } = videoData;
    
    // Update state
    videoData.isActive = true;
    videoData.lastAccessed = Date.now();
    videoData.loadState = 'active';

    // Apply activation optimizations
    if (this.shouldAutoPlay(videoData)) {
      element.preload = 'auto';
      
      // Auto-play with error handling
      element.play().catch(error => {
        console.warn(`⚠️ Video autoplay failed for ${videoKey}:`, error);
        // Try muted playback as fallback
        element.muted = true;
        element.play().catch(() => {
          console.warn(`❌ Muted video playback failed for ${videoKey}`);
        });
      });
    } else {
      element.preload = 'metadata';
    }

    console.log(`▶️ Video activated: ${videoKey} (Layout: ${layout})`);
  }

  /**
   * Deactivate video (pause/unload)
   */
  deactivateVideo(videoKey) {
    const videoData = this.activeVideos.get(videoKey);
    if (!videoData) return;

    const { element, priority } = videoData;
    
    // Update state
    videoData.isActive = false;
    videoData.loadState = 'inactive';

    // Pause video to save resources
    if (!element.paused) {
      element.pause();
    }

    // For low priority videos, reduce preloading
    if (priority === 'low' && this.performanceMode === 'performance') {
      element.preload = 'none';
    }

    console.log(`⏸️ Video deactivated: ${videoKey}`);
  }

  /**
   * Determine if video should autoplay
   */
  shouldAutoPlay(videoData) {
    const { priority, layout, isVisible, isActive } = videoData;
    
    // Performance mode restrictions
    if (this.performanceMode === 'performance') {
      return isActive && isVisible && priority === 'high';
    }
    
    // Balanced mode (default)
    if (this.performanceMode === 'balanced') {
      return isVisible && (priority === 'high' || (priority === 'medium' && isActive));
    }
    
    // Quality mode - more liberal autoplay
    return isVisible;
  }

  /**
   * Optimize video element based on performance mode and layout
   */
  optimizeVideoElement(videoElement, videoData) {
    const { layout, priority } = videoData;
    
    // Base optimizations
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.loop = true;

    // Layout-specific optimizations
    if (layout === '2x2' || layout === 'grid-2x2') {
      // 2x2 layouts need aggressive optimization
      videoElement.preload = priority === 'high' ? 'metadata' : 'none';
      
      // Reduce quality for non-active videos in performance mode
      if (this.performanceMode === 'performance' && priority !== 'high') {
        videoElement.style.filter = 'brightness(0.9)'; // Slight dim to indicate lower priority
      }
    } else if (layout === 'carousel' || layout === 'off') {
      // Carousel can preload adjacent videos
      videoElement.preload = priority === 'high' ? 'auto' : 'metadata';
    } else {
      // Default layouts
      videoElement.preload = priority === 'high' ? 'auto' : 'metadata';
    }

    // Performance mode adjustments
    if (this.performanceMode === 'performance') {
      videoElement.style.willChange = 'auto'; // Let browser optimize
    } else {
      videoElement.style.willChange = 'transform'; // Prepare for animations
    }
  }

  /**
   * Unregister video and cleanup resources
   */
  unregisterVideo(videoKey) {
    const videoData = this.activeVideos.get(videoKey);
    if (!videoData) return;

    const { element } = videoData;
    
    // Cleanup observer
    if (this.observers.has(videoKey)) {
      this.observers.get(videoKey).disconnect();
      this.observers.delete(videoKey);
    }

    // ✅ FIXED: Solo pausar el video, NO eliminar el src
    // Esto previene que el video desaparezca cuando vuelves después de scroll
    if (element) {
      element.pause();
      // NO limpiamos el src para que el video pueda reproducirse cuando vuelvas
      // element.src = '';  // COMENTADO - Esto causaba que el video desapareciera
      // element.load();    // COMENTADO - Esto forzaba la recarga y pérdida de datos
    }

    // Remove from tracking
    this.activeVideos.delete(videoKey);
    
    console.log(`🗑️ Video unregistered: ${videoKey} (src preservado para scroll)`);
  }

  /**
   * Cleanup old/unused videos
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 120000; // 2 minutes
    let cleanedCount = 0;

    for (const [videoKey, videoData] of this.activeVideos.entries()) {
      const { lastAccessed, isActive, isVisible } = videoData;
      
      // Remove old, inactive, invisible videos
      if (now - lastAccessed > maxAge && !isActive && !isVisible) {
        this.unregisterVideo(videoKey);
        cleanedCount++;
      }
    }

    // Force cleanup if over threshold
    if (this.activeVideos.size > this.memoryThreshold) {
      const sortedVideos = Array.from(this.activeVideos.entries())
        .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);
      
      const toRemove = sortedVideos.slice(0, sortedVideos.length - this.memoryThreshold);
      toRemove.forEach(([videoKey]) => {
        this.unregisterVideo(videoKey);
        cleanedCount++;
      });
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Video cleanup: removed ${cleanedCount} videos, ${this.activeVideos.size} remaining`);
    }
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Detect performance mode based on device capabilities
   */
  detectPerformanceMode() {
    // Basic device capability detection
    const memory = navigator.deviceMemory || 4; // GB, fallback to 4GB
    const cores = navigator.hardwareConcurrency || 4;
    const connection = navigator.connection?.effectiveType || '4g';

    if (memory <= 2 || cores <= 2 || connection === 'slow-2g' || connection === '2g') {
      this.performanceMode = 'performance';
      this.memoryThreshold = 50;
    } else if (memory >= 8 && cores >= 8 && connection === '4g') {
      this.performanceMode = 'quality';
      this.memoryThreshold = 200;
    } else {
      this.performanceMode = 'balanced';
      this.memoryThreshold = 100;
    }

    console.log(`📊 Performance mode: ${this.performanceMode} (Memory: ${memory}GB, Cores: ${cores}, Connection: ${connection})`);
  }

  /**
   * Update performance mode manually
   */
  setPerformanceMode(mode) {
    if (['performance', 'balanced', 'quality'].includes(mode)) {
      this.performanceMode = mode;
      
      // Adjust thresholds
      switch (mode) {
        case 'performance':
          this.memoryThreshold = 50;
          break;
        case 'quality':
          this.memoryThreshold = 200;
          break;
        default:
          this.memoryThreshold = 100;
      }

      // Re-optimize all active videos
      for (const [videoKey, videoData] of this.activeVideos.entries()) {
        this.optimizeVideoElement(videoData.element, videoData);
      }

      console.log(`⚙️ Performance mode changed to: ${mode}`);
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const activeCount = Array.from(this.activeVideos.values())
      .filter(v => v.isActive).length;
    
    const visibleCount = Array.from(this.activeVideos.values())
      .filter(v => v.isVisible).length;

    return {
      totalVideos: this.activeVideos.size,
      activeVideos: activeCount,
      visibleVideos: visibleCount,
      performanceMode: this.performanceMode,
      memoryThreshold: this.memoryThreshold,
      lastCleanup: this.lastCleanup
    };
  }

  /**
   * Force immediate cleanup
   */
  forceCleanup() {
    this.cleanup();
  }

  /**
   * Cleanup all videos
   */
  destroy() {
    // Cleanup all videos
    for (const videoKey of this.activeVideos.keys()) {
      this.unregisterVideo(videoKey);
    }
    
    // Clear timers
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    console.log('🔥 VideoMemoryManager destroyed');
  }
}

// Export singleton instance
const videoMemoryManager = new VideoMemoryManager();
export default videoMemoryManager;