import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Send, Camera, Mic, Smile, Phone } from 'lucide-react';
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
  const [chatRequests, setChatRequests] = useState([]);
  const [storyUsers, setStoryUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionTarget, setReactionTarget] = useState(null);
  const [ephemeralMode, setEphemeralMode] = useState(false);
  const longPressTimer = useRef(null);
  const { user, apiRequest } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Mobile responsive
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const showInbox = !selectedConversation;
  const showChat = selectedConversation;

  // Debug logging
  console.log('🔍 MessagesPage render:', {
    selectedConversation: selectedConversation?.id || 'null',
    showInbox,
    showChat
  });

  // Mock data for TikTok-style stories
  const mockStoryUsers = [
    { id: '1', name: 'Sarah Johnson ✨', avatar: '🇺🇸', hasStory: true },
    { id: '2', name: 'Ahmed Hassan 🌟', avatar: '🇺🇸', hasStory: true },
    { id: '3', name: 'Parque MinSu 🎵', avatar: '🇺🇸', hasStory: true },
    { id: '4', name: 'María Rodríguez 💖', avatar: '🇺🇸', hasStory: true },
    { id: '5', name: 'Elena Volkov 🔥', avatar: '🇺🇸', hasStory: true },
    { id: '6', name: 'Jake Thompson 🚀', avatar: '🇺🇸', hasStory: false },
    { id: '7', name: 'Yuki Tanaka 🌸', avatar: '🇺🇸', hasStory: true },
  ];

  // Mock data for TikTok-style inbox messages
  const mockInboxItems = [
    {
      id: '1',
      type: 'followers',
      icon: '👥',
      iconBg: '#0096ff',
      title: 'seguidores',
      message: '',
      count: 99,
      isNotification: true
    },
    {
      id: '2', 
      type: 'activity',
      icon: '🔔',
      iconBg: '#FF4B8D',
      title: 'Actividad',
      message: '',
      count: 99,
      isNotification: true
    },
    {
      id: '3',
      type: 'chat',
      avatar: '🇺🇸',
      title: 'Sarah Johnson ✨',
      message: '¡Hola! Me encantó tu último video...',
      count: 3,
      time: 'ahora'
    },
    {
      id: '4', 
      type: 'chat',
      avatar: '🇺🇸',
      title: 'Ahmed Hassan 🌟',
      message: 'شكرا لك، هل يمكننا التعاون؟',
      count: 1,
      time: '2h'
    },
    {
      id: '5',
      type: 'chat', 
      avatar: '🇺🇸',
      title: 'Parque MinSu 🎵',
      message: '안녕하세요! 정말 멋진 영상이었어요...',
      count: 2,
      time: '5h'
    },
    {
      id: '6',
      type: 'chat',
      avatar: '🇺🇸', 
      title: 'María Rodríguez 💖',
      message: '¡Hola! Me encanta tu contenido. ...',
      count: 1,
      time: '1d'
    },
    {
      id: '7',
      type: 'chat',
      avatar: '🇺🇸',
      title: 'Elena Volkov 🔥', 
      message: 'Привет! ¡Dos contenidos súper...',
      count: 4,
      time: '2d'
    },
    {
      id: '8',
      type: 'chat',
      avatar: '🇺🇸',
      title: 'Jake Thompson 🚀',
      message: 'Amigo, tu última tendencia de b...',
      count: 7,
      time: '3d'
    },
    {
      id: '9',
      type: 'chat',
      avatar: '🇺🇸',
      title: 'Yuki Tanaka 🌸',
      message: 'こんにちは！あなたの動画、とて...',
      count: 1,
      time: '1w'
    }
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadConversations();
    loadChatRequests();
  }, []);

  // Force inbox to show by clearing selected conversation
  useEffect(() => {
    setSelectedConversation(null);
  }, []);

  // Procesar parámetro 'user' de la URL para iniciar chat desde perfil
  useEffect(() => {
    const targetParam = searchParams.get('user');
    if (targetParam && user && conversations.length > 0) {
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
      
      let targetUser = null;
      
      try {
        // Intentar buscar por username primero usando la API de búsqueda
        const searchResults = await apiRequest(`/api/users/search?q=${encodeURIComponent(targetParam)}`);
        targetUser = searchResults.find(u => u.username === targetParam);
        
        // Si no se encuentra por username exacto, buscar por coincidencia parcial
        if (!targetUser && searchResults.length > 0) {
          targetUser = searchResults.find(u => u.username.toLowerCase().includes(targetParam.toLowerCase()));
        }
      } catch (searchError) {
        console.log('⚠️ Search API failed:', searchError.message);
      }
      
      // Si no se encuentra por búsqueda, intentar buscar por ID usando el endpoint de perfil
      if (!targetUser && targetParam) {
        try {
          // Intentar buscar por username usando el endpoint by-username
          const profileResponse = await apiRequest(`/api/user/profile/by-username/${targetParam}`);
          if (profileResponse) {
            targetUser = {
              id: profileResponse.id,
              username: profileResponse.username,
              display_name: profileResponse.display_name
            };
          }
        } catch (profileError) {
          console.log('⚠️ Could not find user by username via profile:', profileError.message);
          
          // Último intento: buscar por ID si el parámetro parece ser un ID
          if (targetParam.includes('-') && targetParam.length > 20) {
            try {
              const profileByIdResponse = await apiRequest(`/api/user/profile/${targetParam}`);
              if (profileByIdResponse) {
                targetUser = {
                  id: profileByIdResponse.id,
                  username: profileByIdResponse.username,
                  display_name: profileByIdResponse.display_name
                };
              }
            } catch (idError) {
              console.log('⚠️ Could not find user by ID:', idError.message);
            }
          }
        }
      }
      
      console.log('🔍 User search result:', {
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
          title: "💬 Chat Iniciado",
          description: `Conectado con ${targetUser.display_name}. ¡Envía tu primer mensaje!`,
        });
      } else {
        console.error('❌ Usuario no encontrado:', targetParam);
        
        // Mostrar un toast más amigable y ofrecer alternativas
        toast({
          title: "🔍 Usuario no encontrado",
          description: "Intenta buscar usuarios en la sección 'Iniciar Conversación'",
          variant: "default"
        });
        
        // Automaticamente abrir el panel de nueva conversación para ayudar al usuario
        setShowNewChat(true);
      }
    } catch (error) {
      console.error('❌ Error manejando chat desde perfil:', error);
      toast({
        title: "⚠️ Error de Conexión",
        description: "Problema al conectar con el perfil. Intenta de nuevo.",
        variant: "destructive"
      });
      
      // En caso de error, también abrir el panel de nueva conversación
      setShowNewChat(true);
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

  // Duplicate function removed - already exists above

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
    <div className="h-screen bg-white flex flex-col relative overflow-hidden font-['Inter',system-ui,sans-serif]">
      {/* TikTok-style Inbox */}
      {showInbox && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col bg-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-20">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewChat(true)}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <Plus className="w-5 h-5 text-black" strokeWidth={2} />
            </motion.button>
            
            <h1 className="text-lg font-semibold text-black">Inbox</h1>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <Search className="w-5 h-5 text-black" strokeWidth={2} />
            </motion.button>
          </div>

          {/* Stories Row */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
              {mockStoryUsers.map((storyUser, index) => (
                <motion.div
                  key={storyUser.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 flex flex-col items-center space-y-2"
                >
                  <div className={cn(
                    "w-18 h-18 rounded-full flex items-center justify-center text-2xl relative",
                    storyUser.hasStory ? "ring-2 ring-pink-500 ring-offset-2" : "bg-gray-100"
                  )}
                  style={{ width: '72px', height: '72px' }}>
                    {storyUser.avatar}
                    {storyUser.hasStory && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Plus className="w-3 h-3 text-white" strokeWidth={2} />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-700 text-center max-w-16 truncate font-medium">
                    {storyUser.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto">
            {mockInboxItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  if (item.type === 'chat') {
                    // Mock conversation for demo
                    setSelectedConversation({
                      id: item.id,
                      participants: [{
                        id: item.id,
                        username: item.title.replace(/[^\w]/g, '').toLowerCase(),
                        display_name: item.title
                      }]
                    });
                  }
                }}
                className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
              >
                {/* Icon/Avatar */}
                <div className="flex-shrink-0">
                  {item.isNotification ? (
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg"
                      style={{ 
                        backgroundColor: item.iconBg,
                        width: '48px', 
                        height: '48px' 
                      }}
                    >
                      <span>{item.icon}</span>
                    </div>
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-gray-100"
                      style={{ width: '48px', height: '48px' }}
                    >
                      {item.avatar}
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-black text-base truncate">
                      {item.title}
                    </span>
                    {item.time && (
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {item.time}
                      </span>
                    )}
                  </div>
                  {item.message && (
                    <p className="text-sm text-gray-600 truncate leading-relaxed">
                      {item.message}
                    </p>
                  )}
                </div>
                
                {/* Badge */}
                {item.count > 0 && (
                  <div 
                    className="flex-shrink-0 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#FF4B8D' }}
                  >
                    <span className="text-xs text-white font-bold">
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Bottom padding for mobile */}
          <div className="h-4"></div>
        </motion.div>
      )}

      {/* Chat View */}
      {showChat && (
        <motion.div 
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 flex flex-col bg-white"
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedConversation(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-black" strokeWidth={2} />
              </motion.button>
              
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                🇺🇸
              </div>
              
              <div>
                <h2 className="font-semibold text-black text-base">
                  {selectedConversation.participants[0].display_name}
                </h2>
                <p className="text-sm text-green-600">Activo ahora</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Phone className="w-5 h-5 text-black" strokeWidth={2} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Camera className="w-5 h-5 text-black" strokeWidth={2} />
              </motion.button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 space-y-4"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-2xl">
                  🇺🇸
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-black">
                    {selectedConversation.participants[0].display_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Inicia una conversación
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isOwnMessage = message.sender_id === user.id;
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "flex",
                        isOwnMessage ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
                        isOwnMessage
                          ? "bg-pink-500 text-white"
                          : "bg-gray-200 text-black"
                      )}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-100 p-4">
            <form onSubmit={sendMessage} className="flex items-center space-x-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Camera className="w-5 h-5 text-gray-600" strokeWidth={2} />
              </motion.button>
              
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="w-full px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                  disabled={sendingMessage}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Smile className="w-4 h-4 text-gray-600" strokeWidth={2} />
                </motion.button>
              </div>
              
              {newMessage.trim() ? (
                <motion.button
                  type="submit"
                  disabled={sendingMessage}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-pink-500 text-white p-2 rounded-full hover:bg-pink-600 transition-colors disabled:opacity-50"
                >
                  {sendingMessage ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" 
                    />
                  ) : (
                    <Send className="w-5 h-5" strokeWidth={2} />
                  )}
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Mic className="w-5 h-5 text-gray-600" strokeWidth={2} />
                </motion.button>
              )}
            </form>
          </div>
        </motion.div>
      )}

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewChat(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-black mb-4">Nueva conversación</h3>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((searchUser) => (
                    <motion.button
                      key={searchUser.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => startConversation(searchUser)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        🇺🇸
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-black text-sm">{searchUser.display_name}</p>
                        <p className="text-xs text-gray-600">@{searchUser.username}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagesPage;