/**
 * Real Music Service - Obtiene previews reales de música usando iTunes API
 */

import AppConfig from '../config/config';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Obtiene música real con previews de iTunes
 */
export const getRealMusicLibrary = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}/api/music/library-with-previews?limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        music: data.music || [],
        total: data.total || 0,
        hasRealPreviews: data.has_real_previews || false
      };
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching real music library:', error);
    
    // Fallback a música mock si falla la API
    return {
      success: false,
      music: getMockMusicLibrary(),
      total: 12,
      hasRealPreviews: false,
      error: error.message
    };
  }
};

/**
 * Busca una canción específica con preview real
 */
export const searchRealMusic = async (artist, track) => {
  try {
    const token = localStorage.getItem('auth_token');
    
    const params = new URLSearchParams({
      artist: artist,
      ...(track && { track })
    });
    
    const response = await fetch(`${API_BASE_URL}/api/music/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error searching real music:', error);
    return {
      success: false,
      message: error.message,
      music: null
    };
  }
};

/**
 * Obtiene preview URL directo de iTunes (sin backend)
 */
export const getItunesPreviewDirect = async (artist, track) => {
  try {
    const query = `${artist} ${track}`.trim();
    const url = 'https://itunes.apple.com/search';
    
    const params = new URLSearchParams({
      term: query,
      media: 'music',
      entity: 'song',
      limit: 1,
      country: 'US'
    });

    const response = await fetch(`${url}?${params}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          success: true,
          preview_url: result.previewUrl,
          artwork_url: result.artworkUrl100?.replace('100x100', '400x400'),
          artist_name: result.artistName,
          track_name: result.trackName,
          duration: 30
        };
      }
    }
    
    return { success: false, message: 'No preview found' };
  } catch (error) {
    console.error('Error fetching iTunes preview:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Actualiza música existente con previews reales
 */
export const enrichMusicWithRealPreviews = async (musicLibrary) => {
  const enrichedMusic = [];
  
  for (const music of musicLibrary.slice(0, 10)) { // Limitar a 10 para no sobrecargar
    try {
      const realPreview = await getItunesPreviewDirect(music.artist, music.title);
      
      if (realPreview.success && realPreview.preview_url) {
        enrichedMusic.push({
          ...music,
          preview_url: realPreview.preview_url, // URL REAL de preview
          cover: realPreview.artwork_url || music.cover,
          hasRealPreview: true,
          source: 'iTunes'
        });
      } else {
        // Mantener música original sin preview real
        enrichedMusic.push({
          ...music,
          hasRealPreview: false,
          source: 'Mock'
        });
      }
      
      // Pausa pequeña para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error enriching ${music.title}:`, error);
      enrichedMusic.push({
        ...music,
        hasRealPreview: false,
        source: 'Mock'
      });
    }
  }
  
  return enrichedMusic;
};

/**
 * Música mock de fallback
 */
const getMockMusicLibrary = () => [
  {
    id: 'mock_1',
    title: 'LA BOTELLA',
    artist: 'Morad',
    duration: 30,
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    category: 'Trending',
    isOriginal: false,
    isTrending: true,
    uses: 8500000,
    hasRealPreview: false,
    source: 'Mock'
  },
  {
    id: 'mock_2',
    title: 'Un Verano Sin Ti',
    artist: 'Bad Bunny',
    duration: 30,
    cover: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center',
    category: 'Trending',
    isOriginal: false,
    isTrending: true,
    uses: 12500000,
    hasRealPreview: false,
    source: 'Mock'
  },
  {
    id: 'mock_3',
    title: 'TQG',
    artist: 'Karol G ft. Shakira',
    duration: 30,
    cover: 'https://images.unsplash.com/photo-1520262494112-9fe481d36ec3?w=400&h=400&fit=crop&crop=center',
    category: 'Trending',
    isOriginal: false,
    isTrending: true,
    uses: 9800000,
    hasRealPreview: false,
    source: 'Mock'
  }
];

/**
 * Cache simple para previews
 */
const previewCache = new Map();

/**
 * Obtiene preview con cache
 */
export const getCachedPreview = async (artist, track) => {
  const cacheKey = `${artist}_${track}`.toLowerCase();
  
  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey);
  }
  
  const result = await getItunesPreviewDirect(artist, track);
  
  if (result.success) {
    previewCache.set(cacheKey, result);
  }
  
  return result;
};

export default {
  getRealMusicLibrary,
  searchRealMusic,
  getItunesPreviewDirect,
  enrichMusicWithRealPreviews,
  getCachedPreview
};