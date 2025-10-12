import { formatApiError } from '../utils/apiErrorHandler';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

class UserService {
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

  // Auto-detect if parameter is ID vs username
  async getUserProfile(userParam) {
    try {
      let endpoint;
      
      // Simple heuristic: if it's a long string with dashes, treat as ID
      // Otherwise treat as username
      if (userParam.includes('-') && userParam.length > 20) {
        endpoint = `/user/profile/${userParam}`;
      } else {
        endpoint = `/user/profile/by-username/${userParam}`;
      }
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Usuario no encontrado');
        }
        const errorData = await response.json();
        const errorMessage = formatApiError(errorData, response.status);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await fetch(`${this.baseURL}/user/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async getCurrentUserProfile() {
    try {
      const response = await fetch(`${this.baseURL}/user/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Perfil no encontrado');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting current user profile:', error);
      throw error;
    }
  }

  async followUser(userId) {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}/follow`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  async unfollowUser(userId) {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}/unfollow`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }
}

export default new UserService();