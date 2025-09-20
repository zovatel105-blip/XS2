import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Mic, Image, Smile, Eye, EyeOff, Music, Link, Gift, X, Bell, Check, UserX } from 'lucide-react';
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
  const [showShareMenu, setShowShareMenu] = useState(false);
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
        console.log('📤 Sending chat request to:', targetUser.display_name);
        
        // Enviar mensaje directo en lugar de solicitud de chat
        try {
          const response = await apiRequest('/api/messages', {
            method: 'POST',
            body: {
              recipient_id: targetUser.id,
              content: `¡Hola! Me gustaría conectar contigo.`,
              message_type: 'text'
            }
          });

          if (response.message_id) {
            toast({
              title: "Mensaje enviado",
              description: `Se ha iniciado la conversación con ${targetUser.display_name}`,
            });
            
            // Recargar conversaciones para mostrar la nueva conversación
            await loadConversations();
            
            // Buscar y abrir la nueva conversación
            setTimeout(async () => {
              await loadConversations();
              const newConv = conversations.find(conv => 
                conv.participants.some(p => p.id === targetUser.id)
              );
              if (newConv) {
                console.log('✅ Opening new conversation:', newConv.id);
                setSelectedConversation(newConv);
              }
            }, 1000);
          }
        } catch (error) {
          if (error.message.includes("Chat already exists")) {
            console.log('✅ Chat already exists, reloading conversations...');
            
            // Si ya existe el chat, recargar conversaciones y abrir
            await loadConversations();
            
            // Buscar la conversación recién cargada
            setTimeout(() => {
              const newConv = conversations.find(conv => 
                conv.participants.some(p => p.id === targetUser.id)
              );
              if (newConv) {
                console.log('✅ Opening existing conversation:', newConv.id);
                setSelectedConversation(newConv);
              }
            }, 1000);
            
          } else if (error.message.includes("Chat request already pending")) {
            toast({
              title: "Solicitud pendiente",
              description: "Ya tienes una solicitud pendiente con este usuario",
              variant: "default"
            });
          } else {
            console.error('❌ Error enviando solicitud desde perfil:', error);
            toast({
              title: "Error",
              description: "No se pudo iniciar el chat desde el perfil",
              variant: "destructive"
            });
          }
        }
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

  // 🎯 Funciones del Susurro Inteligente
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

  const sendEphemeralMessage = async (content) => {
    if (!selectedConversation || !content.trim()) return;

    try {
      setSendingMessage(true);
      await apiRequest('/api/messages', {
        method: 'POST',
        body: {
          conversation_id: selectedConversation.id,
          content,
          is_ephemeral: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      });
      
      setNewMessage('');
      loadMessages(selectedConversation.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje efímero",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
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
        body: JSON.stringify({
          recipient_id: recipientId,
          content: messageText,
          message_type: 'text',
          is_ephemeral: ephemeralMode
        })
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

  // 5 emojis sutiles para reacciones
  const quickEmojis = ['❤️', '😊', '👍', '😮', '🤔'];

  return (
    <div className="h-screen bg-gradient-to-br from-stone-50 via-stone-25 to-white flex relative">
      {/* Safe area bottom para móviles */}
      <div className="fixed inset-x-0 bottom-0 h-6 bg-white/90 backdrop-blur-xl z-0 md:hidden"></div>
      {/* Lista de Conversaciones - Optimizada Móvil */}
      {showList && (
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full md:w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col"
        >
          {/* Header Minimalista - Móvil */}
          <div className="p-4 md:p-6 border-b border-gray-100/50">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <motion.h1 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-xl md:text-2xl font-light text-gray-800 tracking-wide"
              >
                Mensajes
              </motion.h1>
              <div className="flex items-center space-x-2">
                {/* Botón de solicitudes */}
                {chatRequests.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowRequests(!showRequests)}
                    className="relative w-9 md:w-10 h-9 md:h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center hover:bg-amber-200 active:bg-amber-300 transition-all duration-200 touch-manipulation"
                  >
                    <Bell className="w-4 h-4" />
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 md:w-5 h-4 md:h-5 flex items-center justify-center"
                    >
                      {chatRequests.length}
                    </motion.span>
                  </motion.button>
                )}
                
                {/* Botón de nuevo chat */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewChat(!showNewChat)}
                  className="w-9 md:w-10 h-9 md:h-10 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 touch-manipulation"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Solicitudes de Chat - Optimizado Móvil */}
            <AnimatePresence>
              {showRequests && chatRequests.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <h3 className="text-sm font-medium text-gray-700 mb-3 px-1">
                    Solicitudes de Chat ({chatRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {chatRequests.map((request) => (
                      <motion.div
                        key={request.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-2xl p-3 md:p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="w-9 md:w-10 h-9 md:h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-amber-700 font-medium text-xs md:text-sm">
                                {request.sender.display_name[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {request.sender.display_name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                @{request.sender.username}
                              </p>
                              {request.message && (
                                <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">
                                  "{request.message}"
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 flex-shrink-0">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleChatRequest(request.id, 'accept')}
                              className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 active:bg-green-300 transition-colors touch-manipulation"
                            >
                              <Check className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleChatRequest(request.id, 'reject')}
                              className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 active:bg-red-300 transition-colors touch-manipulation"
                            >
                              <UserX className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Búsqueda Elegante */}
            <AnimatePresence>
              {showNewChat && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Buscar una presencia..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-transparent text-sm placeholder-gray-400 transition-all"
                    />
                  </div>
                  
                  {/* Resultados de Búsqueda */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        className="bg-white border border-gray-100 rounded-2xl shadow-sm max-h-48 overflow-y-auto"
                      >
                        {searchResults.map(user => (
                          <motion.button
                            key={user.id}
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                            onClick={() => startConversation(user)}
                            className="w-full px-4 py-3 text-left flex items-center transition-colors"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mr-3">
                              <span className="text-gray-600 text-sm font-medium">
                                {user.display_name[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{user.display_name}</div>
                              <div className="text-xs text-gray-500">@{user.username}</div>
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

          {/* Lista de Conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center text-gray-400"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Send className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm mb-1">Silencio total</p>
                <p className="text-xs">Busca alguien para conversar</p>
              </motion.div>
            ) : (
              <div className="py-2">
                {conversations.map((conversation, index) => {
                  const otherUser = conversation.participants[0];
                  return (
                    <motion.button
                      key={conversation.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedConversation(conversation)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-gray-50/50 transition-all duration-200 group",
                        selectedConversation?.id === conversation.id && "bg-gray-50/80"
                      )}
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                          <span className="text-gray-600 font-medium">
                            {otherUser.display_name[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {otherUser.display_name}
                            </span>
                            {conversation.last_message_at && (
                              <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                {formatTime(conversation.last_message_at)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 truncate">
                              {conversation.last_message || 'Nuevo susurro...'}
                            </span>
                            {conversation.unread_count > 0 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
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

      {/* Chat Area - La Conversación que Respira */}
      {showChat && (
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 flex flex-col bg-stone-50/30 backdrop-blur-xl"
        >
          {/* Header del Chat - Optimizado Móvil */}
          <div className="bg-white/60 backdrop-blur-xl border-b border-stone-100 px-4 md:px-8 py-4 md:py-6">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {isMobile && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedConversation(null)}
                  className="mr-3 md:mr-4 p-2 text-stone-400 hover:text-stone-600 rounded-full transition-colors active:bg-stone-100 touch-manipulation"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              )}
              
              <div className="flex items-center space-x-3 md:space-x-4 flex-1">
                <div className="w-10 md:w-11 h-10 md:h-11 bg-gradient-to-br from-stone-100 to-stone-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-stone-600 font-medium text-base md:text-lg">
                    {selectedConversation.participants[0].display_name[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium text-stone-800 text-base md:text-lg tracking-wide truncate">
                    {selectedConversation.participants[0].display_name}
                  </h2>
                  <p className="text-xs md:text-sm text-stone-500 font-light">
                    presente en el momento
                  </p>
                </div>
              </div>
              
              {/* Solo modo efímero - sin más distracciones */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEphemeralMode(!ephemeralMode)}
                className={cn(
                  "p-2 md:p-2 rounded-full transition-all text-sm font-light touch-manipulation flex-shrink-0",
                  ephemeralMode 
                    ? "bg-amber-50 text-amber-600" 
                    : "text-stone-400 hover:text-stone-600 hover:bg-stone-50 active:bg-stone-100"
                )}
              >
                {ephemeralMode ? <EyeOff className="w-4 md:w-5 h-4 md:h-5" /> : <Eye className="w-4 md:w-5 h-4 md:h-5" />}
              </motion.button>
            </div>
          </div>

          {/* Mensajes - Las Burbujas que Respiran (Optimizado Móvil) */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-12">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-stone-400 py-16 md:py-24"
              >
                <div className="w-16 md:w-20 h-16 md:h-20 mx-auto mb-6 md:mb-8 bg-stone-50 rounded-full flex items-center justify-center">
                  <div className="w-2.5 md:w-3 h-2.5 md:h-3 bg-stone-300 rounded-full animate-pulse"></div>
                </div>
                <p className="text-base md:text-lg font-light mb-2">El silencio es oro</p>
                <p className="text-xs md:text-sm opacity-70 px-4">Un espacio para estar presente</p>
              </motion.div>
            ) : (
              <div className="space-y-6 md:space-y-8 max-w-2xl mx-auto">
                {messages.map((message, index) => {
                  const isOwnMessage = message.sender_id === user.id;
                  const isEphemeral = message.is_ephemeral;
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ 
                        opacity: isEphemeral ? 0.6 : 1, 
                        y: 0
                      }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      className={cn(
                        "flex mb-6 md:mb-8",
                        isOwnMessage ? "justify-end" : "justify-start"
                      )}
                      onTouchStart={() => startLongPress(message.id)}
                      onTouchEnd={endLongPress}
                      onMouseDown={() => startLongPress(message.id)}
                      onMouseUp={endLongPress}
                      onMouseLeave={endLongPress}
                    >
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "relative max-w-[280px] md:max-w-md px-4 md:px-6 py-3 md:py-4 rounded-3xl cursor-pointer group active:scale-95 transition-transform",
                          isOwnMessage
                            ? "bg-stone-800 text-stone-50 rounded-br-lg"
                            : "bg-stone-50 text-stone-800 border border-stone-100 rounded-bl-lg",
                          isEphemeral && "opacity-60 border-dashed"
                        )}
                      >
                        <p className="text-sm md:text-base leading-relaxed font-light tracking-wide">
                          {message.content}
                        </p>
                        
                        {/* Timestamp sutil */}
                        <p
                          className={cn(
                            "text-xs mt-2 md:mt-3 font-light tracking-wider",
                            isOwnMessage ? "text-stone-400" : "text-stone-500"
                          )}
                        >
                          {formatTime(message.created_at)}
                          {isEphemeral && " • se desvanece"}
                        </p>
                        
                        {/* Reacciones sutiles */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex mt-2 md:mt-3 space-x-1 md:space-x-2">
                            {message.reactions.map((reaction, i) => (
                              <motion.span
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs md:text-sm bg-white/10 backdrop-blur-sm rounded-full px-2 md:px-3 py-1"
                              >
                                {reaction.emoji}
                              </motion.span>
                            ))}
                          </div>
                        )}
                        
                        {/* Indicador sutil de grupo */}
                        <div className={cn(
                          "absolute -bottom-1 w-1.5 md:w-2 h-1.5 md:h-2 rounded-full",
                          isOwnMessage 
                            ? "-right-1 bg-stone-800" 
                            : "-left-1 bg-stone-50 border border-stone-100"
                        )} />
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Campo de Entrada - Optimizado para Táctil */}
          <div className="bg-white/90 backdrop-blur-xl border-t border-stone-100 px-4 md:px-8 py-4 md:py-6 pb-safe">
            <form onSubmit={sendMessage} className="max-w-2xl mx-auto">
              <div className="relative">
                {/* Input principal - Adaptado para móvil */}
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={ephemeralMode ? "Un pensamiento que se desvanece..." : "Escribe con intención..."}
                  className={cn(
                    "w-full px-4 md:px-6 py-3 md:py-4 bg-stone-50/80 border-0 rounded-full focus:outline-none focus:ring-1 text-sm md:text-base font-light tracking-wide placeholder-stone-400 transition-all duration-300",
                    ephemeralMode 
                      ? "focus:ring-amber-200 focus:bg-amber-50/50" 
                      : "focus:ring-stone-200 focus:bg-white/80",
                    newMessage.trim() ? "pr-14 md:pr-16" : "pr-4 md:pr-6"
                  )}
                  disabled={sendingMessage}
                />
                
                {/* Botón de envío - Táctil optimizado */}
                <AnimatePresence>
                  {newMessage.trim() && (
                    <motion.button
                      type="submit"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={sendingMessage}
                      className="absolute right-1.5 md:right-2 top-1.5 md:top-2 w-9 md:w-10 h-9 md:h-10 bg-stone-800 text-white rounded-full flex items-center justify-center hover:bg-stone-700 active:scale-90 transition-all duration-200 focus:outline-none touch-manipulation"
                    >
                      {sendingMessage ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-3.5 md:w-4 h-3.5 md:h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <Send className="w-3.5 md:w-4 h-3.5 md:h-4 ml-0.5" />
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Indicador de modo efímero */}
                {ephemeralMode && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-6 md:-top-8 left-4 md:left-6 text-xs text-amber-600 font-light"
                  >
                    ✨ Se desvanece en 24h
                  </motion.div>
                )}
              </div>
              
              {/* Opciones minimalistas - Móvil */}
              <div className="flex justify-center mt-3 md:mt-4 space-x-4 md:space-x-6">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEphemeralMode(!ephemeralMode)}
                  className={cn(
                    "text-xs font-light tracking-wider transition-all duration-200 py-2 px-3 rounded-full touch-manipulation",
                    ephemeralMode 
                      ? "text-amber-600 bg-amber-50" 
                      : "text-stone-400 hover:text-stone-600 active:bg-stone-50"
                  )}
                >
                  {ephemeralMode ? "∞ Permanente" : "○ Efímero"}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Empty State - Espacio para Respirar */}
      {!selectedConversation && !isMobile && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex items-center justify-center bg-stone-50/20"
        >
          <div className="text-center text-stone-400 max-w-md px-8">
            <motion.div
              animate={{ 
                scale: [1, 1.02, 1],
                opacity: [0.4, 0.6, 0.4]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-24 h-24 mx-auto mb-8 bg-stone-100/50 rounded-full flex items-center justify-center"
            >
              <div className="w-4 h-4 bg-stone-300 rounded-full"></div>
            </motion.div>
            <h3 className="text-xl font-light mb-4 text-stone-600 tracking-wide">La Conversación que Respira</h3>
            <p className="text-sm leading-relaxed font-light opacity-80">
              Un espacio de calma intencional, donde la comunicación no se mide por la cantidad de funciones, 
              sino por la calidad de la conexión.
            </p>
            <p className="text-xs mt-6 opacity-60 tracking-wider">Selecciona una presencia para comenzar</p>
          </div>
        </motion.div>
      )}

      {/* Selector de Emojis - Optimizado para Táctil */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-stone-800/10 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEmojiPicker(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-stone-200/50 max-w-sm w-full"
            >
              <p className="text-sm text-stone-600 mb-4 md:mb-6 text-center font-light tracking-wide">
                Reacciona con un pensamiento sutil
              </p>
              <div className="flex justify-center space-x-3 md:space-x-4">
                {quickEmojis.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addReaction(reactionTarget, emoji)}
                    className="w-12 md:w-14 h-12 md:h-14 bg-stone-50 hover:bg-stone-100 active:bg-stone-200 rounded-2xl flex items-center justify-center text-xl md:text-2xl transition-all duration-200 hover:shadow-sm touch-manipulation"
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