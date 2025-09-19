// Ultra-Addictive API Service
const API_BASE = process.env.REACT_APP_BACKEND_URL;

class AddictionAPI {
  
  // User Profile & Stats
  async createUserProfile(username) {
    const response = await fetch(`${API_BASE}/api/user/profile?username=${username}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response.json();
  }

  async getUserProfile(userId) {
    const response = await fetch(`${API_BASE}/api/user/profile/${userId}`);
    return response.json();
  }

  async trackUserAction(userId, actionType, context = {}) {
    const response = await fetch(`${API_BASE}/api/user/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        action_type: actionType,
        context: context
      })
    });
    return response.json();
  }

  async trackUserBehavior(behaviorData) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_BASE}/api/user/behavior`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(behaviorData)
    });
    return response.json();
  }

  // Achievements & Streaks
  async getUserAchievements(userId) {
    const response = await fetch(`${API_BASE}/api/user/${userId}/achievements`);
    return response.json();
  }

  async getAllAchievements() {
    const response = await fetch(`${API_BASE}/api/achievements`);
    return response.json();
  }

  async getUserStreaks(userId) {
    const response = await fetch(`${API_BASE}/api/user/${userId}/streaks`);
    return response.json();
  }

  // FOMO & Social Proof
  async getFOMOContent() {
    const response = await fetch(`${API_BASE}/api/fomo/content`);
    return response.json();
  }

  async getSocialProof(pollId) {
    const response = await fetch(`${API_BASE}/api/social-proof/${pollId}`);
    return response.json();
  }

  // Leaderboards
  async getLeaderboard() {
    const response = await fetch(`${API_BASE}/api/leaderboard`);
    return response.json();
  }

  // Notifications
  async generateSmartNotifications(userId) {
    const response = await fetch(`${API_BASE}/api/notifications/generate/${userId}`, {
      method: 'POST'
    });
    return response.json();
  }

  // Analytics
  async getAddictionAnalytics(userId) {
    const response = await fetch(`${API_BASE}/api/analytics/addiction/${userId}`);
    return response.json();
  }

  // Special Effects
  async triggerJackpot(userId) {
    const response = await fetch(`${API_BASE}/api/user/${userId}/jackpot`, {
      method: 'POST'
    });
    return response.json();
  }

}

export const addictionAPI = new AddictionAPI();

import AppConfig from '../config/config';
export class BehaviorTracker {
  constructor() {
    this.sessionStart = Date.now();
    this.pollsViewed = 0;
    this.pollsVoted = 0;
    this.pollsCreated = 0;
    this.likesGiven = 0;
    this.sharesMade = 0;
    this.scrollDepth = 0;
    this.interactions = 0;
    this.totalActions = 0;
    
    // Track page visibility
    this.setupVisibilityTracking();
    
    // Send behavior data using configurable interval
    this.behaviorInterval = setInterval(() => {
      this.sendBehaviorData();
    }, AppConfig.BEHAVIOR_TRACKING_INTERVAL);
  }

  setupVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.sendBehaviorData();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.sendBehaviorData();
    });
  }

  trackPollView() {
    this.pollsViewed++;
    this.interactions++;
    this.totalActions++;
  }

  trackVote() {
    this.pollsVoted++;
    this.interactions++;
    this.totalActions++;
  }

  trackPollCreation() {
    this.pollsCreated++;
    this.interactions++;
    this.totalActions++;
  }

  trackLike() {
    this.likesGiven++;
    this.interactions++;
    this.totalActions++;
  }

  trackShare() {
    this.sharesMade++;
    this.interactions++;
    this.totalActions++;
  }

  trackScroll(depth) {
    this.scrollDepth = Math.max(this.scrollDepth, depth);
  }

  async sendBehaviorData() {
    const currentUserId = localStorage.getItem('authUser');
    const token = localStorage.getItem('token');
    
    // Don't send behavior data if user is not authenticated
    if (!currentUserId || !token) {
      return;
    }
    
    const sessionDuration = Math.floor((Date.now() - this.sessionStart) / 1000);
    const interactionRate = this.totalActions > 0 ? this.interactions / this.totalActions : 0;

    const behaviorData = {
      user_id: currentUserId,
      session_duration: sessionDuration,
      polls_viewed: this.pollsViewed,
      polls_voted: this.pollsVoted,
      polls_created: this.pollsCreated,
      likes_given: this.likesGiven,
      shares_made: this.sharesMade,
      scroll_depth: this.scrollDepth,
      interaction_rate: interactionRate,
      peak_hours: [new Date().getHours()],
      device_type: this.getDeviceType(),
      timestamp: new Date().toISOString()
    };

    try {
      await addictionAPI.trackUserBehavior(behaviorData);
    } catch (error) {
      console.error('Failed to send behavior data:', error);
    }
  }

  getDeviceType() {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  destroy() {
    if (this.behaviorInterval) {
      clearInterval(this.behaviorInterval);
    }
    this.sendBehaviorData();
  }
}

// Global behavior tracker instance
export const behaviorTracker = new BehaviorTracker();