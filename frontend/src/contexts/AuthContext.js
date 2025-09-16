import React, { createContext, useContext, useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage and verify token
  useEffect(() => {
    const initializeAuth = async () => {
      // Check for OAuth session in URL fragment first
      const fragment = window.location.hash.substring(1);
      const params = new URLSearchParams(fragment);
      const sessionId = params.get('session_id');
      
      if (sessionId) {
        // Handle OAuth login
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/oauth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session_id: sessionId }),
          });

          if (response.ok) {
            const data = await response.json();
            
            // Save auth data
            localStorage.setItem('authToken', data.access_token);
            localStorage.setItem('authUser', JSON.stringify(data.user));
            
            setToken(data.access_token);
            setUser(data.user);
            setIsAuthenticated(true);
            
            // Clear the hash from URL
            window.location.hash = '';
            
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('OAuth authentication error:', error);
        }
      }
      
      const savedToken = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('authUser');
      
      if (savedToken && savedUser) {
        try {
          // Verify token with backend
          const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            // Token is valid
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            localStorage.removeItem('userId');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          // Only clear tokens if it's a network error or authentication error
          // Don't clear on temporary network issues
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.warn('Network error during token validation, keeping token');
            // Keep the token and user data for now
          } else {
            // Clear invalid tokens for other errors
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            localStorage.removeItem('userId');
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email });
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          console.error('Login failed:', errorData);
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          // If response is not JSON (e.g., HTML error page), use status text
          console.error('Login failed - non-JSON response:', response.status, response.statusText);
          errorMessage = response.statusText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('El servidor devolvió una respuesta inválida. Verifica la conexión.');
      }
      console.log('Login successful:', { user: data.user?.email, hasToken: !!data.access_token });
      
      // Save auth data
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      
      setToken(data.access_token);
      setUser(data.user);
      setIsAuthenticated(true);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      
      // Distinguish between network errors and authentication errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: 'No se pudo conectar al servidor. Verifica tu conexión.' };
      } else {
        return { success: false, error: error.message };  
      }
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          // If response is not JSON (e.g., HTML error page), use status text
          errorMessage = response.statusText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('El servidor devolvió una respuesta inválida. Verifica la conexión.');
      }
      
      // Save auth data
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      
      setToken(data.access_token);
      setUser(data.user);
      setIsAuthenticated(true);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Distinguish between network errors and registration errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: 'No se pudo conectar al servidor. Verifica tu conexión.' };
      } else {
        return { success: false, error: error.message };
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('userId'); // Clear old userId from addiction system
    
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const getAuthHeaders = () => {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const apiRequest = async (endpoint, options = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Token expired or invalid
      logout();
      throw new Error('Session expired. Please login again.');
    }
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    // Parse JSON response
    return await response.json();
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const userData = await apiRequest('/api/auth/me');
      setUser(userData);
      localStorage.setItem('authUser', JSON.stringify(userData));
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const updateUser = async (updateData) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const updatedUser = await apiRequest('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    user,
    token,
    loading,
    hasVotedAny,
    setHasVotedAny,
    login,
    register,
    logout,
    getAuthHeaders,
    apiRequest,
    refreshUser,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};