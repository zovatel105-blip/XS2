// Sistema de internacionalización dinámico
import translations from './translations';

class I18n {
  constructor() {
    this.locale = this.getStoredLocale() || this.detectBrowserLanguage();
    this.fallbackLocale = 'es';
  }

  getStoredLocale() {
    return localStorage.getItem('preferred_language');
  }

  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.languages[0];
    const shortLang = browserLang.split('-')[0];
    
    // Verificar si tenemos soporte para este idioma
    if (translations[shortLang]) {
      return shortLang;
    }
    
    return this.fallbackLocale;
  }

  setLocale(locale) {
    if (translations[locale]) {
      this.locale = locale;
      localStorage.setItem('preferred_language', locale);
      // Trigger re-render event
      window.dispatchEvent(new CustomEvent('localeChanged', { detail: locale }));
    }
  }

  t(key, variables = {}) {
    const keys = key.split('.');
    let translation = translations[this.locale];
    
    // Navigate through nested keys
    for (const k of keys) {
      translation = translation?.[k];
    }
    
    // Fallback to default locale
    if (!translation && this.locale !== this.fallbackLocale) {
      translation = translations[this.fallbackLocale];
      for (const k of keys) {
        translation = translation?.[k];
      }
    }
    
    // Return key if translation not found
    if (!translation) {
      console.warn(`Translation missing for key: ${key} in locale: ${this.locale}`);
      return key;
    }
    
    // Replace variables in translation
    return this.replaceVariables(translation, variables);
  }

  replaceVariables(text, variables) {
    if (typeof text !== 'string') return text;
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  // Format numbers based on locale
  formatNumber(num, options = {}) {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  // Format duration 
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Format date based on locale
  formatDate(dateString) {
    const localeMap = {
      'es': 'es-ES',
      'en': 'en-US', 
      'fr': 'fr-FR',
      'pt': 'pt-BR'
    };
    
    const browserLocale = localeMap[this.locale] || 'es-ES';
    
    return new Date(dateString).toLocaleDateString(browserLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getCurrentLocale() {
    return this.locale;
  }

  getAvailableLocales() {
    return Object.keys(translations);
  }
}

// Create singleton instance
const i18n = new I18n();

export default i18n;