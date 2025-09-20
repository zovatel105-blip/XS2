import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Mic, Image, Smile, Eye, EyeOff, Music, Link, Gift, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MessagesPage = () => {
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

  // Emoji reactions para el selector
  const quickEmojis = ['❤️', '😂', '👍', '😮', '😢', '🔥', '🎉', '✨'];

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex">
      {/* Lista de Conversaciones - El Susurro */}
      {showList && (
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full md:w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col"
        >
          {/* Header Minimalista */}
          <div className="p-6 border-b border-gray-100/50">
            <div className="flex items-center justify-between mb-6">
              <motion.h1 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-light text-gray-800 tracking-wide"
              >
                Mensajes
              </motion.h1>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewChat(!showNewChat)}
                className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all duration-200"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>

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

      {/* Chat Area - La Conversación */}
      {showChat && (
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 flex flex-col bg-white/60 backdrop-blur-xl"
        >
          {/* Header del Chat */}
          <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100/50 p-4">
            <div className="flex items-center">
              {isMobile && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedConversation(null)}
                  className="mr-3 p-2 hover:bg-gray-100/50 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              )}
              <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mr-3">
                <span className="text-gray-600 font-medium">
                  {selectedConversation.participants[0].display_name[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="font-medium text-gray-900">
                  {selectedConversation.participants[0].display_name}
                </h2>
                <p className="text-sm text-gray-500">
                  presente
                </p>
              </div>
              
              {/* Botón Modo Efímero */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEphemeralMode(!ephemeralMode)}
                className={cn(
                  "p-2 rounded-full transition-all mr-2",
                  ephemeralMode 
                    ? "bg-amber-100 text-amber-600" 
                    : "hover:bg-gray-100/50 text-gray-400"
                )}
              >
                {ephemeralMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>

          {/* Mensajes - Las Burbujas que Respiran */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-gray-400 py-16"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100/50 rounded-full flex items-center justify-center">
                  <Send className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm mb-1">El silencio es oro</p>
                <p className="text-xs">Comienza la conversación</p>
              </motion.div>
            ) : (
              messages.map((message, index) => {
                const isOwnMessage = message.sender_id === user.id;
                const isEphemeral = message.is_ephemeral;
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: isEphemeral ? 0.7 : 1, 
                      y: 0,
                      scale: 1
                    }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex",
                      isOwnMessage ? "justify-end" : "justify-start"
                    )}
                    onMouseDown={() => startLongPress(message.id)}
                    onMouseUp={endLongPress}
                    onMouseLeave={endLongPress}
                    onTouchStart={() => startLongPress(message.id)}
                    onTouchEnd={endLongPress}
                  >
                    <motion.div
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }}
                      className={cn(
                        "max-w-xs lg:max-w-md px-4 py-3 rounded-3xl relative group cursor-pointer",
                        isOwnMessage
                          ? "bg-gray-900 text-white"
                          : "bg-white/80 backdrop-blur-sm text-gray-900 border border-gray-100/50",
                        isEphemeral && "animate-pulse border-dashed"
                      )}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p
                        className={cn(
                          "text-xs mt-2 opacity-60",
                          isOwnMessage ? "text-gray-300" : "text-gray-500"
                        )}
                      >
                        {formatTime(message.created_at)}
                        {isEphemeral && " • efímero"}
                      </p>
                      
                      {/* Reacciones */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex mt-2 space-x-1">
                          {message.reactions.map((reaction, i) => (
                            <span key={i} className="text-xs bg-white/20 rounded-full px-2 py-1">
                              {reaction.emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de Mensaje - Sin Ruido */}
          <div className="bg-white/80 backdrop-blur-xl border-t border-gray-100/50 p-4">
            <form onSubmit={sendMessage} className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={ephemeralMode ? "Susurra algo efímero..." : "Escribe tu susurro..."}
                  className={cn(
                    "w-full px-4 py-3 bg-gray-50/80 border rounded-full focus:outline-none focus:ring-1 transition-all text-sm",
                    ephemeralMode 
                      ? "border-amber-200 focus:ring-amber-300 focus:border-transparent bg-amber-50/50" 
                      : "border-gray-200/50 focus:ring-gray-300 focus:border-transparent"
                  )}
                  disabled={sendingMessage}
                />
              </div>
              
              {/* Botones de Acción Minimalistas */}
              <div className="flex items-center space-x-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-full transition-all"
                >
                  <Image className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!newMessage.trim() || sendingMessage}
                  className={cn(
                    "p-3 rounded-full focus:outline-none transition-all",
                    newMessage.trim() && !sendingMessage
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {sendingMessage ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                    />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </form>
          </div>

          {/* Menú de Compartir */}
          <AnimatePresence>
            {showShareMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-20 right-4 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-lg p-2"
              >
                <div className="flex space-x-2">
                  <button className="p-3 hover:bg-gray-100/50 rounded-xl transition-colors">
                    <Music className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-3 hover:bg-gray-100/50 rounded-xl transition-colors">
                    <Link className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-3 hover:bg-gray-100/50 rounded-xl transition-colors">
                    <Gift className="w-5 h-5 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => setShowShareMenu(false)}
                    className="p-3 hover:bg-gray-100/50 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty State para Desktop */}
      {!selectedConversation && !isMobile && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-white/50"
        >
          <div className="text-center text-gray-400 max-w-sm">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-20 h-20 mx-auto mb-6 bg-gray-100/50 rounded-full flex items-center justify-center"
            >
              <Send className="w-8 h-8 text-gray-300" />
            </motion.div>
            <h3 className="text-lg font-light mb-2 text-gray-600">El Susurro Inteligente</h3>
            <p className="text-sm leading-relaxed">Una conversación que se adapta a ti —no al revés</p>
            <p className="text-xs mt-4 opacity-60">Selecciona una presencia para comenzar</p>
          </div>
        </motion.div>
      )}

      {/* Selector de Emojis */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowEmojiPicker(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-gray-200/50"
            >
              <p className="text-sm text-gray-600 mb-4 text-center">Reacciona con un toque</p>
              <div className="flex space-x-3">
                {quickEmojis.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addReaction(reactionTarget, emoji)}
                    className="w-12 h-12 bg-gray-50/50 hover:bg-gray-100/50 rounded-2xl flex items-center justify-center text-xl transition-colors"
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