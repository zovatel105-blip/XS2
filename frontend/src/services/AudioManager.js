/**
 * AudioManager - Sistema de reproducción automática real para feed TikTok
 * Maneja reproducción HTML5 con previews reales de iTunes API
 */

class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.isPlaying = false;
    this.volume = 0.7;
    this.fadeInterval = null;
    this.playPromise = null;
    this.currentPostId = null; // Rastrear qué post específico está reproduciendo
    this.currentAudioUrl = null; // Rastrear URL actual explícitamente
    
    // Bind methods para usar en callbacks
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.stop = this.stop.bind(this);
  }

  /**
   * Reproduce una canción con fadeIn suave
   * @param {string} audioUrl - URL del preview de audio 
   * @param {Object} options - Opciones de reproducción
   */
  async play(audioUrl, options = {}) {
    try {
      const { postId = null } = options;
      
      // SINCRONIZACIÓN COMPLETA: Detener completamente cualquier audio anterior
      if (this.currentAudio) {
        console.log('🔄 Stopping previous audio for complete sync');
        await this.stop();
      }

      // Crear nuevo elemento de audio
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.preload = "metadata";
      audio.volume = 0; // Empezar en silencio para fade in
      
      // Configurar propiedades según opciones
      if (options.loop !== undefined) {
        audio.loop = options.loop;
        console.log('🔄 Audio loop configured:', options.loop);
      }
      
      if (options.startTime) {
        audio.currentTime = options.startTime;
      }

      // Set up event listeners
      audio.addEventListener('loadstart', () => {
        console.log('🎵 Audio loading started:', audioUrl);
      });

      audio.addEventListener('canplaythrough', () => {
        console.log('🎵 Audio ready to play');
      });

      audio.addEventListener('error', (e) => {
        console.error('🚨 Audio error:', e.target.error);
      });

      // Event listener para cuando la canción termine (si no está en loop)
      audio.addEventListener('ended', () => {
        if (!audio.loop) {
          console.log('🎵 Audio ended, not looping');
          this.isPlaying = false;
        } else {
          console.log('🔄 Audio ended, restarting due to loop');
        }
      });

      // Load audio source
      audio.src = audioUrl;
      this.currentAudio = audio;
      this.currentPostId = postId;
      this.currentAudioUrl = audioUrl;

      // Start playback with fade in
      this.playPromise = audio.play();
      await this.playPromise;
      
      this.isPlaying = true;
      await this.fadeIn();

      console.log(`✅ Audio playing for post: ${postId}, URL: ${audioUrl}`);

      // Solo auto-pausar después de 30 segundos si NO está en loop
      // En modo loop, la música debe continuar reproduciéndose indefinidamente
      if (!options.loop) {
        setTimeout(() => {
          console.log('🔄 Auto-pausing after 30s (no loop mode)');
          this.fadeOutAndPause();
        }, 30000);
      } else {
        console.log('🔄 Loop mode enabled - music will repeat automatically');
      }

      return true;

    } catch (error) {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
      this.currentPostId = null;
      this.currentAudioUrl = null;
      return false;
    }
  }

  /**
   * Pausa el audio actual con fadeOut
   */
  async pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      await this.fadeOut();
      this.currentAudio.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Detiene completamente el audio - MEJORADO para sincronización
   */
  async stop() {
    console.log('🛑 AudioManager: Stopping audio');
    
    if (this.currentAudio) {
      try {
        // Limpiar cualquier fade activo
        this.clearFadeInterval();
        
        // Cancelar cualquier promise de reproducción pendiente
        if (this.playPromise) {
          await this.playPromise.catch(() => {}); // Ignore errors from cancelled playback
        }
        
        // Pausar si está reproduciéndose
        if (!this.currentAudio.paused) {
          this.currentAudio.pause();
        }
        
        // Resetear tiempo y limpiar referencia
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = ''; // Limpiar fuente para liberar memoria
        this.currentAudio = null;
        this.isPlaying = false;
        this.playPromise = null;
        this.currentPostId = null;
        this.currentAudioUrl = null;
        
        console.log('✅ AudioManager: Audio stopped successfully');
      } catch (error) {
        console.error('❌ AudioManager: Error stopping audio:', error);
        // Asegurar cleanup incluso si hay error
        this.currentAudio = null;
        this.isPlaying = false;
        this.playPromise = null;
        this.currentPostId = null;
        this.currentAudioUrl = null;
      }
    } else {
      console.log('ℹ️ AudioManager: No audio to stop');
    }
  }

  /**
   * Cambia el volumen con transición suave
   */
  async setVolume(newVolume) {
    this.volume = Math.max(0, Math.min(1, newVolume));
    
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  /**
   * Habilita o deshabilita el loop de la canción actual
   */
  setLoop(enabled) {
    if (this.currentAudio) {
      this.currentAudio.loop = enabled;
      console.log('🔄 Loop', enabled ? 'enabled' : 'disabled', 'for current audio');
      return true;
    }
    return false;
  }

  /**
   * Obtiene el estado actual del loop
   */
  isLooping() {
    return this.currentAudio ? this.currentAudio.loop : false;
  }

  /**
   * Fade in suave
   */
  async fadeIn(duration = 500) {
    return new Promise((resolve) => {
      if (!this.currentAudio) {
        resolve();
        return;
      }

      const startVolume = 0;
      const targetVolume = this.volume;
      const steps = 20;
      const stepTime = duration / steps;
      const volumeStep = (targetVolume - startVolume) / steps;
      
      let currentStep = 0;
      
      this.fadeInterval = setInterval(() => {
        if (!this.currentAudio) {
          this.clearFadeInterval();
          resolve();
          return;
        }

        const newVolume = startVolume + (volumeStep * currentStep);
        this.currentAudio.volume = Math.min(newVolume, targetVolume);
        
        currentStep++;
        
        if (currentStep >= steps) {
          this.currentAudio.volume = targetVolume;
          this.clearFadeInterval();
          resolve();
        }
      }, stepTime);
    });
  }

  /**
   * Fade out suave
   */
  async fadeOut(duration = 300) {
    return new Promise((resolve) => {
      if (!this.currentAudio) {
        resolve();
        return;
      }

      const startVolume = this.currentAudio.volume;
      const steps = 15;
      const stepTime = duration / steps;
      const volumeStep = startVolume / steps;
      
      let currentStep = 0;
      
      this.fadeInterval = setInterval(() => {
        if (!this.currentAudio) {
          this.clearFadeInterval();
          resolve();
          return;
        }

        const newVolume = startVolume - (volumeStep * currentStep);
        this.currentAudio.volume = Math.max(newVolume, 0);
        
        currentStep++;
        
        if (currentStep >= steps || this.currentAudio.volume <= 0) {
          this.currentAudio.volume = 0;
          this.clearFadeInterval();
          resolve();
        }
      }, stepTime);
    });
  }

  /**
   * Fade out y pausa
   */
  async fadeOutAndPause() {
    await this.fadeOut();
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Limpia el interval de fade
   */
  clearFadeInterval() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  /**
   * Obtiene la URL actual del audio reproduciéndose
   */
  getCurrentAudioUrl() {
    return this.currentAudioUrl;
  }

  /**
   * Obtiene el ID del post que está reproduciendo actualmente
   */
  getCurrentPostId() {
    return this.currentPostId;
  }

  /**
   * Verifica si se está reproduciendo una URL específica
   */
  isPlayingUrl(url) {
    if (!this.currentAudio || !this.isPlaying) return false;
    return this.currentAudioUrl === url;
  }

  /**
   * Verifica si se está reproduciendo el audio de un post específico
   */
  isPlayingPost(postId) {
    if (!this.currentAudio || !this.isPlaying) return false;
    return this.currentPostId === postId;
  }

  /**
   * Obtiene el estado actual
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      isLooping: this.currentAudio ? this.currentAudio.loop : false,
      currentTime: this.currentAudio ? this.currentAudio.currentTime : 0,
      duration: this.currentAudio ? this.currentAudio.duration : 0,
      volume: this.volume
    };
  }

  /**
   * Verifica si el navegador soporta autoplay
   */
  async checkAutoplaySupport() {
    try {
      const audio = new Audio();
      audio.volume = 0;
      audio.muted = true;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        audio.pause();
        return true;
      }
    } catch (error) {
      console.log('Autoplay not supported:', error);
    }
    return false;
  }

  /**
   * Activa el contexto de audio tras interacción del usuario
   */
  async activateAudioContext() {
    try {
      // Crear un audio silencioso para activar el contexto
      const audio = new Audio();
      audio.volume = 0;
      audio.muted = true;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        audio.pause();
      }
      
      console.log('✅ Audio context activated');
      return true;
    } catch (error) {
      console.error('Failed to activate audio context:', error);
      return false;
    }
  }

  /**
   * Cleanup al destruir
   */
  destroy() {
    this.stop();
    this.clearFadeInterval();
  }
}

// Singleton instance
const audioManager = new AudioManager();

export default audioManager;