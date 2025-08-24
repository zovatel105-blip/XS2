import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const FollowContext = createContext();

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
};

export const FollowProvider = ({ children }) => {
  const { apiRequest } = useAuth();
  const [followingUsers, setFollowingUsers] = useState(new Map()); // userId -> isFollowing boolean
  const [userCache, setUserCache] = useState(new Map()); // username -> user object cache

  const getUserByUsername = async (username) => {
    try {
      // Check cache first
      if (userCache.has(username)) {
        return userCache.get(username);
      }

      // Search for user
      const response = await apiRequest(`/api/users/search?q=${encodeURIComponent(username)}`);
      const user = response.find(u => u.username === username);
      
      if (user) {
        // Cache the result
        setUserCache(prev => new Map(prev.set(username, user)));
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Error searching user:', error);
      return null;
    }
  };

  const followUser = async (userIdOrUsername) => {
    try {
      let userId = userIdOrUsername;
      let originalKey = userIdOrUsername;  // Mantener la clave original también
      
      // If it looks like a username (no UUID format), try to resolve it to ID
      if (!userIdOrUsername.includes('-') && userIdOrUsername.length > 5) {
        const user = await getUserByUsername(userIdOrUsername);
        if (user) {
          userId = user.id;
        } else {
          return { success: false, error: 'Usuario no encontrado' };
        }
      }

      const response = await apiRequest(`/api/users/${userId}/follow`, {
        method: 'POST',
      });
      
      if (response.message) {
        // Update local state with both keys to ensure compatibility
        setFollowingUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(userId, true);  // Set with resolved user ID
          newMap.set(originalKey, true);  // Set with original key (username)
          return newMap;
        });
        return { success: true, message: response.message };
      }
    } catch (error) {
      console.error('Error following user:', error);
      return { success: false, error: error.message };
    }
  };

  const unfollowUser = async (userIdOrUsername) => {
    try {
      let userId = userIdOrUsername;
      let originalKey = userIdOrUsername;
      
      // If it looks like a username, try to resolve it to ID
      if (!userIdOrUsername.includes('-') && userIdOrUsername.length > 5) {
        const user = await getUserByUsername(userIdOrUsername);
        if (user) {
          userId = user.id;
        }
      }
      
      const response = await apiRequest(`/api/users/${userId}/follow`, {
        method: 'DELETE',
      });
      
      if (response.message) {
        // Update local state with both keys
        setFollowingUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(userId, false);  // Set with resolved user ID
          newMap.set(originalKey, false);  // Set with original key
          return newMap;
        });
        return { success: true, message: response.message };
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return { success: false, error: error.message };
    }
  };

  const getFollowStatus = async (userIdOrUsername) => {
    try {
      let userId = userIdOrUsername;
      let originalKey = userIdOrUsername;
      
      // If it looks like a username, try to resolve it to ID
      if (!userIdOrUsername.includes('-') && userIdOrUsername.length > 5) {
        const user = await getUserByUsername(userIdOrUsername);
        if (user) {
          userId = user.id;
        } else {
          return false;
        }
      }

      const response = await apiRequest(`/api/users/${userId}/follow-status`);
      // Update local cache with both keys
      setFollowingUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, response.is_following);
        newMap.set(originalKey, response.is_following);
        return newMap;
      });
      return response.is_following;
    } catch (error) {
      console.error('Error getting follow status:', error);
      return false;
    }
  };

  const isFollowing = (userId) => {
    return followingUsers.get(userId) || false;
  };

  const getFollowingUsers = async () => {
    try {
      const response = await apiRequest('/api/users/following');
      // Update local cache
      const followingMap = new Map();
      response.following.forEach(user => {
        followingMap.set(user.id, true);
      });
      setFollowingUsers(followingMap);
      return response;
    } catch (error) {
      console.error('Error getting following users:', error);
      return { following: [], total: 0 };
    }
  };

  const getUserFollowers = async (userId) => {
    try {
      const response = await apiRequest(`/api/users/${userId}/followers`);
      return response;
    } catch (error) {
      console.error('Error getting user followers:', error);
      return { followers: [], total: 0 };
    }
  };

  const getUserFollowing = async (userId) => {
    try {
      const response = await apiRequest(`/api/users/${userId}/following`);
      return response;
    } catch (error) {
      console.error('Error getting user following:', error);
      return { following: [], total: 0 };
    }
  };

  const value = {
    followUser,
    unfollowUser,
    getFollowStatus,
    isFollowing,
    getFollowingUsers,
    getUserFollowers,
    getUserFollowing,
    getUserByUsername,
    followingUsers
  };

  return (
    <FollowContext.Provider value={value}>
      {children}
    </FollowContext.Provider>
  );
};