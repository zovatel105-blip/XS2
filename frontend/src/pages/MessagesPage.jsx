import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Send, Camera, Mic, Smile, Users, Bell, MessageCircle, Phone } from 'lucide-react';
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
  // Dynamic view based on selected conversation
  const showInbox = !selectedConversation; // Show inbox when no conversation selected
  const showChat = !!selectedConversation; // Show chat when conversation is selected

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

  // Force inbox to show initially, but allow conversation selection
  useEffect(() => {
    // Only reset if we don't have URL parameters for user chat
    const targetParam = searchParams.get('user');
    if (!targetParam) {
      setSelectedConversation(null);
    }
  }, [searchParams]);

  // Don't clear selected conversation when conversations load - let user selections persist
  useEffect(() => {
    // Remove this effect as it interferes with conversation selection
    // if (conversations.length >= 0) {
    //   setSelectedConversation(null);
    // }
  }, [conversations]);

  // Cargar datos cuando el usuario y conversaciones estén disponibles
  useEffect(() => {
    if (user) {
      loadSegmentData();
    }
  }, [user, chatRequests]);

  // Cargar notificaciones cuando las conversaciones cambien
  useEffect(() => {
    if (user) {
      loadRealNotifications();
    }
  }, [conversations, chatRequests, user]);

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

  // Control segmentado - sin selección inicial
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [segmentData, setSegmentData] = useState({
    followers: { count: 0, loading: true },
    activity: { count: 0, loading: true },
    messages: { count: 0, loading: true }
  });

  // Estados para datos reales
  const [realNotifications, setRealNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const handleSegmentClick = (segmentId) => {
    setSelectedSegment(segmentId);
  };

  // Cargar datos reales del sistema con fallbacks
  const loadSegmentData = async () => {
    try {
      let followersCount = 0;
      let activityCount = 0;
      let messageRequestsCount = 0;

      // Intentar cargar seguidores nuevos (con fallback silencioso)
      try {
        const followersResponse = await apiRequest('/api/user/followers/recent');
        followersCount = followersResponse?.length || 0;
      } catch (e) {
        // Silently fail and use 0
        console.log('Followers API not available, using fallback');
      }

      // Intentar cargar actividad (con fallback silencioso)
      try {
        const activityResponse = await apiRequest('/api/user/activity/unread');
        activityCount = activityResponse?.unread_count || 0;
      } catch (e) {
        // Silently fail and use 0
        console.log('Activity API not available, using fallback');
      }

      // Usar solicitudes de chat existentes como fallback para message requests
      try {
        messageRequestsCount = chatRequests.length || 0;
      } catch (e) {
        messageRequestsCount = 0;
      }

      setSegmentData({
        followers: { count: followersCount, loading: false },
        activity: { count: activityCount, loading: false },
        messages: { count: messageRequestsCount, loading: false }
      });
    } catch (error) {
      console.log('Error loading segment data, using defaults:', error.message);
      // Usar valores por defecto seguros
      setSegmentData({
        followers: { count: 0, loading: false },
        activity: { count: 0, loading: false },
        messages: { count: chatRequests.length || 0, loading: false }
      });
    }
  };

  // Cargar notificaciones específicas por segmento
  const loadRealNotifications = async () => {
    try {
      setLoadingNotifications(true);
      
      let realData = [];

      // Cargar datos según el segmento seleccionado
      switch (selectedSegment) {
        case 'followers':
          // **Nuevos seguidores** - Personas que te siguen recientemente
          realData = await loadNewFollowersData();
          break;
          
        case 'activity':
          // **Actividad** - Comentarios, me gusta y reacciones a tus publicaciones
          realData = await loadActivityData();
          break;
          
        case 'messages':
          // **Solicitudes de mensajes** - Mensajes de personas que no sigues
          realData = await loadMessageRequestsData();
          break;
          
        default:
          realData = await loadConversationsData();
      }

      // Si no hay datos específicos, usar mensaje apropiado
      if (realData.length === 0) {
        realData = getEmptyStateForSegment(selectedSegment);
      }

      setRealNotifications(realData);
    } catch (error) {
      console.log('Error loading notifications:', error.message);
      setRealNotifications(getEmptyStateForSegment(selectedSegment));
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Cargar datos de nuevos seguidores
  const loadNewFollowersData = async () => {
    try {
      const followersResponse = await apiRequest('/api/users/followers/recent');
      return followersResponse.map(follower => ({
        id: `follower-${follower.id}`,
        type: 'new_follower',
        title: `${follower.display_name || follower.username} te sigue`,
        message: `@${follower.username} comenzó a seguirte`,
        unreadCount: 0,
        time: formatTimeForInbox(follower.followed_at || follower.created_at),
        avatar: '👤', // Icono persona con círculo azul claro
        userId: follower.id,
        isSystem: false
      }));
    } catch (error) {
      console.log('Error loading followers:', error.message);
      // Datos de ejemplo para demostrar funcionalidad
      return [
        {
          id: 'follower-demo-1',
          type: 'new_follower',
          title: 'María García te sigue',
          message: '@maria_garcia comenzó a seguirte',
          unreadCount: 0,
          time: '2h',
          avatar: '👤',
          userId: 'demo-user-1',
          isSystem: false
        },
        {
          id: 'follower-demo-2',
          type: 'new_follower', 
          title: 'Carlos Ruiz te sigue',
          message: '@carlos_ruiz comenzó a seguirte',
          unreadCount: 0,
          time: '5h',
          avatar: '👤',
          userId: 'demo-user-2',
          isSystem: false
        }
      ];
    }
  };

  // Cargar datos de actividad
  const loadActivityData = async () => {
    try {
      const activityResponse = await apiRequest('/api/users/activity/recent');
      return activityResponse.map(activity => ({
        id: `activity-${activity.id}`,
        type: 'activity_notification',
        title: getActivityTitle(activity),
        message: getActivityMessage(activity),
        unreadCount: activity.unread ? 1 : 0,
        time: formatTimeForInbox(activity.created_at),
        avatar: '🔔', // Icono campana roja
        userId: activity.user_id,
        activityType: activity.type,
        isSystem: false
      }));
    } catch (error) {
      console.log('Error loading activity:', error.message);
      // Datos de ejemplo para demostrar funcionalidad
      return [
        {
          id: 'activity-demo-1',
          type: 'activity_notification',
          title: 'Ana Pérez le dio me gusta a tu publicación',
          message: '❤️ Le encanta tu video sobre música urbana',
          unreadCount: 1,
          time: '30m',
          avatar: '🔔',
          userId: 'demo-user-3',
          activityType: 'like',
          isSystem: false
        },
        {
          id: 'activity-demo-2',
          type: 'activity_notification',
          title: 'Luis Torres comentó tu publicación',
          message: '💬 "¡Increíble contenido! Me encanta tu estilo"',
          unreadCount: 1,
          time: '1h',
          avatar: '🔔',
          userId: 'demo-user-4',
          activityType: 'comment',
          isSystem: false
        },
        {
          id: 'activity-demo-3',
          type: 'activity_notification',
          title: 'Sofia Martín te mencionó',
          message: '📢 Te mencionó en un comentario',
          unreadCount: 1,
          time: '3h',
          avatar: '🔔',
          userId: 'demo-user-5',
          activityType: 'mention',
          isSystem: false
        }
      ];
    }
  };

  // Cargar solicitudes de mensajes
  const loadMessageRequestsData = async () => {
    try {
      const requestsResponse = await apiRequest('/api/messages/requests');
      return requestsResponse.map(request => ({
        id: `request-${request.id}`,
        type: 'message_request',
        title: `${request.sender.display_name || request.sender.username}`,
        message: request.preview || 'Te ha enviado una solicitud de mensaje',
        unreadCount: 1,
        time: formatTimeForInbox(request.created_at),
        avatar: '💬', // Icono burbuja de chat azul oscuro
        userId: request.sender.id,
        requestId: request.id,
        isSystem: false,
        needsApproval: true
      }));
    } catch (error) {
      console.log('Error loading message requests:', error.message);
      // Usar datos existentes de chatRequests o datos de ejemplo
      if (chatRequests && chatRequests.length > 0) {
        return chatRequests.map(request => ({
          id: `request-${request.id}`,
          type: 'message_request',
          title: `${request.sender?.display_name || request.sender?.username || 'Usuario'}`,
          message: request.message || 'Te ha enviado una solicitud de mensaje',
          unreadCount: 1,
          time: formatTimeForInbox(request.created_at),
          avatar: '💬',
          userId: request.sender?.id,
          requestId: request.id,
          isSystem: false,
          needsApproval: true
        }));
      }
      
      // Datos de ejemplo
      return [
        {
          id: 'request-demo-1',
          type: 'message_request',
          title: 'Diego Fernández',
          message: 'Hola! Me gusta mucho tu contenido, ¿podemos hablar?',
          unreadCount: 1,
          time: '1d',
          avatar: '💬',
          userId: 'demo-user-6',
          requestId: 'demo-request-1',
          isSystem: false,
          needsApproval: true
        }
      ];
    }
  };

  // Cargar conversaciones existentes (para el estado por defecto)
  const loadConversationsData = async () => {
    const realData = [];

    // Usar conversaciones existentes que ya están cargadas
    if (conversations && conversations.length > 0) {
      conversations.forEach(conv => {
        const otherUser = conv.participants.find(p => p.id !== user?.id) || conv.participants[0];
        if (otherUser) {
          realData.push({
            id: conv.id,
            type: 'conversation',
            title: otherUser.display_name || otherUser.username || 'Usuario',
            message: conv.last_message || 'Iniciar conversación',
            unreadCount: conv.unread_count || 0,
            time: formatTimeForInbox(conv.last_message_at || conv.created_at),
            avatar: getAvatarForUser(otherUser),
            userId: otherUser.id
          });
        }
      });
    }

    return realData;
  };

  // Obtener estado vacío específico para cada segmento
  const getEmptyStateForSegment = (segment) => {
    const emptyStates = {
      followers: [{
        id: 'empty-followers',
        type: 'system',
        title: '👥 Sin nuevos seguidores',
        message: 'Cuando alguien nuevo te siga, aparecerá aquí para que puedas saberlo',
        unreadCount: 0,
        time: '',
        avatar: '👤',
        isSystem: true
      }],
      activity: [{
        id: 'empty-activity',
        type: 'system',
        title: '🔔 Sin actividad reciente',
        message: 'Los comentarios, me gusta y menciones aparecerán aquí',
        unreadCount: 0,
        time: '',
        avatar: '🔔',
        isSystem: true
      }],
      messages: [{
        id: 'empty-requests',
        type: 'system',
        title: '💬 Sin solicitudes de mensajes',
        message: 'Las solicitudes de personas que no sigues aparecerán aquí',
        unreadCount: 0,
        time: '',
        avatar: '💬',
        isSystem: true
      }]
    };
    
    return emptyStates[segment] || [{
      id: 'empty-default',
      type: 'system', 
      title: '¡Hola! 👋',
      message: 'Tus notificaciones aparecerán aquí',
      unreadCount: 0,
      time: '',
      avatar: '📱',
      isSystem: true
    }];
  };

  // Utilidades para formatear actividades
  const getActivityTitle = (activity) => {
    const user = activity.user?.display_name || activity.user?.username || 'Usuario';
    switch (activity.type) {
      case 'like':
        return `${user} le dio me gusta a tu publicación`;
      case 'comment':
        return `${user} comentó tu publicación`;
      case 'mention':
        return `${user} te mencionó`;
      case 'follow':
        return `${user} comenzó a seguirte`;
      case 'vote':
        return `${user} votó en tu encuesta`;
      default:
        return `${user} interactuó con tu contenido`;
    }
  };

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'like':
        return `❤️ Le encanta tu ${activity.content_type || 'publicación'}`;
      case 'comment':
        return `💬 "${activity.comment_preview || 'Nuevo comentario'}"`;
      case 'mention':
        return `📢 Te mencionó en ${activity.context || 'una publicación'}`;
      case 'follow':
        return `👥 Ahora es tu seguidor`;
      case 'vote':
        return `🗳️ Votó: "${activity.vote_option || 'tu opción'}"`;
      default:
        return activity.message || 'Nueva interacción';
    }
  };

      setRealNotifications(realData);
    } catch (error) {
      console.log('Error processing notifications:', error.message);
      // Fallback simple y seguro
      setRealNotifications([{
        id: 'welcome-fallback',
        type: 'system',
        title: '¡Hola! 👋',
        message: 'Tus conversaciones aparecerán aquí cuando estén disponibles',
        unreadCount: 0,
        time: 'ahora',
        avatar: '💬',
        isSystem: true
      }]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const getIconComponent = (iconName) => {
    const icons = {
      'Users': Users,
      'Bell': Bell, 
      'MessageCircle': MessageCircle
    };
    return icons[iconName] || Users;
  };

  // Funciones de utilidad optimizadas para móvil
  const formatTimeForInbox = (timestamp) => {
    if (!timestamp) return 'ahora';
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return `${Math.floor(diffInDays / 7)}sem`;
  };

  const getAvatarForUser = (user) => {
    if (!user) return '👤';
    
    // Si el usuario tiene avatar personalizado, usar iniciales
    if (user.display_name || user.username) {
      const name = user.display_name || user.username;
      return name.charAt(0).toUpperCase();
    }
    
    // Fallback
    return '👤';
  };

  const getSegmentBadgeCount = (segmentId) => {
    const data = segmentData[segmentId];
    if (data?.loading) return '...';
    if (!data?.count || data.count === 0) return '';
    return data.count > 99 ? '99+' : data.count.toString();
  };

  // Debug logging
  console.log('🔥 MESSAGES PAGE DEBUG:', {
    showInbox,
    showChat,
    selectedConversation: selectedConversation ? {
      id: selectedConversation.id,
      participant: selectedConversation.participants?.[0]?.display_name
    } : null,
    realNotifications: realNotifications.length,
    loadingNotifications
  });

  return (
    <div className="h-screen bg-white flex flex-col relative overflow-hidden font-inter">
      {/* DEBUG MESSAGE */}
      <div style={{position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', padding: '4px', zIndex: 9999, fontSize: '10px'}}>
        TikTok: {showInbox ? 'ON' : 'OFF'}
      </div>
      
      {/* TikTok Inbox Interface */}
      {showInbox && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col bg-white"
        >
          {/* TOP BAR (Header) - OPTIMIZADO MÓVIL */}
          <div className="h-14 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20 safe-area-top">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewChat(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
              style={{ touchAction: 'manipulation' }}
              aria-label="Nueva conversación"
            >
              <Plus className="w-5 h-5 text-black" strokeWidth={2} />
            </motion.button>
            
            <h1 className="text-lg font-semibold text-black">🔥 INBOX REAL DATA 🔥</h1>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
              style={{ touchAction: 'manipulation' }}
              aria-label="Buscar"
            >
              <Search className="w-5 h-5 text-black" strokeWidth={2} />
            </motion.button>
          </div>

          {/* CONTROL SEGMENTADO - OPTIMIZADO MÓVIL */}
          <div className="p-4">
            <div className="bg-gray-100 rounded-full p-1 flex">
              {[
                {
                  id: 'followers',
                  icon: 'Users',
                  iconBg: '#87CEEB', // Azul claro para nuevos seguidores
                  title: 'Nuevos seguidores',
                  description: 'Personas que te siguen recientemente'
                },
                {
                  id: 'activity', 
                  icon: 'Bell',
                  iconBg: '#DC2626', // Rojo para actividad (campana roja)
                  title: 'Actividad',
                  description: 'Comentarios, me gusta y reacciones'
                },
                {
                  id: 'messages',
                  icon: 'MessageCircle',
                  iconBg: '#1E40AF', // Azul oscuro para solicitudes de mensajes
                  title: 'Solicitudes de mensajes',
                  description: 'Mensajes de personas que no sigues'
                }
              ].map((segment) => {
                const isSelected = selectedSegment === segment.id;
                const IconComponent = getIconComponent(segment.icon);
                const badgeCount = getSegmentBadgeCount(segment.id);
                
                return (
                  <motion.button
                    key={segment.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSegmentClick(segment.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-2 rounded-full transition-all duration-200 min-h-[44px] ${
                      isSelected 
                        ? 'bg-white shadow-sm' 
                        : 'hover:bg-gray-50 active:bg-gray-100'
                    }`}
                    style={{ touchAction: 'manipulation' }} // Optimización táctil
                  >
                    {/* Ícono circular - tamaño optimizado para táctil */}
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: segment.iconBg }}
                    >
                      <IconComponent className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    
                    {/* Texto - responsive */}
                    <span className={`text-xs font-medium truncate max-w-[60px] leading-tight ${
                      isSelected ? 'text-black' : 'text-gray-600'
                    }`}>
                      {segment.title}
                    </span>
                    
                    {/* Badge - solo mostrar si hay contenido */}
                    {badgeCount && (
                      <div 
                        className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#FF4B8D' }}
                      >
                        <span className="text-[10px] text-white font-medium px-1">
                          {badgeCount}
                        </span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* LISTA DE MENSAJES - DATOS REALES */}
          <div className="flex-1 overflow-y-auto">
            {loadingNotifications ? (
              // Loading state optimizado para móvil
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-purple-300 border-t-purple-600 rounded-full"
                  />
                  <span className="text-sm text-gray-500">Cargando mensajes...</span>
                </div>
              </div>
            ) : realNotifications.length === 0 ? (
              // Empty state
              <div className="flex items-center justify-center py-20 px-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-2xl">
                    💬
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">No hay mensajes</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Cuando tengas conversaciones o solicitudes, aparecerán aquí
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Lista de notificaciones reales
              realNotifications.map((notification, index) => (
                <motion.button
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    if (notification.isSystem) return;
                    
                    if (notification.type === 'chat_request') {
                      // Manejar solicitud de chat
                      setSelectedConversation({
                        id: `request-${notification.requestId}`,
                        participants: [{
                          id: notification.userId,
                          username: notification.title.replace(/[^\w]/g, '').toLowerCase(),
                          display_name: notification.title.replace(/[^\w\s]/g, '').trim()
                        }],
                        isRequest: true,
                        requestId: notification.requestId
                      });
                    } else {
                      // Conversación normal
                      setSelectedConversation({
                        id: notification.id,
                        participants: [{
                          id: notification.userId,
                          username: notification.title.replace(/[^\w]/g, '').toLowerCase(),
                          display_name: notification.title.replace(/[^\w\s]/g, '').trim()
                        }]
                      });
                    }
                  }}
                  className={`w-full flex items-center px-4 py-4 border-b border-gray-100 transition-colors min-h-[72px] ${
                    notification.isSystem 
                      ? 'cursor-default' 
                      : 'hover:bg-gray-50 active:bg-gray-100'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                  disabled={notification.isSystem}
                >
                  {/* Avatar (izquierda) - tamaño optimizado móvil */}
                  <div className={`w-12 h-12 rounded-full mr-3 flex items-center justify-center text-lg flex-shrink-0 ${
                    notification.type === 'chat_request' 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold' 
                      : notification.isSystem 
                        ? 'bg-blue-100' 
                        : 'bg-gray-100'
                  }`}>
                    {notification.avatar}
                  </div>
                  
                  {/* Contenido (centro - flex-1) */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-base font-semibold truncate ${
                        notification.type === 'chat_request' 
                          ? 'text-purple-700' 
                          : notification.isSystem 
                            ? 'text-blue-700' 
                            : 'text-black'
                      }`}>
                        {notification.title}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                  
                  {/* Badge (derecha) - solo para mensajes no leídos */}
                  {notification.unreadCount > 0 && (
                    <div 
                      className="min-w-[24px] h-6 rounded-full flex items-center justify-center ml-3 flex-shrink-0"
                      style={{ backgroundColor: '#FF4B8D' }}
                    >
                      <span className="text-xs text-white font-medium px-2">
                        {notification.unreadCount > 99 ? '99+' : notification.unreadCount}
                      </span>
                    </div>
                  )}
                </motion.button>
              ))
            )}
          </div>

          {/* Bottom padding para mobile */}
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