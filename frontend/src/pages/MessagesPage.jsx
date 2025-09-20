import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Camera, Mic, Smile, Heart, Info, Phone, Video, Plus, Image, X, Bell, Check, UserX } from 'lucide-react';
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
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      const interval = setInterval(() => {
        loadMessages(selectedConversation.id);
      }, 3000);
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
      if (selectedConversation) {
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
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    // Send chat request instead of creating conversation directly
    try {
      const response = await apiRequest('/api/chat-requests', {
        method: 'POST',
        body: {
          receiver_id: selectedUser.id,
          message: `¡Hola! Me gustaría conectar contigo.`
        }
      });

      if (response.success) {
        toast({
          title: "Solicitud enviada",
          description: `Se ha enviado una solicitud de chat a ${selectedUser.display_name}`,
        });
      }
    } catch (error) {
      if (error.message.includes("Chat request already pending")) {
        toast({
          title: "Solicitud pendiente",
          description: "Ya tienes una solicitud pendiente con este usuario",
          variant: "default"
        });
      } else if (error.message.includes("Chat already exists")) {
        toast({
          title: "Chat existente",
          description: "Ya tienes una conversación con este usuario",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo enviar la solicitud de chat",
          variant: "destructive"
        });
      }
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
      
      await apiRequest('/api/messages', {
        method: 'POST',
        body: {
          recipient_id: recipientId,
          content: messageText,
          message_type: 'text',
          is_ephemeral: ephemeralMode
        }
      });

      loadConversations();
      if (selectedConversation?.id) {
        loadMessages(selectedConversation.id);
      }
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
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "ahora";
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  // Instagram-style emoji reactions
  const quickEmojis = ['❤️', '😂', '😮', '😢', '😡', '👍'];

  return (
    <div className="h-screen bg-white flex relative">
      {/* Lista de Conversaciones - Instagram Style */}
      {showList && (
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col"
        >
          {/* Header estilo Instagram */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.username || 'Mensajes'}
              </h1>
              <div className="flex items-center space-x-3">
                {/* Notificaciones */}
                {chatRequests.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowRequests(!showRequests)}
                    className="relative p-2"
                  >
                    <Bell className="w-6 h-6 text-gray-700" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chatRequests.length}
                    </span>
                  </motion.button>
                )}
                
                {/* Nuevo mensaje */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewChat(!showNewChat)}
                  className="p-2"
                >
                  <Plus className="w-6 h-6 text-gray-700" />
                </motion.button>
              </div>
            </div>

            {/* Solicitudes de Chat */}
            <AnimatePresence>
              {showRequests && chatRequests.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Solicitudes ({chatRequests.length})
                    </h3>
                    <div className="space-y-2">
                      {chatRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between bg-white rounded-lg p-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-xs">
                                {request.sender.display_name[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{request.sender.display_name}</p>
                              <p className="text-xs text-gray-500">@{request.sender.username}</p>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleChatRequest(request.id, 'accept')}
                              className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleChatRequest(request.id, 'reject')}
                              className="bg-gray-300 text-gray-600 rounded-full p-1 hover:bg-gray-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Búsqueda Instagram Style */}
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
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className="w-full px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                  {/* Resultados de Búsqueda */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-48 overflow-y-auto"
                      >
                        {searchResults.map(user => (
                          <button
                            key={user.id}
                            onClick={() => startConversation(user)}
                            className="w-full px-3 py-2 text-left flex items-center hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white font-medium">
                                {user.display_name[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{user.display_name}</div>
                              <div className="text-xs text-gray-500">@{user.username}</div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Lista de Conversaciones Instagram Style */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Send className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm mb-1">Tu bandeja de entrada</p>
                <p className="text-xs text-gray-400">Envía un mensaje para comenzar</p>
              </div>
            ) : (
              conversations.map((conversation, index) => {
                const otherUser = conversation.participants[0];
                return (
                  <motion.button
                    key={conversation.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedConversation(conversation)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-gray-50 transition-colors",
                      selectedConversation?.id === conversation.id && "bg-blue-50"
                    )}
                  >
                    <div className="flex items-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mr-3 relative">
                        <span className="text-white font-medium text-lg">
                          {otherUser.display_name[0].toUpperCase()}
                        </span>
                        {/* Online indicator */}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 truncate">
                            {otherUser.display_name}
                          </span>
                          {conversation.last_message_at && (
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.last_message_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-500 truncate">
                            {conversation.last_message || 'Di hola 👋'}
                          </span>
                          {conversation.unread_count > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </motion.div>
      )}

      {/* Chat Area - Instagram Style */}
      {showChat && (
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 flex flex-col bg-white"
        >
          {/* Header del Chat Instagram Style */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isMobile && (
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="mr-3 p-1"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                )}
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-medium">
                    {selectedConversation.participants[0].display_name[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.participants[0].display_name}
                  </h2>
                  <p className="text-sm text-green-500">Activo</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Info className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Mensajes Instagram Style */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">
                    {selectedConversation.participants[0].display_name[0].toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {selectedConversation.participants[0].display_name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  @{selectedConversation.participants[0].username} • Instagram
                </p>
                <p className="text-sm text-gray-500">
                  Di hola para comenzar la conversación
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => {
                  const isOwnMessage = message.sender_id === user.id;
                  
                  return (
                    <motion.div
                      key={message.id}
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
                      <div
                        className={cn(
                          "max-w-xs lg:max-w-md px-4 py-2 rounded-3xl relative group cursor-pointer",
                          isOwnMessage
                            ? "bg-blue-500 text-white rounded-br-lg"
                            : "bg-gray-100 text-gray-900 rounded-bl-lg"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        
                        {/* Timestamp */}
                        <p className={cn(
                          "text-xs mt-1 opacity-70",
                          isOwnMessage ? "text-blue-100" : "text-gray-500"
                        )}>
                          {formatTime(message.created_at)}
                        </p>
                        
                        {/* Reacciones */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="absolute -bottom-2 left-2 flex space-x-1">
                            {message.reactions.map((reaction, i) => (
                              <span key={i} className="text-xs bg-white shadow-sm rounded-full px-2 py-1">
                                {reaction.emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Instagram Style */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={sendMessage} className="flex items-center space-x-3">
              {/* Media buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(!showMediaPicker)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Camera className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Image className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              {/* Input field */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mensaje..."
                  className="w-full px-4 py-2 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={sendingMessage}
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(true)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <Smile className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Send/Mic button */}
              {newMessage.trim() ? (
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="text-blue-500 font-semibold hover:text-blue-600 transition-colors px-2"
                >
                  {sendingMessage ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Enviar"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Mic className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </form>
          </div>
        </motion.div>
      )}

      {/* Empty State Instagram Style */}
      {!selectedConversation && !isMobile && (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Send className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-light mb-2 text-gray-600">Tus mensajes</h3>
            <p className="text-sm text-gray-500 mb-6">
              Envía mensajes privados a un amigo o grupo
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Enviar mensaje
            </button>
          </div>
        </div>
      )}

      {/* Media Picker */}
      <AnimatePresence>
        {showMediaPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-4 bg-white border border-gray-200 rounded-2xl shadow-lg p-2"
          >
            <div className="flex space-x-2">
              <button className="p-3 hover:bg-gray-100 rounded-xl transition-colors">
                <Camera className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-3 hover:bg-gray-100 rounded-xl transition-colors">
                <Image className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-3 hover:bg-gray-100 rounded-xl transition-colors">
                <Mic className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={() => setShowMediaPicker(false)}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Picker Instagram Style */}
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
              className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full"
            >
              <div className="grid grid-cols-6 gap-3">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addReaction(reactionTarget, emoji)}
                    className="w-12 h-12 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-2xl transition-colors"
                  >
                    {emoji}
                  </button>
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