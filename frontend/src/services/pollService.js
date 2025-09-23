/**
 * Poll Service - Handles all poll-related API calls
 * Replaces mock data with real backend integration
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

class PollService {
  constructor() {
    this.baseURL = `${BACKEND_URL}/api`;
  }

  // Get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Handle API errors
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Get polls with pagination and filters
  async getPolls(options = {}) {
    const { 
      limit = 20, 
      offset = 0, 
      category = null, 
      featured = null 
    } = options;

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (category) params.append('category', category);
    if (featured !== null) params.append('featured', featured.toString());

    try {
      const response = await fetch(`${this.baseURL}/polls?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching polls:', error);
      throw error;
    }
  }

  // Get a specific poll by ID
  async getPollById(pollId) {
    try {
      const response = await fetch(`${this.baseURL}/polls/${pollId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching poll:', error);
      throw error;
    }
  }

  // Create a new poll
  async createPoll(pollData) {
    try {
      const response = await fetch(`${this.baseURL}/polls`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(pollData),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    }
  }

  // Vote on a poll
  async voteOnPoll(pollId, optionId) {
    try {
      const response = await fetch(`${this.baseURL}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ option_id: optionId }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error voting on poll:', error);
      throw error;
    }
  }

  // Toggle like on a poll
  async toggleLike(pollId) {
    try {
      const response = await fetch(`${this.baseURL}/polls/${pollId}/like`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Share a poll (increment share count)
  async sharePoll(pollId) {
    try {
      const response = await fetch(`${this.baseURL}/polls/${pollId}/share`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error sharing poll:', error);
      throw error;
    }
  }

  // Get polls from followed users only
  async getFollowingPolls(params = {}) {
    try {
      const { limit = 20, offset = 0 } = params;
      
      // Use the new backend endpoint that filters polls by followed users
      const response = await fetch(`${this.baseURL}/polls/following?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No estás autenticado');
        }
        throw new Error('Error al obtener publicaciones de usuarios seguidos');
      }

      const followingPolls = await response.json();
      
      // Transform and return the polls (they're already filtered by the backend)
      return followingPolls.map(poll => this.transformPollData(poll));
      
    } catch (error) {
      console.error('Error loading following polls:', error);
      throw error;
    }
  }

  // Transform backend poll data to frontend format
  transformPollData(backendPoll) {
    return {
      id: backendPoll.id,
      title: backendPoll.title,
      author: {
        id: backendPoll.author?.id,
        username: backendPoll.author?.username,
        display_name: backendPoll.author?.display_name,
        avatar_url: backendPoll.author?.avatar_url,
        is_verified: backendPoll.author?.is_verified
      },
      authorUser: {
        id: backendPoll.author?.id,
        username: backendPoll.author?.username,
        displayName: backendPoll.author?.display_name,
        avatar: backendPoll.author?.avatar_url,
        verified: backendPoll.author?.is_verified,
        followers: '1K' // Placeholder for now
      },
      timeAgo: backendPoll.time_ago,
      music: backendPoll.music || {
        id: 'default',
        title: 'No Music',
        artist: 'Silence',
        duration: 30,
        url: '',
        cover: '',
        isOriginal: false,
        waveform: Array(20).fill(0.5)
      },
      options: backendPoll.options.map(option => ({
        id: option.id,
        user: option.user,
        text: option.text,
        votes: option.votes,
        media: option.media ? {
          ...option.media,
          url: this.normalizeMediaUrl(option.media.url),
          thumbnail: this.normalizeMediaUrl(option.media.thumbnail || option.media.url),
          transform: option.media.transform  // ✅ CRITICAL FIX: Preserve transform data
        } : null
      })),
      totalVotes: backendPoll.total_votes,
      likes: backendPoll.likes,
      shares: backendPoll.shares,
      comments: backendPoll.comments_count,
      userVote: backendPoll.user_vote,
      userLiked: backendPoll.user_liked,
      category: backendPoll.category,
      tags: backendPoll.tags || [],
      is_featured: backendPoll.is_featured,
      layout: backendPoll.layout  // ✅ CRITICAL FIX: Include layout field for LayoutRenderer
    };
  }

  // Normalize media URLs - convert relative to absolute
  normalizeMediaUrl(url) {
    if (!url) return null;
    
    // If already absolute, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If new API path format, prepend BACKEND_URL
    if (url.startsWith('/api/uploads/')) {
      return `${BACKEND_URL}${url}`;
    }
    
    // If legacy /uploads/ path, convert to API format
    if (url.startsWith('/uploads/')) {
      return `${BACKEND_URL}/api${url}`;
    }
    
    // Default fallback
    return url;
  }

  // Get polls in the format expected by the frontend components
  async getPollsForFrontend(options = {}) {
    try {
      const backendPolls = await this.getPolls(options);
      return backendPolls.map(poll => this.transformPollData(poll));
    } catch (error) {
      console.error('Error fetching polls for frontend:', error);
      // Return empty array on error to prevent app crashes
      return [];
    }
  }

  // Get user's own polls
  async getUserPolls(userId, options = {}) {
    // For now, filter from all polls
    // In the future, this could be a dedicated endpoint
    try {
      const allPolls = await this.getPolls(options);
      return allPolls
        .filter(poll => poll.author.id === userId)
        .map(poll => this.transformPollData(poll));
    } catch (error) {
      console.error('Error fetching user polls:', error);
      return [];
    }
  }

  // Refresh poll data (useful after voting or liking)
  async refreshPoll(pollId) {
    try {
      const backendPoll = await this.getPollById(pollId);
      return this.transformPollData(backendPoll);
    } catch (error) {
      console.error('Error refreshing poll:', error);
      return null;
    }
  }
  // Update poll
  async updatePoll(pollId, updateData) {
    try {
      const response = await fetch(`${this.baseURL}/polls/${pollId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating poll:', error);
      throw error;
    }
  }

  // Delete poll
  async deletePoll(pollId) {
    try {
      const response = await fetch(`${this.baseURL}/polls/${pollId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting poll:', error);
      throw error;
    }
  }

  // Save a poll to user's saved collection
  async savePoll(pollId) {
    try {
      const response = await fetch(`${this.baseURL}/polls/${pollId}/save`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving poll:', error);
      throw error;
    }
  }

  // Remove a poll from user's saved collection
  async unsavePoll(pollId) {
    try {
      const response = await fetch(`${this.baseURL}/polls/${pollId}/save`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error unsaving poll:', error);
      throw error;
    }
  }

  // Get user's saved polls
  async getSavedPolls() {
    try {
      // Get current user ID from token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Decode token to get user ID (simple base64 decode of JWT payload)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      const userId = payload.sub;
      
      if (!userId) {
        throw new Error('User ID not found in token');
      }
      
      const response = await fetch(`${this.baseURL}/users/${userId}/saved-polls`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.saved_polls || [];
    } catch (error) {
      console.error('Error getting saved polls:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const pollService = new PollService();
export default pollService;