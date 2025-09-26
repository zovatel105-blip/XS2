/**
 * Search Configuration
 * Centralized configuration for search functionality
 */

export const SEARCH_CONFIG = {
  // Debounce timings
  DEBOUNCE: {
    SEARCH_DELAY: parseInt(process.env.REACT_APP_SEARCH_DEBOUNCE_DELAY) || 500,
    AUTOCOMPLETE_DELAY: parseInt(process.env.REACT_APP_AUTOCOMPLETE_DEBOUNCE_DELAY) || 200,
  },
  
  // Search limits
  LIMITS: {
    SEARCH_RESULTS: parseInt(process.env.REACT_APP_SEARCH_RESULTS_LIMIT) || 50,
    AUTOCOMPLETE_RESULTS: parseInt(process.env.REACT_APP_AUTOCOMPLETE_RESULTS_LIMIT) || 10,
    DISCOVERY_TRENDING: parseInt(process.env.REACT_APP_DISCOVERY_TRENDING_LIMIT) || 20,
  },
  
  // Input validation
  VALIDATION: {
    MIN_AUTOCOMPLETE_LENGTH: parseInt(process.env.REACT_APP_MIN_AUTOCOMPLETE_LENGTH) || 2,
    MIN_SEARCH_LENGTH: parseInt(process.env.REACT_APP_MIN_SEARCH_LENGTH) || 1,
    MAX_QUERY_LENGTH: parseInt(process.env.REACT_APP_MAX_QUERY_LENGTH) || 100,
  },
  
  // Sort options
  SORT_OPTIONS: {
    DEFAULT: process.env.REACT_APP_DEFAULT_SEARCH_SORT || 'popularity',
    RELEVANCE: 'relevance',
    POPULARITY: 'popularity', 
    RECENT: 'recent',
  },
  
  // Filter options
  FILTERS: {
    DEFAULT: process.env.REACT_APP_DEFAULT_SEARCH_FILTER || 'all',
    ALL: 'all',
    USERS: 'users',
    POSTS: 'posts', 
    HASHTAGS: 'hashtags',
    SOUNDS: 'sounds',
  },
  
  // UI Configuration
  UI: {
    SEARCH_PLACEHOLDER: process.env.REACT_APP_SEARCH_PLACEHOLDER || 'Buscar',
    EMPTY_STATE_TITLE: process.env.REACT_APP_EMPTY_STATE_TITLE || 'Descubre contenido increíble',
    EMPTY_STATE_SUBTITLE: process.env.REACT_APP_EMPTY_STATE_SUBTITLE || 'Busca usuarios, videos, sonidos y hashtags populares',
    NO_RESULTS_TITLE: process.env.REACT_APP_NO_RESULTS_TITLE || 'Sin resultados',
    LOADING_MESSAGE: process.env.REACT_APP_LOADING_MESSAGE || 'Buscando...',
    LOADING_SUBTITLE: process.env.REACT_APP_LOADING_SUBTITLE || 'Encontrando los mejores resultados',
  },
  
  // Feature flags
  FEATURES: {
    ENABLE_AUTOCOMPLETE: process.env.REACT_APP_ENABLE_AUTOCOMPLETE !== 'false',
    ENABLE_RECENT_SEARCHES: process.env.REACT_APP_ENABLE_RECENT_SEARCHES !== 'false',
    ENABLE_SUGGESTIONS: process.env.REACT_APP_ENABLE_SUGGESTIONS !== 'false',
    ENABLE_VOICE_SEARCH: process.env.REACT_APP_ENABLE_VOICE_SEARCH === 'true',
  },
  
  // Performance
  PERFORMANCE: {
    CACHE_RESULTS: process.env.REACT_APP_CACHE_SEARCH_RESULTS !== 'false',
    CACHE_DURATION: parseInt(process.env.REACT_APP_SEARCH_CACHE_DURATION) || 300000, // 5 minutes
  },
};

export default SEARCH_CONFIG;