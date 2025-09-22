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
  
  // Debug: Log inicial
  console.log('🔍 MessagesMainPage - URL actual:', location.pathname + location.search);
  console.log('🔍 MessagesMainPage - Usuario:', user?.username);
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
    console.log('🚀 MessagesMainPage montado, usuario:', user?.username);
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

  // Estado para manejar navegación directa a usuario
  const [pendingUserToOpen, setPendingUserToOpen] = useState(null);
  
  // Estado para estadísticas del usuario en chat
  const [userStats, setUserStats] = useState({});

  // Detectar parámetro user en URL inmediatamente
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const targetUsername = urlParams.get('user');
    
    console.log('🔍 useEffect URL - Parámetro user detectado:', targetUsername);
    console.log('🔍 useEffect URL - location.search:', location.search);
    
    if (targetUsername) {
      setPendingUserToOpen(targetUsername);
      // Limpiar la URL inmediatamente
      navigate('/messages', { replace: true });
    }
  }, [location.search, navigate]);

  // Procesar usuario pendiente cuando las conversaciones estén listas
  useEffect(() => {
    if (pendingUserToOpen && user) {
      console.log('🔍 Procesando usuario pendiente:', pendingUserToOpen);
      console.log('🔍 Conversaciones disponibles:', conversations.length);
      
      // Buscar conversación existente
      const existingConversation = conversations.find(conv => {
        const otherUser = conv.participants?.find(p => p.id !== user?.id);
        const found = otherUser?.username === pendingUserToOpen;
        if (found) {
          console.log('✅ Conversación encontrada con:', otherUser.username);
        }
        return found;
      });

      if (existingConversation) {
        console.log('✅ Abriendo conversación existente:', existingConversation.id);
        setSelectedConversation(existingConversation);
        setShowChat(true);
      } else {
        console.log('🆕 Creando nueva conversación con:', pendingUserToOpen);
        handleStartNewConversationWithUser(pendingUserToOpen);
      }
      
      // Limpiar usuario pendiente
      setPendingUserToOpen(null);
    }
  }, [pendingUserToOpen, conversations, user]);

  // Cargar mensajes de una conversación
  const loadMessages = async (conversationId) => {
    try {
      console.log('📥 Cargando mensajes para conversación:', conversationId);
      
      // Si es una conversación nueva (id empieza con 'new-'), no hay mensajes que cargar
      if (conversationId.startsWith('new-')) {
        setMessages([]);
        return;
      }
      
      const messagesData = await apiRequest(`/api/conversations/${conversationId}/messages`);
      console.log('✅ Mensajes cargados:', messagesData.length);
      setMessages(messagesData || []);
    } catch (error) {
      console.error('❌ Error cargando mensajes:', error);
      setMessages([]);
    }
  };

  // Cargar estadísticas del usuario
  const loadUserStats = async (userId) => {
    try {
      console.log('📊 Cargando estadísticas para usuario:', userId);
      console.log('📊 Tipo de userId:', typeof userId);
      console.log('📊 UserStats cache actual:', userStats);
      
      // Si ya tenemos las estadísticas cached, no recargar
      if (userStats[userId]) {
        console.log('📊 Estadísticas encontradas en cache:', userStats[userId]);
        return userStats[userId];
      }
      
      // Cargar estadísticas del usuario desde el backend
      console.log('📊 Haciendo request a API:', `/api/user/profile/${userId}`);
      const userProfile = await apiRequest(`/api/user/profile/${userId}`);
      console.log('📊 Respuesta del API completa:', userProfile);
      
      // Extraer estadísticas del perfil del usuario
      const stats = {
        votes: userProfile.total_votes || 0,
        followers: userProfile.followers_count || 0,
        following: userProfile.following_count || 0,
        votes_made: userProfile.votes_count || 0
      };
      
      console.log('✅ Estadísticas procesadas:', stats);
      
      // Cachear las estadísticas
      setUserStats(prev => {
        const newStats = {
          ...prev,
          [userId]: stats
        };
        console.log('📊 Actualizando cache con:', newStats);
        return newStats;
      });
      
      return stats;
    } catch (error) {
      console.error('❌ Error cargando estadísticas completo:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Retornar estadísticas por defecto en caso de error
      const defaultStats = {
        votes: 0,
        followers: 0,
        following: 0,
        votes_made: 0
      };
      
      console.log('📊 Usando estadísticas por defecto:', defaultStats);
      
      // Cachear las estadísticas por defecto para evitar llamadas repetidas
      setUserStats(prev => ({
        ...prev,
        [userId]: defaultStats
      }));
      
      return defaultStats;
    }
  };

  // Cuando se selecciona una conversación, cargar estadísticas del otro usuario
  useEffect(() => {
    console.log('🔄 useEffect selectedConversation cambió:', selectedConversation);
    
    if (selectedConversation) {
      console.log('🔄 Participants:', selectedConversation.participants);
      const otherUser = selectedConversation.participants?.find(p => p.id !== user?.id);
      console.log('🔄 User actual:', user?.id, user?.username);
      console.log('🔄 Other user encontrado:', otherUser);
      
      if (otherUser && otherUser.id) {
        console.log('🔄 Cargando estadísticas para:', otherUser.id, otherUser.username);
        loadUserStats(otherUser.id);
      } else {
        console.warn('⚠️ No se pudo encontrar otherUser o no tiene ID válido');
      }
      
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    const tempMessageId = `temp-${Date.now()}`;
    
    // Crear mensaje temporal para mostrar inmediatamente en la UI
    const tempMessage = {
      id: tempMessageId,
      content: messageContent,
      sender_id: user.id,
      timestamp: new Date().toISOString(),
      sender: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url
      },
      status: 'sending' // Estado temporal
    };

    try {
      console.log('📤 Enviando mensaje:', messageContent);
      
      // Agregar mensaje temporal a la UI inmediatamente
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      setNewMessage('');

      // Determinar el destinatario
      let recipient = selectedConversation.participants?.find(p => p.id !== user.id);
      
      console.log('🔍 Debug recipient:', {
        conversationId: selectedConversation.id,
        participants: selectedConversation.participants,
        userId: user.id,
        recipient: recipient,
        recipientId: recipient?.id
      });
      
      if (!recipient) {
        throw new Error('No se pudo encontrar el destinatario');
      }

      if (!recipient.id) {
        throw new Error('El destinatario no tiene ID válido');
      }

      // Enviar mensaje al backend
      const messagePayload = {
        recipient_id: recipient.id,
        content: messageContent
      };
      
      console.log('📤 Payload enviando al backend:', messagePayload);
      console.log('🔍 Tipo de recipient.id:', typeof recipient.id);
      console.log('🔍 Valor exacto recipient.id:', JSON.stringify(recipient.id));
      console.log('🔍 Tipo de content:', typeof messageContent);
      console.log('🔍 Valor exacto content:', JSON.stringify(messageContent));
      
      const response = await apiRequest('/api/messages', {
        method: 'POST',
        body: messagePayload
      });

      console.log('✅ Mensaje enviado exitosamente:', response);

      // Actualizar el mensaje temporal con la respuesta del servidor
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === tempMessageId
            ? { ...response, status: 'sent' }
            : msg
        )
      );

      // Actualizar la conversación con el último mensaje
      setSelectedConversation(prev => ({
        ...prev,
        last_message: {
          content: messageContent,
          timestamp: response.timestamp,
          sender_id: user.id
        }
      }));

      // Recargar conversaciones para actualizar la lista
      loadConversations();

    } catch (error) {
      console.error('❌ Error enviando mensaje COMPLETO:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Si es un error HTTP, intentar obtener más detalles
      if (error.message && error.message.includes('422')) {
        console.error('❌ Error 422 detectado - problema de validación en backend');
      }
      
      // Marcar mensaje como fallido
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === tempMessageId
            ? { ...msg, status: 'failed' }
            : msg
        )
      );

      // Mostrar error al usuario
      alert(`Error al enviar mensaje: ${error.message}`);
    }
  };

  // Función para manejar envío con Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && newMessage.trim()) {
      handleSendMessage();
    }
  };
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
                {(() => {
                  const otherUser = selectedConversation?.participants?.[0];
                  const stats = otherUser ? userStats[otherUser.id] : null;
                  
                  if (stats) {
                    return (
                      <span>
                        {stats.votes} voto{stats.votes !== 1 ? 's' : ''} • {stats.followers} seguidor{stats.followers !== 1 ? 'es' : ''}
                      </span>
                    );
                  }
                  
                  // Mostrar loading o datos por defecto mientras cargan
                  return <span>Cargando estadísticas...</span>;
                })()}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Mensaje de inicio de conversación */}
            <div className="flex justify-center">
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <span className="text-sm text-gray-600">Conversación iniciada</span>
              </div>
            </div>
            
            {/* Renderizar mensajes */}
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === user?.id;
              const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].sender_id !== message.sender_id);
              
              return (
                <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                  <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar para mensajes de otros usuarios */}
                    {showAvatar && !isOwnMessage && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        {message.sender?.avatar_url ? (
                          <img 
                            src={message.sender.avatar_url} 
                            alt="Avatar" 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-600">
                            {message.sender?.display_name?.charAt(0) || '👤'}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Spacer cuando no se muestra avatar */}
                    {!showAvatar && !isOwnMessage && <div className="w-8" />}
                    
                    {/* Mensaje */}
                    <div className={`relative px-4 py-2 rounded-2xl ${
                      isOwnMessage 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Indicador de estado para mensajes propios */}
                      {isOwnMessage && message.status && (
                        <div className="absolute -bottom-1 -right-1">
                          {message.status === 'sending' && (
                            <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
                          )}
                          {message.status === 'sent' && (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          )}
                          {message.status === 'failed' && (
                            <div className="w-3 h-3 bg-red-500 rounded-full cursor-pointer" title="Error al enviar"></div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Timestamp */}
                  <div className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'text-right mr-2' : 'text-left ml-2'}`}>
                    {new Date(message.timestamp).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              );
            })}
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
                onKeyPress={handleKeyPress}
              />
              <button
                onClick={handleSendMessage}
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