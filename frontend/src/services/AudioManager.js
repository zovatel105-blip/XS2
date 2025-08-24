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
      // Si hay audio reproduciéndose, hacer fade out primero
      if (this.currentAudio && !this.currentAudio.paused) {
        await this.fadeOut();
      }

      // Crear nuevo elemento de audio
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.preload = "metadata";
      audio.volume = 0; // Empezar en silencio para fade in
      
      // Configurar propiedades según opciones
      if (options.loop !== undefined) {
        audio.loop = options.loop;
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

      // Load audio source
      audio.src = audioUrl;
      this.currentAudio = audio;

      // Start playback with fade in
      this.playPromise = audio.play();
      await this.playPromise;
      
      this.isPlaying = true;
      await this.fadeIn();

      // Auto-pause después de 30 segundos (duración típica de preview)
      setTimeout(() => {
        this.fadeOutAndPause();
      }, 30000);

      return true;

    } catch (error) {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
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
   * Detiene completamente el audio
   */
  async stop() {
    if (this.currentAudio) {
      this.clearFadeInterval();
      
      if (!this.currentAudio.paused) {
        this.currentAudio.pause();
      }
      
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.isPlaying = false;
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
   * Obtiene el estado actual
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
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