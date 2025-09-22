import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, X, ArrowLeft, Users, Bell, Send, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AppConfig from '../../config/config.js';

const MessagesMainPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [segmentData, setSegmentData] = useState({
    followers: { count: 0, loading: true },
    activity: { count: 0, loading: true },
    messages: { count: 0, loading: true }
  });

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

  // Cargar conversaciones
  const loadConversations = async () => {
    try {
      setLoading(true);
      const conversationsData = await apiRequest('/api/conversations');
      setConversations(conversationsData);
    } catch (error) {
      console.log('Error loading conversations:', error.message);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de badges para navegación
  const loadSegmentData = async () => {
    try {
      let followersCount = 0;
      let activityCount = 0;
      let messageRequestsCount = 0;

      // Cargar seguidores
      try {
        const followersResponse = await apiRequest('/api/users/followers/recent');
        followersCount = followersResponse?.length || 0;
      } catch (e) {
        console.log('Followers API not available');
      }

      // Cargar actividad
      try {
        const activityResponse = await apiRequest('/api/users/activity/recent');
        activityCount = activityResponse?.length || 0;
      } catch (e) {
        console.log('Activity API not available');
      }

      // Cargar solicitudes de mensajes
      try {
        const requestsResponse = await apiRequest('/api/messages/requests');
        messageRequestsCount = requestsResponse?.length || 0;
      } catch (e) {
        console.log('Message requests API not available');
      }

      setSegmentData({
        followers: { count: followersCount, loading: false },
        activity: { count: activityCount, loading: false },
        messages: { count: messageRequestsCount, loading: false }
      });

    } catch (error) {
      console.log('Error loading segment data:', error.message);
      setSegmentData({
        followers: { count: 0, loading: false },
        activity: { count: 0, loading: false },
        messages: { count: 0, loading: false }
      });
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    if (user) {
      loadConversations();
      loadSegmentData();
    }
  }, [user]);

  // Manejar apertura de conversación desde navegación
  useEffect(() => {
    if (location.state?.openConversation) {
      setSelectedConversation(location.state.openConversation);
      setShowChat(true);
      // Limpiar el state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Manejar parámetro user en URL para abrir chat directo
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const targetUsername = urlParams.get('user');
    
    if (targetUsername && conversations.length > 0) {
      console.log('🔍 Buscando conversación para usuario:', targetUsername);
      
      // Buscar conversación existente con este usuario
      const existingConversation = conversations.find(conv => {
        const otherUser = conv.participants?.find(p => p.id !== user?.id);
        return otherUser?.username === targetUsername;
      });

      if (existingConversation) {
        console.log('✅ Conversación existente encontrada:', existingConversation.id);
        setSelectedConversation(existingConversation);
        setShowChat(true);
        // Limpiar la URL sin el parámetro user
        navigate('/messages', { replace: true });
      } else {
        // Si no existe conversación, iniciar nueva con el usuario
        console.log('🆕 Iniciando nueva conversación con:', targetUsername);
        handleStartNewConversationWithUser(targetUsername);
        // Limpiar la URL sin el parámetro user
        navigate('/messages', { replace: true });
      }
    }
  }, [location.search, conversations, user, navigate]);

  // Función para iniciar nueva conversación con un usuario específico
  const handleStartNewConversationWithUser = async (username) => {
    try {
      console.log('🔍 Buscando usuario:', username);
      
      // Buscar el usuario por username
      const users = await apiRequest(`/api/users/search?q=${encodeURIComponent(username)}`);
      console.log('📝 Resultados de búsqueda:', users);
      
      const targetUser = users.find(u => u.username === username);
      
      if (targetUser) {
        console.log('✅ Usuario encontrado:', targetUser);
        
        // Crear conversación simulada
        const newConversation = {
          id: `new-${targetUser.id}`,
          participants: [
            {
              id: user.id,
              username: user.username,
              display_name: user.display_name,
              avatar_url: user.avatar_url
            },
            {
              id: targetUser.id,
              username: targetUser.username,
              display_name: targetUser.display_name,
              avatar_url: targetUser.avatar_url
            }
          ],
          last_message: {
            content: '',
            timestamp: new Date().toISOString(),
            sender_id: user.id
          },
          unread_count: 0
        };
        
        console.log('✅ Nueva conversación creada:', newConversation);
        setSelectedConversation(newConversation);
        setShowChat(true);
      } else {
        console.error('❌ Usuario no encontrado en resultados:', username);
        // Mostrar mensaje de error al usuario
        alert(`No se pudo encontrar al usuario: ${username}`);
      }
    } catch (error) {
      console.error('❌ Error buscando usuario:', error);
      // Mostrar mensaje de error al usuario
      alert(`Error al buscar usuario: ${error.message}`);
    }
  };

  // Función para obtener badge count
  const getSegmentBadgeCount = (segmentId) => {
    const data = segmentData[segmentId];
    if (data?.loading) return '...';
    if (!data?.count || data.count === 0) return '';
    return data.count > 99 ? '99+' : data.count.toString();
  };

  // Manejar clic en conversación
  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    setShowChat(true);
  };

  // Cerrar chat
  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedConversation(null);
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {!showChat ? (
        <>
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageCircle className="h-6 w-6 text-blue-500 mr-2" />
                <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Plus className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Navigation Segments */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center space-x-1">
              {/* Navigation to other pages */}
              <button
                onClick={() => navigate('/messages/followers')}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full flex items-center space-x-2 transition-colors relative"
              >
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Nuevos</span>
                {getSegmentBadgeCount('followers') && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {getSegmentBadgeCount('followers')}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate('/messages/activity')}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full flex items-center space-x-2 transition-colors relative"
              >
                <Bell className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Actividad</span>
                {getSegmentBadgeCount('activity') && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {getSegmentBadgeCount('activity')}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate('/messages/requests')}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full flex items-center space-x-2 transition-colors relative"
              >
                <MessageCircle className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Solicitud</span>
                {getSegmentBadgeCount('messages') && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {getSegmentBadgeCount('messages')}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  El Susurro Inteligente
                </h3>
                <p className="text-gray-500">
                  Tus conversaciones aparecerán aquí. Busca usuarios para iniciar nuevos chats
                </p>
              </div>
            ) : (
              <div className="bg-white">
                {conversations.map((conversation, index) => {
                  const otherUser = conversation.participants?.find(p => p.id !== user?.id) || conversation.participants?.[0];
                  if (!otherUser) return null;

                  return (
                    <motion.button
                      key={conversation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleConversationClick(conversation)}
                      className="w-full flex items-center px-6 py-4 border-b border-gray-100 transition-colors min-h-[80px] hover:bg-gray-50 active:bg-gray-100"
                      style={{ touchAction: 'manipulation' }}
                    >
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full mr-4 flex items-center justify-center text-lg flex-shrink-0 relative overflow-hidden bg-gray-100">
                        {otherUser.avatar_url ? (
                          <>
                            <img 
                              src={otherUser.avatar_url} 
                              alt="Avatar" 
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.querySelector('.avatar-fallback').style.display = 'flex';
                              }}
                            />
                            <div className="avatar-fallback w-full h-full rounded-full flex items-center justify-center text-xl font-bold text-gray-600" style={{ display: 'none' }}>
                              {otherUser.display_name ? otherUser.display_name.charAt(0).toUpperCase() : '👤'}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full rounded-full flex items-center justify-center text-xl font-bold text-gray-600">
                            {getAvatarForUser(otherUser)}
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-semibold truncate text-gray-900">
                            {otherUser.display_name || otherUser.username || 'Usuario'}
                          </span>
                          <span className="text-sm text-gray-500 ml-2 flex-shrink-0">
                            {formatTimeForInbox(conversation.last_message_at || conversation.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate leading-relaxed">
                          {conversation.last_message || 'Iniciar conversación'}
                        </p>
                      </div>

                      {/* Unread Badge */}
                      {conversation.unread_count > 0 && (
                        <div 
                          className="min-w-[24px] h-6 rounded-full flex items-center justify-center ml-3 flex-shrink-0"
                          style={{ backgroundColor: '#FF4B8D' }}
                        >
                          <span className="text-xs text-white font-medium px-2">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Chat View */
        <div className="flex flex-col h-full bg-white">
          {/* Chat Header */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center">
              <button
                onClick={handleCloseChat}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 relative overflow-hidden">
                  {selectedConversation?.participants?.[0]?.avatar_url ? (
                    <>
                      <img 
                        src={selectedConversation.participants[0].avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.querySelector('.avatar-fallback').style.display = 'flex';
                        }}
                      />
                      <div className="avatar-fallback w-full h-full rounded-full flex items-center justify-center text-sm font-semibold text-gray-600" style={{ display: 'none' }}>
                        {selectedConversation?.participants?.[0]?.display_name?.charAt(0) || '👤'}
                      </div>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-gray-600">
                      {selectedConversation?.participants?.[0]?.display_name?.charAt(0) || '👤'}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedConversation?.participants?.[0]?.display_name || 'Usuario'}
                </h2>
              </div>
            </div>
          </div>

          {/* Perfil Central */}
          <div className="flex-shrink-0 bg-white px-4 py-6 border-b border-gray-100">
            <div className="flex flex-col items-center text-center">
              {/* Logo principal del perfil */}
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4 relative overflow-hidden">
                {selectedConversation?.participants?.[0]?.avatar_url ? (
                  <>
                    <img 
                      src={selectedConversation.participants[0].avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.querySelector('.avatar-fallback').style.display = 'flex';
                      }}
                    />
                    <div className="avatar-fallback w-full h-full rounded-full flex items-center justify-center text-2xl font-bold text-gray-600" style={{ display: 'none' }}>
                      {selectedConversation?.participants?.[0]?.display_name?.charAt(0) || '👤'}
                    </div>
                  </>
                ) : (
                  <span className="text-2xl font-semibold text-gray-600">
                    {selectedConversation?.participants?.[0]?.display_name?.charAt(0) || '👤'}
                  </span>
                )}
              </div>
              
              {/* Nombre del perfil */}
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {selectedConversation?.participants?.[0]?.display_name || 'Usuario'}
              </h3>
              
              {/* Nombre de usuario en gris claro */}
              <p className="text-base text-gray-400 mb-2">
                @{selectedConversation?.participants?.[0]?.username || 'usuario'}
              </p>
              
              {/* Estadísticas en gris medio y tamaño pequeño */}
              <div className="text-sm text-gray-500">
                <span>0 votos • 0 seguidores</span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex justify-center">
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <span className="text-sm text-gray-600">Conversación iniciada</span>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newMessage.trim()) {
                    // TODO: Implementar envío de mensaje
                    console.log('Sending message:', newMessage);
                    setNewMessage('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newMessage.trim()) {
                    console.log('Sending message:', newMessage);
                    setNewMessage('');
                  }
                }}
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesMainPage;