import AppConfig from '../config/config';

class FeedMenuService {
  constructor() {
    this.baseURL = AppConfig.BACKEND_URL;
  }

  async makeRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Feed Menu API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  async markNotInterested(pollId) {
    return this.makeRequest('/api/feed/not-interested', {
      method: 'POST',
      body: JSON.stringify({ poll_id: pollId })
    });
  }

  async hideUser(authorId) {
    return this.makeRequest('/api/feed/hide-user', {
      method: 'POST',
      body: JSON.stringify({ author_id: authorId })
    });
  }

  async toggleNotifications(authorId) {
    return this.makeRequest('/api/feed/toggle-notifications', {
      method: 'POST',
      body: JSON.stringify({ author_id: authorId })
    });
  }

  async reportContent(pollId, reportData) {
    return this.makeRequest('/api/feed/report', {
      method: 'POST',
      body: JSON.stringify({
        poll_id: pollId,
        category: reportData.category,
        comment: reportData.comment,
        reportedBy: reportData.reportedBy,
        pollAuthor: reportData.pollAuthor,
        timestamp: reportData.timestamp
      })
    });
  }

  async getUserPreferences() {
    return this.makeRequest('/api/feed/user-preferences', {
      method: 'GET'
    });
  }
}

const feedMenuService = new FeedMenuService();
export default feedMenuService;