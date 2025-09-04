import config from '../config/config';

class UserService {
  constructor() {
    this.baseURL = config.API_ENDPOINTS.USERS.SEARCH.split('/search')[0]; // Get base users URL
  }

  // Get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Handle API response
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }
    return response.json();
  }

  // Get user profile by user ID or username (auto-detects format)
  async getUserProfile(userIdOrUsername) {
    try {
      // Auto-detect if it's a UUID/ID or username
      // UUIDs are typically 36 characters with hyphens, usernames are typically shorter alphanumeric
      const isId = userIdOrUsername.includes('-') && userIdOrUsername.length > 20;
      
      let response;
      if (isId) {
        // Use ID-based endpoint
        response = await fetch(config.API_ENDPOINTS.USERS.PROFILE(userIdOrUsername), {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
      } else {
        // Use username-based endpoint
        response = await fetch(config.API_ENDPOINTS.USERS.PROFILE_BY_USERNAME(userIdOrUsername), {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
      }

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching user profile for ${userIdOrUsername}:`, error);
      throw error;
    }
  }

  // Search users by query
  async searchUsers(query) {
    try {
      const response = await fetch(`${config.API_ENDPOINTS.USERS.SEARCH}?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Get follow status for a user
  async getFollowStatus(userIdOrUsername) {
    try {
      let userId = userIdOrUsername;
      
      // If it looks like a username (no UUID format), resolve it to ID via search
      if (!userIdOrUsername.includes('-') && userIdOrUsername.length > 5) {
        const searchResult = await this.searchUsers(userIdOrUsername);
        const user = searchResult.find(u => u.username === userIdOrUsername);
        if (user) {
          userId = user.id;
        } else {
          throw new Error('Usuario no encontrado');
        }
      }
      
      const response = await fetch(config.API_ENDPOINTS.USERS.FOLLOW_STATUS(userId), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error getting follow status for ${userIdOrUsername}:`, error);
      throw error;
    }
  }

  // Follow a user
  async followUser(userIdOrUsername) {
    try {
      let userId = userIdOrUsername;
      
      // If it looks like a username (no UUID format), resolve it to ID via search
      if (!userIdOrUsername.includes('-') && userIdOrUsername.length > 5) {
        const searchResult = await this.searchUsers(userIdOrUsername);
        const user = searchResult.find(u => u.username === userIdOrUsername);
        if (user) {
          userId = user.id;
        } else {
          throw new Error('Usuario no encontrado');
        }
      }
      
      const response = await fetch(config.API_ENDPOINTS.USERS.FOLLOW(userId), {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error following user ${userIdOrUsername}:`, error);
      throw error;
    }
  }

  // Unfollow a user
  async unfollowUser(userId) {
    try {
      const response = await fetch(config.API_ENDPOINTS.USERS.FOLLOW(userId), {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error unfollowing user ${userId}:`, error);
      throw error;
    }
  }

  // Get followers of a user
  async getUserFollowers(userId) {
    try {
      const response = await fetch(config.API_ENDPOINTS.USERS.FOLLOWERS(userId), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error getting followers for ${userId}:`, error);
      throw error;
    }
  }

  // Get users that a user is following
  async getUserFollowing(userId) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}/following`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error getting following for ${userId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
const userService = new UserService();
export default userService;