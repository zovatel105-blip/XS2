import config from '../config/config';

class StoryService {
  constructor() {
    this.baseURL = config.BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
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

  // Create a new story
  async createStory(storyData) {
    try {
      const response = await fetch(`${this.baseURL}/api/stories`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(storyData),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  // Get stories from followed users and own stories
  async getStories(limit = 50) {
    try {
      const response = await fetch(`${this.baseURL}/api/stories?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error getting stories:', error);
      throw error;
    }
  }

  // Get stories from a specific user
  async getUserStories(userId) {
    try {
      const response = await fetch(`${this.baseURL}/api/stories/user/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error getting user stories:', error);
      throw error;
    }
  }

  // Mark a story as viewed
  async viewStory(storyId) {
    try {
      const response = await fetch(`${this.baseURL}/api/stories/${storyId}/view`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error viewing story:', error);
      throw error;
    }
  }

  // Toggle like on a story
  async toggleStoryLike(storyId) {
    try {
      const response = await fetch(`${this.baseURL}/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error toggling story like:', error);
      throw error;
    }
  }

  // Delete a story
  async deleteStory(storyId) {
    try {
      const response = await fetch(`${this.baseURL}/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }

  // Check if a user has active stories
  async checkUserHasStories(userId) {
    try {
      const response = await fetch(`${this.baseURL}/api/users/${userId}/has-stories`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error checking user stories:', error);
      // Return default values on error
      return { has_stories: false, story_count: 0 };
    }
  }

  // Helper method to check if story has expired
  isStoryExpired(story) {
    const now = new Date();
    const expiresAt = new Date(story.expires_at);
    return now > expiresAt;
  }

  // Helper method to get remaining time for story
  getStoryRemainingTime(story) {
    const now = new Date();
    const expiresAt = new Date(story.expires_at);
    const remainingMs = expiresAt - now;
    
    if (remainingMs <= 0) return "Expirada";
    
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Helper method to create story data for API
  createStoryData({
    contentUrl = null,
    textContent = null,
    storyType,
    privacy = 'public',
    backgroundColor = '#000000',
    textColor = '#FFFFFF',
    fontStyle = 'default',
    duration = 15
  }) {
    return {
      content_url: contentUrl,
      text_content: textContent,
      story_type: storyType,
      privacy: privacy,
      background_color: backgroundColor,
      text_color: textColor,
      font_style: fontStyle,
      duration: duration
    };
  }
}

const storyService = new StoryService();
export default storyService;