import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Camera, Mic, Smile, Heart, Info, Phone, Video, Plus, Image, X, Bell, Check, UserX, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MessagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionTarget, setReactionTarget] = useState(null);
  const [ephemeralMode, setEphemeralMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [chatRequests, setChatRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const { user, apiRequest } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const longPressTimer = useRef(null);

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const showList = !selectedConversation || !isMobile;
  const showChat = selectedConversation && (isMobile || !isMobile);

  // Función para generar colores de avatar únicos basados en el nombre
  const getAvatarColors = (name) => {
    const colors = [
      'from-purple-400 to-pink-400',
      'from-blue-400 to-indigo-500',
      'from-green-400 to-teal-500',
      'from-yellow-400 to-orange-500',
      'from-red-400 to-pink-500',
      'from-indigo-400 to-purple-500',
      'from-teal-400 to-cyan-500',
      'from-orange-400 to-red-500'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Función para obtener iniciales del nombre
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Función para determinar si un usuario está online (simulado por ahora)
  const isUserOnline = (userId) => {
    // Por ahora simulamos algunos usuarios online
    const onlineUsers = [user?.id]; // El usuario actual siempre está online
    return onlineUsers.includes(userId);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadConversations();
    loadChatRequests();
  }, []);

  // Procesar parámetro 'user' de la URL para iniciar chat desde perfil
  useEffect(() => {
    const targetParam = searchParams.get('user');
    if (targetParam && user && conversations.length >= 0) {
      console.log('🎯 Processing URL parameter:', targetParam);
      handleChatFromProfile(targetParam);
    }
  }, [searchParams, user, conversations]);

  const handleChatFromProfile = async (targetParam) => {
    try {
      console.log('🔍 CHAT FROM PROFILE DEBUG:', {
        targetParam,
        userParam: searchParams.get('user'),
        conversations: conversations.length
      });
      
      // Limpiar el parámetro de la URL
      setSearchParams({});
      
      // Buscar si ya existe una conversación con este usuario (por username o ID)
      const existingConv = conversations.find(conv => 
        conv.participants.some(p => 
          p.username === targetParam || 
          p.id === targetParam
        )
      );

      console.log('🔍 Existing conversation search:', {
        found: !!existingConv,
        conversationsChecked: conversations.length,
        searchingFor: targetParam
      });

      if (existingConv) {
        console.log('✅ Found existing conversation, opening:', existingConv.id);
        setSelectedConversation(existingConv);
        return;
      }

      // Si no existe conversación, buscar el usuario
      console.log('🔍 Searching for user:', targetParam);
      
      // Intentar buscar por username primero
      let searchResults = await apiRequest(`/api/users/search?q=${encodeURIComponent(targetParam)}`);
      let targetUser = searchResults.find(u => u.username === targetParam);
      
      // Si no se encuentra por username, intentar buscar por ID
      if (!targetUser && targetParam) {
        try {
          const profileResponse = await apiRequest(`/api/user/profile/${targetParam}`);
          if (profileResponse) {
            targetUser = {
              id: profileResponse.id,
              username: profileResponse.username,
              display_name: profileResponse.display_name
            };
          }
        } catch (profileError) {
          console.log('⚠️ Could not find user by ID:', profileError.message);
        }
      }
      
      console.log('🔍 User search result:', {
        searchResults: searchResults.length,
        targetUser: targetUser ? `${targetUser.username}(${targetUser.id})` : 'not found',
        searchParam: targetParam
      });
      
      if (targetUser) {
        console.log('✅ Usuario encontrado, abriendo conversación:', targetUser.display_name);
        
        // Crear una conversación temporal para permitir al usuario escribir su mensaje
        const tempConv = {
          id: null, // Se creará cuando se envíe el primer mensaje
          participants: [targetUser],
          last_message: null,
          last_message_at: null,
          unread_count: 0
        };
        
        setSelectedConversation(tempConv);
        
        toast({
          title: "Chat abierto",
          description: `Puedes enviar un mensaje a ${targetUser.display_name}`,
        });
      } else {
        console.error('❌ Usuario no encontrado:', targetParam);
        toast({
          title: "Usuario no encontrado",
          description: "No se pudo encontrar el usuario especificado",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error manejando chat desde perfil:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el chat desde el perfil",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && selectedConversation.id) {
      loadMessages(selectedConversation.id);
      const interval = setInterval(() => {
        loadMessages(selectedConversation.id);
      }, 5000); // Reducido a 5 segundos para mejor UX
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const data = await apiRequest('/api/conversations');
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadChatRequests = async () => {
    try {
      const data = await apiRequest('/api/chat-requests/received');
      setChatRequests(data);
    } catch (error) {
      console.error('Error loading chat requests:', error);
    }
  };

  const handleChatRequest = async (requestId, action) => {
    try {
      const response = await apiRequest(`/api/chat-requests/${requestId}`, {
        method: 'PUT',
        body: { action }
      });

      if (response.success) {
        toast({
          title: action === 'accept' ? "Solicitud aceptada" : "Solicitud rechazada",
          description: response.message,
        });

        // Reload chat requests and conversations
        await loadChatRequests();
        await loadConversations();

        // If accepted, navigate to the new conversation
        if (action === 'accept' && response.conversation_id) {
          const conversation = await apiRequest(`/api/conversations`);
          const newConv = conversation.find(c => c.id === response.conversation_id);
          if (newConv) {
            setSelectedConversation(newConv);
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud",
        variant: "destructive"
      });
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const data = await apiRequest(`/api/conversations/${conversationId}/messages`);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest(`/api/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Funciones del chat
  const handleLongPress = (messageId) => {
    setReactionTarget(messageId);
    setShowEmojiPicker(true);
  };

  const startLongPress = (messageId) => {
    longPressTimer.current = setTimeout(() => {
      handleLongPress(messageId);
    }, 500);
  };

  const endLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const addReaction = async (messageId, emoji) => {
    try {
      await apiRequest(`/api/messages/${messageId}/reaction`, {
        method: 'POST',
        body: { emoji }
      });
      setShowEmojiPicker(false);
      setReactionTarget(null);
      if (selectedConversation && selectedConversation.id) {
        loadMessages(selectedConversation.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar la reacción",
        variant: "destructive"
      });
    }
  };

  const startConversation = async (selectedUser) => {
    // Check if conversation already exists
    const existingConv = conversations.find(conv => 
      conv.participants.some(p => p.id === selectedUser.id)
    );

    if (existingConv) {
      setSelectedConversation(existingConv);
    } else {
      // Crear conversación temporal para permitir al usuario escribir su mensaje
      const tempConv = {
        id: null, // Se creará cuando se envíe el primer mensaje
        participants: [selectedUser],
        last_message: null,
        last_message_at: null,
        unread_count: 0
      };
      setSelectedConversation(tempConv);
    }
    
    setShowNewChat(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    try {
      const recipientId = selectedConversation.participants[0].id;
      
      const response = await apiRequest('/api/messages', {
        method: 'POST',
        body: {
          recipient_id: recipientId,
          content: messageText,
          message_type: 'text',
          is_ephemeral: ephemeralMode
        }
      });

      // Si es una conversación temporal (nueva), recargar conversaciones
      if (!selectedConversation.id) {
        await loadConversations();
        
        // Buscar la nueva conversación creada y cambiar a ella
        setTimeout(async () => {
          await loadConversations();
          const newConv = conversations.find(conv => 
            conv.participants.some(p => p.id === recipientId)
          );
          if (newConv) {
            setSelectedConversation(newConv);
            loadMessages(newConv.id);
          }
        }, 1000);
      } else {
        // Si es una conversación existente, solo recargar mensajes
        loadMessages(selectedConversation.id);
      }
      
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return "ahora";
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInDays === 1) {
      return "ayer";
    } else if (diffInDays < 7) {
      return `${diffInDays}d`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor((now - date) / (1000 * 60));
      return minutes < 1 ? "ahora" : `${minutes}m`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Instagram-style emoji reactions
  const quickEmojis = ['❤️', '😂', '😮', '😢', '😡', '👍'];

  return (
    <div className="h-screen bg-gray-50 flex relative">
      {/* Lista de Conversaciones - Instagram Style Mejorado */}
      {showList && (
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm"
        >
          {/* Header estilo Instagram mejorado */}
          <div className="p-4 border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarColors(user?.display_name || user?.username || 'User')} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-sm font-semibold">
                    {getInitials(user?.display_name || user?.username || 'User')}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  {user?.username || 'Mensajes'}
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                {/* Notificaciones */}
                {chatRequests.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowRequests(!showRequests)}
                    className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Bell className="w-5 h-5 text-gray-700" />
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
                    >
                      {chatRequests.length}
                    </motion.span>
                  </motion.button>
                )}
                
                {/* Nuevo mensaje */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewChat(!showNewChat)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Plus className="w-5 h-5 text-gray-700" />
                </motion.button>
              </div>
            </div>

            {/* Solicitudes de Chat Mejoradas */}
            <AnimatePresence>
              {showRequests && chatRequests.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                      <Bell className="w-4 h-4 mr-2" />
                      Solicitudes ({chatRequests.length})
                    </h3>
                    <div className="space-y-2">
                      {chatRequests.map((request) => (
                        <motion.div 
                          key={request.id} 
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border border-gray-100"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColors(request.sender.display_name)} rounded-full flex items-center justify-center shadow-sm`}>
                              <span className="text-white font-semibold text-sm">
                                {getInitials(request.sender.display_name)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{request.sender.display_name}</p>
                              <p className="text-xs text-gray-500">@{request.sender.username}</p>
                              {request.message && (
                                <p className="text-xs text-gray-600 mt-1 italic line-clamp-1 max-w-32">
                                  "{request.message}"
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleChatRequest(request.id, 'accept')}
                              className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors shadow-sm"
                              title="Aceptar"
                            >
                              <Check className="w-3 h-3" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleChatRequest(request.id, 'reject')}
                              className="bg-gray-300 text-gray-600 rounded-full p-2 hover:bg-gray-400 transition-colors shadow-sm"
                              title="Rechazar"
                            >
                              <X className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Búsqueda Instagram Style Mejorada */}
            <AnimatePresence>
              {showNewChat && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Buscar personas..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all border border-transparent focus:border-blue-200"
                    />
                    {loading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Resultados de Búsqueda Mejorados */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
                      >
                        {searchResults.map((searchUser, index) => (
                          <motion.button
                            key={searchUser.id}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => startConversation(searchUser)}
                            className="w-full px-4 py-3 text-left flex items-center hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className={`w-12 h-12 bg-gradient-to-br ${getAvatarColors(searchUser.display_name)} rounded-full flex items-center justify-center mr-3 shadow-sm`}>
                              <span className="text-white font-semibold">
                                {getInitials(searchUser.display_name)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 text-sm truncate">{searchUser.display_name}</div>
                              <div className="text-xs text-gray-500 truncate">@{searchUser.username}</div>
                            </div>
                            {isUserOnline(searchUser.id) && (
                              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                            )}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Lista de Conversaciones Instagram Style Mejorado */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 text-center text-gray-500"
              >
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Send className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Tu bandeja de entrada</h3>
                <p className="text-sm text-gray-500 mb-4">Envía un mensaje para comenzar una conversación</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewChat(true)}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  Nuevo mensaje
                </motion.button>
              </motion.div>
            ) : (
              <div className="py-2">
                {conversations.map((conversation, index) => {
                  const otherUser = conversation.participants[0];
                  const isOnline = isUserOnline(otherUser.id);
                  const hasUnread = conversation.unread_count > 0;
                  
                  return (
                    <motion.button
                      key={conversation.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedConversation(conversation)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-gray-50 transition-all duration-200 relative",
                        selectedConversation?.id === conversation.id && "bg-blue-50 border-r-3 border-blue-500"
                      )}
                    >
                      <div className="flex items-center">
                        <div className="relative">
                          <div className={`w-14 h-14 bg-gradient-to-br ${getAvatarColors(otherUser.display_name)} rounded-full flex items-center justify-center shadow-sm mr-3`}>
                            <span className="text-white font-semibold text-lg">
                              {getInitials(otherUser.display_name)}
                            </span>
                          </div>
                          {/* Indicador de estado online */}
                          {isOnline && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              "truncate text-sm",
                              hasUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"
                            )}>
                              {otherUser.display_name}
                            </span>
                            {conversation.last_message_at && (
                              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                {formatTime(conversation.last_message_at)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-sm truncate",
                              hasUnread ? "font-medium text-gray-700" : "text-gray-500"
                            )}>
                              {conversation.last_message || `Conectar con ${otherUser.display_name.split(' ')[0]}`}
                            </span>
                            {hasUnread && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium ml-2 flex-shrink-0"
                              >
                                {conversation.unread_count}
                              </motion.span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Chat Area - Instagram Style Mejorado */}
      {showChat && (
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 flex flex-col bg-white"
        >
          {/* Header del Chat Instagram Style Mejorado */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isMobile && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedConversation(null)}
                    className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.button>
                )}
                <div className="relative">
                  <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColors(selectedConversation.participants[0].display_name)} rounded-full flex items-center justify-center mr-3 shadow-sm`}>
                    <span className="text-white font-semibold">
                      {getInitials(selectedConversation.participants[0].display_name)}
                    </span>
                  </div>
                  {isUserOnline(selectedConversation.participants[0].id) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm">
                    {selectedConversation.participants[0].display_name}
                  </h2>
                  <p className={cn(
                    "text-xs",
                    isUserOnline(selectedConversation.participants[0].id) 
                      ? "text-green-600 font-medium" 
                      : "text-gray-500"
                  )}>
                    {isUserOnline(selectedConversation.participants[0].id) ? "Activo ahora" : "Última vez hace un momento"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Llamar"
                >
                  <Phone className="w-5 h-5 text-gray-600" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Videollamada"
                >
                  <Video className="w-5 h-5 text-gray-600" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Información"
                >
                  <Info className="w-5 h-5 text-gray-600" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Mensajes Instagram Style Mejorado */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className={`w-24 h-24 bg-gradient-to-br ${getAvatarColors(selectedConversation.participants[0].display_name)} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <span className="text-white font-bold text-3xl">
                    {getInitials(selectedConversation.participants[0].display_name)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedConversation.participants[0].display_name}
                </h3>
                <p className="text-sm text-gray-500 mb-1">
                  @{selectedConversation.participants[0].username}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {isUserOnline(selectedConversation.participants[0].id) ? "Activo ahora" : "Usuario de VotaTok"}
                </p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl p-4 max-w-sm mx-auto shadow-sm border border-gray-100"
                >
                  <p className="text-sm text-gray-600">
                    Saluda a {selectedConversation.participants[0].display_name.split(' ')[0]} para comenzar la conversación 👋
                  </p>
                </motion.div>
              </motion.div>
            ) : (
              <div className="space-y-4 max-w-2xl mx-auto">
                {messages.map((message, index) => {
                  const isOwnMessage = message.sender_id === user.id;
                  const showTimestamp = index === 0 || 
                    (new Date(message.created_at) - new Date(messages[index - 1].created_at)) > 60000; // 1 minuto
                  
                  return (
                    <motion.div key={message.id}>
                      {/* Timestamp separador */}
                      {showTimestamp && (
                        <div className="text-center mb-4">
                          <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm border border-gray-100">
                            {formatMessageTime(message.created_at)}
                          </span>
                        </div>
                      )}
                      
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "flex",
                          isOwnMessage ? "justify-end" : "justify-start"
                        )}
                        onTouchStart={() => startLongPress(message.id)}
                        onTouchEnd={endLongPress}
                        onMouseDown={() => startLongPress(message.id)}
                        onMouseUp={endLongPress}
                        onMouseLeave={endLongPress}
                      >
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className={cn(
                            "max-w-xs lg:max-w-sm px-4 py-3 rounded-3xl relative group cursor-pointer shadow-sm",
                            isOwnMessage
                              ? "bg-blue-500 text-white rounded-br-lg"
                              : "bg-white text-gray-900 border border-gray-100 rounded-bl-lg"
                          )}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          
                          {/* Reacciones */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="absolute -bottom-2 left-2 flex space-x-1">
                              {message.reactions.map((reaction, i) => (
                                <motion.span 
                                  key={i}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="text-sm bg-white shadow-md rounded-full px-2 py-1 border border-gray-100"
                                >
                                  {reaction.emoji}
                                </motion.span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Instagram Style Mejorado */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={sendMessage} className="flex items-center space-x-3">
              {/* Media buttons mejorados */}
              <div className="flex items-center space-x-1">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMediaPicker(!showMediaPicker)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Cámara"
                >
                  <Camera className="w-5 h-5 text-gray-600" />
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Imagen"
                >
                  <Image className="w-5 h-5 text-gray-600" />
                </motion.button>
              </div>
              
              {/* Input field mejorado */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mensaje..."
                  className="w-full px-4 py-2.5 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all"
                  disabled={sendingMessage}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEmojiPicker(true)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-200 rounded-full p-1 transition-colors"
                  title="Emojis"
                >
                  <Smile className="w-4 h-4 text-gray-500" />
                </motion.button>
              </div>
              
              {/* Send/Mic button mejorado */}
              {newMessage.trim() ? (
                <motion.button
                  type="submit"
                  disabled={sendingMessage}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-blue-500 font-semibold hover:text-blue-600 transition-colors px-3 py-2 disabled:opacity-50"
                >
                  {sendingMessage ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Enviar"
                  )}
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Mensaje de voz"
                >
                  <Mic className="w-5 h-5 text-gray-600" />
                </motion.button>
              )}
            </form>
          </div>
        </motion.div>
      )}

      {/* Empty State Instagram Style Mejorado */}
      {!selectedConversation && !isMobile && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex items-center justify-center bg-white"
        >
          <div className="text-center max-w-sm">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Send className="w-10 h-10 text-white" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Tus mensajes</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Envía mensajes privados a amigos o inicia nuevas conversaciones.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewChat(true)}
              className="bg-blue-500 text-white px-8 py-3 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg hover:shadow-xl"
            >
              Enviar mensaje
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Media Picker Mejorado */}
      <AnimatePresence>
        {showMediaPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-4 bg-white border border-gray-200 rounded-2xl shadow-xl p-3"
          >
            <div className="flex space-x-2">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                title="Foto"
              >
                <Camera className="w-5 h-5 text-gray-600" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                title="Galería"
              >
                <Image className="w-5 h-5 text-gray-600" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                title="Audio"
              >
                <Mic className="w-5 h-5 text-gray-600" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMediaPicker(false)}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Picker Instagram Style Mejorado */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEmojiPicker(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Reaccionar</h3>
              <div className="grid grid-cols-6 gap-3">
                {quickEmojis.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => addReaction(reactionTarget, emoji)}
                    className="w-12 h-12 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-2xl transition-all hover:shadow-md"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagesPage;