import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AppConfig from '../../config/config.js';

const FollowersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);

  // Función para hacer peticiones autenticadas
  const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${AppConfig.BACKEND_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  };

  // Función para obtener avatar del usuario
  const getAvatarForUser = (user) => {
    if (!user) return '👤';
    
    // Si el usuario tiene avatar_url, devolverlo para que se renderice como imagen
    if (user.avatar_url) {
      return user.avatar_url;
    }
    
    // Si el usuario tiene avatar personalizado, usar iniciales
    if (user.display_name || user.username) {
      const name = user.display_name || user.username;
      return name.charAt(0).toUpperCase();
    }
    
    // Fallback
    return '👤';
  };

  // Función para formatear tiempo
  const formatTimeForInbox = (dateString) => {
    if (!dateString) return '';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  // Cargar seguidores
  const loadFollowers = async () => {
    try {
      setLoading(true);
      const followersResponse = await apiRequest('/api/users/followers/recent');
      
      const followersData = followersResponse.map(follower => ({
        id: `follower-${follower.id}`,
        type: 'new_follower',
        title: `${follower.display_name || follower.username}`,
        message: `@${follower.username} comenzó a seguirte`,
        unreadCount: 0,
        time: formatTimeForInbox(follower.followed_at),
        avatar: follower.avatar_url || getAvatarForUser(follower),
        userId: follower.id,
        isSystem: false
      }));

      setFollowers(followersData);
      setFollowerCount(followersData.length);
    } catch (error) {
      console.log('Error loading followers:', error.message);
      // Estado vacío si no hay datos
      setFollowers([]);
      setFollowerCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    if (user) {
      loadFollowers();
    }
  }, [user]);

  // Manejar clic en follower (navegar a perfil)
  const handleFollowerClick = (follower) => {
    if (follower.isSystem) return;
    window.location.href = `/profile/${follower.userId}`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/messages')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center">
              <Users className="h-6 w-6 text-blue-500 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">
                Nuevos Seguidores
              </h1>
              {followerCount > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                  {followerCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : followers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sin nuevos seguidores
            </h3>
            <p className="text-gray-500">
              Cuando alguien nuevo te siga, aparecerá aquí para que puedas saberlo
            </p>
          </div>
        ) : (
          <div className="bg-white">
            {followers.map((follower, index) => (
              <motion.button
                key={follower.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleFollowerClick(follower)}
                className="w-full flex items-center px-4 py-4 border-b border-gray-100 transition-colors min-h-[72px] hover:bg-gray-50 active:bg-gray-100"
                style={{ touchAction: 'manipulation' }}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full mr-3 flex items-center justify-center text-lg flex-shrink-0 relative overflow-hidden bg-gray-100">
                  {follower.avatar && (follower.avatar.startsWith('http') || follower.avatar.startsWith('/')) ? (
                    <>
                      <img 
                        src={follower.avatar} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.querySelector('.avatar-fallback').style.display = 'flex';
                        }}
                      />
                      <div className="avatar-fallback w-full h-full rounded-full flex items-center justify-center text-lg font-bold" style={{ display: 'none' }}>
                        {follower.title ? follower.title.charAt(0).toUpperCase() : '👤'}
                      </div>
                    </>
                  ) : (
                    follower.avatar
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-semibold truncate text-black">
                      {follower.title} te sigue
                    </span>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {follower.time}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1 leading-relaxed">
                    {follower.message}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowersPage;