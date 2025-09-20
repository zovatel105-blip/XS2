import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Mic, Image, Smile, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
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
  const { user, apiRequest } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const longPressTimer = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      // Poll for new messages every 3 seconds
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

  const startConversation = (selectedUser) => {
    // Check if conversation already exists
    const existingConv = conversations.find(conv => 
      conv.participants.some(p => p.id === selectedUser.id)
    );

    if (existingConv) {
      setSelectedConversation(existingConv);
    } else {
      // Create a temporary conversation object
      const tempConv = {
        id: null, // Will be created when first message is sent
        participants: [selectedUser],
        last_message: null,
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
      
      await apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipient_id: recipientId,
          content: messageText,
          message_type: 'text'
        })
      });

      // Reload conversations and messages
      await loadConversations();
      if (selectedConversation.id) {
        await loadMessages(selectedConversation.id);
      } else {
        // Find the new conversation
        const updatedConvs = await apiRequest('/api/conversations');
        const newConv = updatedConvs.find(conv => 
          conv.participants.some(p => p.id === recipientId)
        );
        if (newConv) {
          setSelectedConversation(newConv);
          await loadMessages(newConv.id);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
      setNewMessage(messageText); // Restore message
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    }
  };

  // Mobile view - show conversation list or chat
  const isMobile = window.innerWidth < 768;
  const showList = !selectedConversation || !isMobile;
  const showChat = selectedConversation && (!showList || !isMobile);

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Conversations List */}
      {showList && (
        <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-gray-900">Mensajes</h1>
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Search */}
            {showNewChat && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar usuarios..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => startConversation(user)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center"
                      >
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-medium">
                            {user.display_name[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.display_name}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Send className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No tienes conversaciones aún</p>
                <p className="text-sm">¡Busca usuarios para empezar a chatear!</p>
              </div>
            ) : (
              conversations.map(conversation => {
                const otherUser = conversation.participants[0];
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100",
                      selectedConversation?.id === conversation.id && "bg-purple-50"
                    )}
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-medium">
                          {otherUser.display_name[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            {otherUser.display_name}
                          </span>
                          {conversation.last_message_at && (
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.last_message_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 truncate">
                            {conversation.last_message || 'Inicia una conversación'}
                          </span>
                          {conversation.unread_count > 0 && (
                            <span className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      {showChat && (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center">
              {isMobile && (
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="mr-3 p-1 hover:bg-gray-100 rounded"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-medium">
                  {selectedConversation.participants[0].display_name[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">
                  {selectedConversation.participants[0].display_name}
                </h2>
                <p className="text-sm text-gray-500">
                  @{selectedConversation.participants[0].username}
                </p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded">
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Circle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Inicia la conversación</p>
                <p className="text-sm">Envía tu primer mensaje</p>
              </div>
            ) : (
              messages.map(message => {
                const isOwnMessage = message.sender_id === user.id;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      isOwnMessage ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
                        isOwnMessage
                          ? "bg-purple-500 text-white"
                          : "bg-gray-200 text-gray-900"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          isOwnMessage ? "text-purple-100" : "text-gray-500"
                        )}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={sendMessage} className="flex items-center space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={sendingMessage}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Empty State for Desktop */}
      {!selectedConversation && !isMobile && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <Send className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Selecciona una conversación</h3>
            <p>Elige una conversación para empezar a chatear</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;