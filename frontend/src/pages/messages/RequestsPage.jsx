import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AppConfig from '../../config/config.js';

const RequestsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestCount, setRequestCount] = useState(0);

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
    
    if (user.avatar_url) {
      return user.avatar_url;
    }
    
    if (user.display_name || user.username) {
      const name = user.display_name || user.username;
      return name.charAt(0).toUpperCase();
    }
    
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

  // Cargar solicitudes de mensajes
  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestsResponse = await apiRequest('/api/messages/requests');
      
      const requestsData = requestsResponse.map(request => ({
        id: `request-${request.id}`,
        type: 'message_request',
        title: `${request.sender.display_name || request.sender.username}`,
        message: request.preview || 'Te ha enviado una solicitud de mensaje',
        unreadCount: 1,
        time: formatTimeForInbox(request.created_at),
        avatar: request.sender.avatar_url, // Usar directamente avatar_url
        fallbackAvatar: getAvatarForUser(request.sender), // Separar el fallback
        userId: request.sender.id,
        requestId: request.id,
        isSystem: false,
        needsApproval: true
      }));

      setRequests(requestsData);
      setRequestCount(requestsData.length);
    } catch (error) {
      console.log('Error loading message requests:', error.message);
      setRequests([]);
      setRequestCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  // Manejar clic en solicitud (abrir conversación)
  const handleRequestClick = (request) => {
    if (request.isSystem) return;
    
    // Navegar a messages para abrir la conversación con la solicitud
    navigate('/messages', { 
      state: { 
        openConversation: {
          id: `request-${request.requestId}`,
          participants: [{
            id: request.userId,
            username: request.title.replace(/[^\w]/g, '').toLowerCase(),
            display_name: request.title
          }],
          is_chat_request: true,
          is_request_receiver: true,
          chat_request_id: request.requestId
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/messages')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center">
              <MessageCircle className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">
                Solicitudes de Mensajes
              </h1>
              {requestCount > 0 && (
                <span className="ml-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                  {requestCount}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 bg-white">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sin solicitudes de mensajes
            </h3>
            <p className="text-gray-500">
              Las solicitudes de personas que no sigues aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="bg-white">
            {requests.map((request, index) => (
              <motion.button
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleRequestClick(request)}
                className="w-full flex items-center px-4 py-4 border-b border-gray-100 transition-colors min-h-[72px] hover:bg-gray-50 active:bg-gray-100"
                style={{ touchAction: 'manipulation' }}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full mr-3 flex items-center justify-center text-lg flex-shrink-0 relative overflow-hidden bg-gray-100">
                  {request.avatar ? (
                    <>
                      <img 
                        src={request.avatar} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          // Si la imagen falla al cargar, ocultar imagen y mostrar fallback
                          e.target.style.display = 'none';
                          e.target.parentNode.querySelector('.avatar-fallback').style.display = 'flex';
                        }}
                      />
                      <div className="avatar-fallback w-full h-full rounded-full flex items-center justify-center text-lg font-bold" style={{ display: 'none' }}>
                        {request.fallbackAvatar}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center text-lg font-bold">
                      {request.fallbackAvatar}
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-semibold truncate text-black">
                      {request.title}
                    </span>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {request.time}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1 leading-relaxed">
                    {request.message}
                  </p>
                </div>

                {/* Badge de solicitud pendiente */}
                {request.needsApproval && (
                  <div className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    Nueva
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestsPage;