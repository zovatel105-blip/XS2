import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Camera, Mic, Smile, Heart, Info, Phone, Video, Plus, Image, X, Bell, Check, UserX, MoreHorizontal, MessageCircle, Zap, Star, ThumbsUp, ThumbsDown, Users, Search, Filter, Sparkles } from 'lucide-react';
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

  // VotaTok-specific color schemes inspired by ProfilePage
  const getVotaTokColors = (name) => {
    const votaTokGradients = [
      'from-purple-500 via-pink-500 to-red-500',      // Profile story gradient
      'from-blue-500 via-purple-500 to-pink-500',     // VotaTok brand
      'from-indigo-500 via-purple-500 to-pink-500',   // Deep purple
      'from-cyan-500 via-blue-500 to-purple-500',     // Cool blues
      'from-pink-500 via-purple-500 to-indigo-500',   // Warm pinks
      'from-violet-500 via-purple-500 to-pink-500',   // Violet mix
      'from-fuchsia-500 via-purple-500 to-blue-500',  // Fuchsia blend
      'from-rose-500 via-pink-500 to-purple-500'      // Rose gradient
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return votaTokGradients[hash % votaTokGradients.length];
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

  // VotaTok-specific emoji reactions for voting-style interactions
  const votaTokEmojis = ['🔥', '💯', '⚡', '🎯', '💎', '🚀', '✨', '🏆'];

  return (
    <div className="h-screen bg-gray-50 flex relative overflow-hidden">
      {/* VotaTok Conversations Sidebar - Inspired by Profile design */}
      {showList && (
        <motion.div 
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col shadow-lg relative z-10"
        >
          {/* VotaTok Header - Clean like Profile */}
          <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className={`w-12 h-12 bg-gradient-to-br ${getVotaTokColors(user?.display_name || user?.username || 'User')} rounded-2xl flex items-center justify-center shadow-lg`}
                >
                  <span className="text-white text-lg font-bold">
                    {getInitials(user?.display_name || user?.username || 'User')}
                  </span>
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    VoteChat
                  </h1>
                  <p className="text-sm text-purple-600 font-medium">@{user?.username || 'usuario'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Chat Requests Bell */}
                {chatRequests.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowRequests(!showRequests)}
                    className="relative p-3 bg-blue-500 rounded-2xl shadow-lg hover:bg-blue-600 transition-colors"
                  >
                    <Bell className="w-5 h-5 text-white" strokeWidth={1.5} />
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg"
                    >
                      {chatRequests.length}
                    </motion.span>
                  </motion.button>
                )}
                
                {/* New Chat Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewChat(!showNewChat)}
                  className="p-3 bg-purple-500 rounded-2xl shadow-lg hover:bg-purple-600 transition-colors"
                >
                  <Plus className="w-5 h-5 text-white" strokeWidth={1.5} />
                </motion.button>
              </div>
            </div>

            {/* Enhanced Chat Requests - Profile Modal Style */}
            <AnimatePresence>
              {showRequests && chatRequests.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -20 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -20 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-200">
                    <h3 className="text-sm font-bold text-purple-900 mb-4 flex items-center">
                      <Bell className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Nuevas Conexiones ({chatRequests.length})
                    </h3>
                    <div className="space-y-3">
                      {chatRequests.map((request) => (
                        <motion.div 
                          key={request.id} 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-md border border-gray-100"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 bg-gradient-to-br ${getVotaTokColors(request.sender.display_name)} rounded-2xl flex items-center justify-center shadow-lg`}>
                              <span className="text-white font-bold text-sm">
                                {getInitials(request.sender.display_name)}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{request.sender.display_name}</p>
                              <p className="text-xs text-purple-600 font-medium">@{request.sender.username}</p>
                              {request.message && (
                                <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded-xl px-3 py-1 max-w-32 truncate">
                                  "{request.message}"
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleChatRequest(request.id, 'accept')}
                              className="bg-green-500 text-white rounded-2xl p-3 shadow-lg hover:bg-green-600 transition-colors"
                              title="Aceptar"
                            >
                              <Check className="w-4 h-4" strokeWidth={1.5} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleChatRequest(request.id, 'reject')}
                              className="bg-gray-400 text-white rounded-2xl p-3 shadow-lg hover:bg-gray-500 transition-colors"
                              title="Rechazar"
                            >
                              <X className="w-4 h-4" strokeWidth={1.5} />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* VotaTok User Search - Profile Input Style */}
            <AnimatePresence>
              {showNewChat && (
                <motion.div
                  initial={{ height: 0, opacity: 0, scale: 0.95 }}
                  animate={{ height: "auto", opacity: 1, scale: 1 }}
                  exit={{ height: 0, opacity: 0, scale: 0.95 }}
                  className="overflow-hidden"
                >
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                      <Search className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar VoTokkers..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white text-sm border border-gray-200 transition-all placeholder-gray-400"
                    />
                    {loading && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced Search Results - Profile Modal Style */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ y: -10, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -10, opacity: 0, scale: 0.95 }}
                        className="bg-white border border-gray-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto"
                      >
                        {searchResults.map((searchUser, index) => (
                          <motion.button
                            key={searchUser.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => startConversation(searchUser)}
                            className="w-full px-5 py-4 text-left flex items-center hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 group"
                          >
                            <div className={`w-14 h-14 bg-gradient-to-br ${getVotaTokColors(searchUser.display_name)} rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-105 transition-transform`}>
                              <span className="text-white font-bold text-lg">
                                {getInitials(searchUser.display_name)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-900 text-sm truncate">{searchUser.display_name}</div>
                              <div className="text-xs text-purple-600 truncate font-medium">@{searchUser.username}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isUserOnline(searchUser.id) && (
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-3 h-3 bg-green-500 rounded-full shadow-sm"
                                />
                              )}
                              <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" strokeWidth={1.5} />
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* VotaTok Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 text-center space-y-6"
              >
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Users className="w-10 h-10 text-white" strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    ¡Conecta con VoTokkers!
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
                    Inicia conversaciones sobre tus votaciones favoritas
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewChat(true)}
                  className="bg-gradient-to-br from-purple-500 to-pink-500 text-white px-8 py-3 rounded-2xl hover:shadow-xl transition-all font-bold shadow-lg"
                >
                  Empezar Chat
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
                      initial={{ x: -30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedConversation(conversation)}
                      className={cn(
                        "w-full p-5 text-left hover:bg-gray-50 transition-all duration-200 relative group",
                        selectedConversation?.id === conversation.id && "bg-purple-50 border-r-4 border-purple-500"
                      )}
                    >
                      <div className="flex items-center">
                        <div className="relative">
                          <div className={`w-16 h-16 bg-gradient-to-br ${getVotaTokColors(otherUser.display_name)} rounded-2xl flex items-center justify-center shadow-lg mr-4 group-hover:scale-105 transition-transform`}>
                            <span className="text-white font-bold text-xl">
                              {getInitials(otherUser.display_name)}
                            </span>
                          </div>
                          {/* Online Status */}
                          {isOnline && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full shadow-md"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn(
                              "truncate text-base font-bold",
                              hasUnread ? "text-purple-900" : "text-gray-800"
                            )}>
                              {otherUser.display_name}
                            </span>
                            {conversation.last_message_at && (
                              <span className="text-xs text-purple-500 ml-2 flex-shrink-0 font-medium">
                                {formatTime(conversation.last_message_at)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-sm truncate max-w-48",
                              hasUnread ? "font-semibold text-gray-700" : "text-gray-500"
                            )}>
                              {conversation.last_message || `💬 Conectar con ${otherUser.display_name.split(' ')[0]}`}
                            </span>
                            {hasUnread && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold ml-2 flex-shrink-0 shadow-lg"
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

      {/* VotaTok Chat Area */}
      {showChat && (
        <motion.div 
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 flex flex-col bg-white relative z-10"
        >
          {/* VotaTok Chat Header - Profile Style */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isMobile && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedConversation(null)}
                    className="mr-4 p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
                  </motion.button>
                )}
                <div className="relative">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getVotaTokColors(selectedConversation.participants[0].display_name)} rounded-2xl flex items-center justify-center mr-4 shadow-lg`}>
                    <span className="text-white font-bold">
                      {getInitials(selectedConversation.participants[0].display_name)}
                    </span>
                  </div>
                  {isUserOnline(selectedConversation.participants[0].id) && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-md"
                    />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">
                    {selectedConversation.participants[0].display_name}
                  </h2>
                  <p className={cn(
                    "text-sm font-medium",
                    isUserOnline(selectedConversation.participants[0].id) 
                      ? "text-green-600" 
                      : "text-purple-500"
                  )}>
                    {isUserOnline(selectedConversation.participants[0].id) ? "🟢 Activo ahora" : "🔵 En VotaTok"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
                  title="Llamada de voz"
                >
                  <Phone className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
                  title="Videollamada"
                >
                  <Video className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
                  title="Información del chat"
                >
                  <Info className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* VotaTok Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-gray-50 to-purple-25">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 space-y-6"
              >
                <div className={`w-32 h-32 bg-gradient-to-br ${getVotaTokColors(selectedConversation.participants[0].display_name)} rounded-3xl flex items-center justify-center mx-auto shadow-2xl`}>
                  <span className="text-white font-bold text-4xl">
                    {getInitials(selectedConversation.participants[0].display_name)}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedConversation.participants[0].display_name}
                  </h3>
                  <p className="text-sm text-purple-600 font-medium">
                    @{selectedConversation.participants[0].username}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isUserOnline(selectedConversation.participants[0].id) ? "🟢 Activo ahora" : "🎯 VoTokker Activo"}
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-3xl p-6 max-w-md mx-auto shadow-xl border border-gray-100"
                >
                  <p className="text-sm text-gray-700 leading-relaxed">
                    🚀 ¡Inicia una conversación con {selectedConversation.participants[0].display_name.split(' ')[0]}! 
                    <br />
                    <span className="text-purple-600 font-medium">Comparte opiniones, vota juntos y conecta</span>
                  </p>
                </motion.div>
              </motion.div>
            ) : (
              <div className="space-y-6 max-w-3xl mx-auto">
                {messages.map((message, index) => {
                  const isOwnMessage = message.sender_id === user.id;
                  const showTimestamp = index === 0 || 
                    (new Date(message.created_at) - new Date(messages[index - 1].created_at)) > 300000; // 5 minutes
                  
                  return (
                    <motion.div key={message.id}>
                      {/* Timestamp */}
                      {showTimestamp && (
                        <div className="text-center mb-6">
                          <span className="bg-white px-4 py-2 rounded-full text-xs text-purple-600 shadow-md border border-gray-100 font-medium">
                            {formatMessageTime(message.created_at)}
                          </span>
                        </div>
                      )}
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "flex items-end space-x-3",
                          isOwnMessage ? "justify-end flex-row-reverse space-x-reverse" : "justify-start"
                        )}
                        onTouchStart={() => startLongPress(message.id)}
                        onTouchEnd={endLongPress}
                        onMouseDown={() => startLongPress(message.id)}
                        onMouseUp={endLongPress}
                        onMouseLeave={endLongPress}
                      >
                        {/* Avatar for other user */}
                        {!isOwnMessage && (
                          <div className={`w-8 h-8 bg-gradient-to-br ${getVotaTokColors(selectedConversation.participants[0].display_name)} rounded-2xl flex items-center justify-center shadow-md flex-shrink-0`}>
                            <span className="text-white font-bold text-xs">
                              {getInitials(selectedConversation.participants[0].display_name)}
                            </span>
                          </div>
                        )}
                        
                        {/* Message Bubble */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className={cn(
                            "max-w-sm lg:max-w-md px-6 py-4 rounded-3xl relative group cursor-pointer shadow-lg border",
                            isOwnMessage
                              ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white border-purple-300 rounded-br-xl shadow-purple-200"
                              : "bg-white text-gray-800 border-gray-200 rounded-bl-xl shadow-gray-200"
                          )}
                        >
                          <p className="text-sm leading-relaxed font-medium">{message.content}</p>
                          
                          {/* VotaTok Reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="absolute -bottom-3 left-4 flex space-x-1">
                              {message.reactions.map((reaction, i) => (
                                <motion.span 
                                  key={i}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  whileHover={{ scale: 1.2 }}
                                  className="text-lg bg-white shadow-lg rounded-full px-3 py-1 border border-gray-100"
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

          {/* VotaTok Message Input */}
          <div className="bg-white border-t border-gray-200 p-6">
            <form onSubmit={sendMessage} className="flex items-center space-x-4">
              {/* Media Actions */}
              <div className="flex items-center space-x-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMediaPicker(!showMediaPicker)}
                  className="p-3 bg-purple-500 rounded-2xl shadow-lg hover:bg-purple-600 transition-colors"
                  title="Cámara"
                >
                  <Camera className="w-5 h-5 text-white" strokeWidth={1.5} />
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-blue-500 rounded-2xl shadow-lg hover:bg-blue-600 transition-colors"
                  title="Galería"
                >
                  <Image className="w-5 h-5 text-white" strokeWidth={1.5} />
                </motion.button>
              </div>
              
              {/* Input Field */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white text-sm transition-all placeholder-gray-400"
                  disabled={sendingMessage}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEmojiPicker(true)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Emojis VotaTok"
                >
                  <Smile className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
                </motion.button>
              </div>
              
              {/* Send Button */}
              {newMessage.trim() ? (
                <motion.button
                  type="submit"
                  disabled={sendingMessage}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold px-6 py-4 rounded-2xl hover:shadow-xl transition-all disabled:opacity-50 shadow-lg"
                >
                  {sendingMessage ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" 
                    />
                  ) : (
                    <Send className="w-5 h-5" strokeWidth={1.5} />
                  )}
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-4 bg-pink-500 rounded-2xl shadow-lg hover:bg-pink-600 transition-colors"
                  title="Mensaje de voz"
                >
                  <Mic className="w-5 h-5 text-white" strokeWidth={1.5} />
                </motion.button>
              )}
            </form>
          </div>
        </motion.div>
      )}

      {/* VotaTok Empty State - Profile Style */}
      {!selectedConversation && !isMobile && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex items-center justify-center bg-white relative z-10"
        >
          <div className="text-center max-w-lg space-y-6">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 10, -10, 0],
                y: [0, -10, 0]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-2xl"
            >
              <MessageCircle className="w-16 h-16 text-white" strokeWidth={1.5} />
            </motion.div>
            <div className="space-y-3">
              <h3 className="text-3xl font-bold text-gray-900">
                VoteChat
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Conecta con otros VoTokkers y comparte tus<br />
                <span className="font-semibold text-purple-600">opiniones favoritas</span>
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewChat(true)}
              className="bg-gradient-to-br from-purple-500 to-pink-500 text-white px-10 py-4 rounded-3xl hover:shadow-2xl transition-all font-bold text-lg shadow-xl"
            >
              Iniciar Conversación
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Enhanced Media Picker - Profile Modal Style */}
      <AnimatePresence>
        {showMediaPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-32 left-6 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4"
          >
            <div className="flex space-x-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 bg-purple-500 rounded-2xl shadow-lg hover:bg-purple-600 transition-colors"
                title="Foto"
              >
                <Camera className="w-6 h-6 text-white" strokeWidth={1.5} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 bg-blue-500 rounded-2xl shadow-lg hover:bg-blue-600 transition-colors"
                title="Galería"
              >
                <Image className="w-6 h-6 text-white" strokeWidth={1.5} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 bg-pink-500 rounded-2xl shadow-lg hover:bg-pink-600 transition-colors"
                title="Audio"
              >
                <Mic className="w-6 h-6 text-white" strokeWidth={1.5} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMediaPicker(false)}
                className="p-4 bg-gray-400 rounded-2xl shadow-lg hover:bg-gray-500 transition-colors"
              >
                <X className="w-6 h-6 text-white" strokeWidth={1.5} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VotaTok Emoji Picker - Profile Modal Style */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setShowEmojiPicker(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full border border-gray-200"
            >
              <h3 className="text-xl font-bold text-center mb-6 text-gray-900">
                VotaTok Reacciones
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {votaTokEmojis.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.3, rotate: 10 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => addReaction(reactionTarget, emoji)}
                    className="w-16 h-16 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-3xl transition-all hover:shadow-lg border border-gray-100"
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