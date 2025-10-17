/**
 * Comment Service - Handles all comment-related API calls
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

class CommentService {
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

  // Get comments for a poll
  async getComments(pollId, offset = 0, limit = 20) {
    try {
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseURL}/polls/${pollId}/comments?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get comments error:', error);
      throw error;
    }
  }

  // Create a comment
  async createComment(pollId, commentData) {
    try {
      const response = await fetch(`${this.baseURL}/polls/${pollId}/comments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(commentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create comment error:', error);
      throw error;
    }
  }

  // Like a comment
  async toggleCommentLike(commentId) {
    try {
      const response = await fetch(`${this.baseURL}/comments/${commentId}/like`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Toggle comment like error:', error);
      throw error;
    }
  }

  // Delete a comment
  async deleteComment(commentId) {
    try {
      const response = await fetch(`${this.baseURL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  }

  // Update a comment
  async updateComment(commentId, commentData) {
    try {
      const response = await fetch(`${this.baseURL}/comments/${commentId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(commentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update comment error:', error);
      throw error;
    }
  }

  // Frontend-friendly method to get comments (alias for getComments)
  async getCommentsForFrontend(pollId, limit = 20, offset = 0) {
    return this.getComments(pollId, offset, limit);
  }

  // Frontend-friendly method to add comment (alias for createComment)
  async addCommentForFrontend(pollId, content, parentId = null) {
    const commentData = {
      content,
      ...(parentId && { parent_id: parentId })
    };
    return this.createComment(pollId, commentData);
  }
}

export default new CommentService();