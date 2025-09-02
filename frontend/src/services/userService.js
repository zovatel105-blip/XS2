import config from '../config/config';

class UserService {
  constructor() {
    this.baseURL = config.API.USERS.SEARCH.split('/search')[0]; // Get base users URL
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

  // Get user profile by user ID or username
  async getUserProfile(userId) {
    try {
      const response = await fetch(config.API.USERS.PROFILE(userId), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching user profile for ${userId}:`, error);
      throw error;
    }
  }

  // Search users by query
  async searchUsers(query) {
    try {
      const response = await fetch(`${config.API.USERS.SEARCH}?q=${encodeURIComponent(query)}`, {
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
  async getFollowStatus(userId) {
    try {
      const response = await fetch(config.API.USERS.FOLLOW_STATUS(userId), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error getting follow status for ${userId}:`, error);
      throw error;
    }
  }

  // Follow a user
  async followUser(userId) {
    try {
      const response = await fetch(config.API.USERS.FOLLOW(userId), {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error following user ${userId}:`, error);
      throw error;
    }
  }

  // Unfollow a user
  async unfollowUser(userId) {
    try {
      const response = await fetch(config.API.USERS.FOLLOW(userId), {
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
      const response = await fetch(config.API.USERS.FOLLOWERS(userId), {
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