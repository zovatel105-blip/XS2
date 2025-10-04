// Minimal mock data for development/testing fallbacks only
// This file contains only essential fallback data for when backend is unavailable

// Essential fallback data for demo/development
export const fallbackUsers = [
  {
    username: 'demo_user',
    displayName: 'Demo User',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    verified: false,
    followers: '1K'
  }
];

// Utility function for file conversion (still needed)
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Legacy exports for backward compatibility (minimal functionality)
export const mockPolls = [];
export const mockComments = {};

export const voteOnPoll = (pollId, optionId) => {
  console.warn('voteOnPoll: Using mock function - should use real backend service');
  return false;
};

export const toggleLike = (pollId) => {
  console.warn('toggleLike: Using mock function - should use real backend service');
  return false;
};

export const createPoll = (pollData) => {
  console.warn('createPoll: Using mock function - should use real backend service');
  return null;
};