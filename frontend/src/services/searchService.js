/**
 * Search Service - Handles all search-related API calls
 */

import SEARCH_CONFIG from '../config/searchConfig';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

class SearchService {
  // Get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  constructor() {
    this.baseURL = `${BACKEND_URL}/api`;
  }

  // Search polls/posts
  async searchPosts(query, limit = SEARCH_CONFIG.LIMITS.SEARCH_RESULTS, offset = 0) {
    try {
      const params = new URLSearchParams({
        query,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${this.baseURL}/search/posts?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search posts error:', error);
      throw error;
    }
  }

  // Search users
  async searchUsers(query, limit = SEARCH_CONFIG.LIMITS.SEARCH_RESULTS, offset = 0) {
    try {
      const params = new URLSearchParams({
        query,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${this.baseURL}/search/users?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  // Search audio/music
  async searchAudio(query, limit = SEARCH_CONFIG.LIMITS.SEARCH_RESULTS, offset = 0) {
    try {
      const params = new URLSearchParams({
        query,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${this.baseURL}/search/audio?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search audio error:', error);
      throw error;
    }
  }

  // Get trending hashtags
  async getTrendingHashtags(limit = SEARCH_CONFIG.LIMITS.DISCOVERY_TRENDING) {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseURL}/search/trending-hashtags?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get trending hashtags error:', error);
      throw error;
    }
  }

  // Comprehensive search (all types)
  async searchAll(query, limit = SEARCH_CONFIG.LIMITS.SEARCH_RESULTS, offset = 0) {
    try {
      const params = new URLSearchParams({
        query,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${this.baseURL}/search/all?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search all error:', error);
      throw error;
    }
  }

  // Universal search with filter support
  async universalSearch(
    query, 
    filter = SEARCH_CONFIG.FILTERS.DEFAULT, 
    sortBy = SEARCH_CONFIG.SORT_OPTIONS.DEFAULT, 
    limit = SEARCH_CONFIG.LIMITS.SEARCH_RESULTS, 
    offset = 0
  ) {
    try {
      const params = new URLSearchParams({
        q: query,  // Backend expects 'q' not 'query'
        filter_type: filter,  // Backend expects 'filter_type'
        sort_by: sortBy,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${this.baseURL}/search/universal?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Universal search error:', error);
      throw error;
    }
  }

  // Get autocomplete suggestions
  async getAutocomplete(query, limit = 10) {
    try {
      const params = new URLSearchParams({
        q: query,  // Backend expects 'q' not 'query'
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseURL}/search/autocomplete?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Autocomplete error:', error);
      throw error;
    }
  }

  // Get search suggestions for discovery
  async getSearchSuggestions() {
    try {
      const response = await fetch(`${this.baseURL}/search/suggestions`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search suggestions error:', error);
      // Return mock data if service fails
      return {
        trending_posts: [],
        suggested_users: [],
        trending_hashtags: []
      };
    }
  }
}

export default new SearchService();