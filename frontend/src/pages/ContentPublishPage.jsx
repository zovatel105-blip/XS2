import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Hash, AtSign, MessageCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import UserMentionInput from '../components/UserMentionInput';
import pollService from '../services/pollService';

const ContentPublishPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // States
  const [title, setTitle] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [mentionInputValue, setMentionInputValue] = useState('');
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [contentData, setContentData] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Get content data from navigation state
  useEffect(() => {
    const data = location.state?.contentData;
    if (!data) {
      // No content data, redirect back to creation
      navigate('/content-creation');
      return;
    }
    setContentData(data);
  }, [location.state, navigate]);

  const handleBack = () => {
    navigate('/content-creation');
  };

  const handleMentionSelect = (user) => {
    if (!mentionedUsers.find(u => u.id === user.id)) {
      setMentionedUsers(prev => [...prev, user]);
    }
    setMentionInputValue('');
  };

  const handleRemoveMention = (userId) => {
    setMentionedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const parseHashtags = (hashtagText) => {
    if (!hashtagText.trim()) return [];
    
    // Split by spaces or commas, filter out empty strings, and ensure they start with #
    return hashtagText
      .split(/[\s,]+/)
      .filter(tag => tag.trim())
      .map(tag => {
        const cleanTag = tag.trim();
        return cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`;
      });
  };

  const handleFinalPublish = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Necesitas escribir un título para tu publicación",
        variant: "destructive"
      });
      return;
    }

    if (!contentData) {
      toast({
        title: "Error",
        description: "No hay contenido para publicar",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);

    try {
      // Combine mentioned users from content and title mentions
      const allMentionedUsers = [
        ...contentData.mentioned_users,
        ...mentionedUsers.map(user => user.id)
      ];

      const pollData = {
        title: title.trim(),
        description: null,
        options: contentData.options,
        music_id: contentData.music_id,
        tags: parseHashtags(hashtags),
        category: 'general',
        mentioned_users: [...new Set(allMentionedUsers)], // Remove duplicates
        video_playbook_settings: null,
        layout: contentData.layout,
        comments_enabled: commentsEnabled
      };

      console.log('Creating poll with data:', pollData);

      // Create poll using API
      const newPoll = await pollService.createPoll(pollData);

      toast({
        title: "🎉 ¡Publicación creada!",
        description: "Tu contenido ha sido publicado exitosamente",
      });

      // Navigate to feed after successful publication
      setTimeout(() => {
        navigate('/feed');
      }, 1500);

    } catch (error) {
      console.error('Error creating content:', error);
      
      let errorMessage = "No se pudo crear la publicación. Inténtalo de nuevo.";
      
      if (error.message) {
        if (error.message.includes('Not authenticated')) {
          errorMessage = "Tu sesión ha expirado. Inicia sesión nuevamente.";
          setTimeout(() => navigate('/'), 2000);
        } else if (error.message.includes('validation')) {
          errorMessage = "Error en los datos. Verifica que todos los campos estén correctos.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Error al crear publicación",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Show loading screen if not authenticated or no content data
  if (!isAuthenticated || !contentData) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-50 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-black/30 backdrop-blur-sm">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center text-white bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <h1 className="text-white text-lg font-semibold">Publicar Contenido</h1>
        
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-white bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md mx-auto px-4 py-20 space-y-6">
        
        {/* Content Preview */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h3 className="text-white text-sm font-medium mb-3">Vista previa del contenido</h3>
          <div className="flex gap-2 overflow-x-auto">
            {contentData.options.map((option, index) => (
              <div key={index} className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-800">
                {option.media_type?.startsWith('image') ? (
                  <img 
                    src={option.media_url} 
                    alt={`Option ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video 
                    src={option.media_url}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}
              </div>
            ))}
          </div>
          {contentData.music && (
            <p className="text-white/70 text-xs mt-2">
              🎵 {contentData.music.title} - {contentData.music.artist}
            </p>
          )}
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium flex items-center gap-2">
            <span>Título</span>
            <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="Escribe el título de tu publicación..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/20 focus:border-white/50 focus:outline-none placeholder-gray-300"
            maxLength={200}
          />
          <p className="text-white/50 text-xs">{title.length}/200 caracteres</p>
        </div>

        {/* Hashtags Input */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium flex items-center gap-2">
            <Hash className="w-4 h-4" />
            <span>Hashtags</span>
          </label>
          <input
            type="text"
            placeholder="#hashtag1 #hashtag2 #hashtag3"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            className="w-full bg-black/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/20 focus:border-white/50 focus:outline-none placeholder-gray-300"
          />
          <p className="text-white/50 text-xs">Separa los hashtags con espacios o comas</p>
        </div>

        {/* Mentions in Title */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium flex items-center gap-2">
            <AtSign className="w-4 h-4" />
            <span>Mencionar en el título</span>
          </label>
          
          {/* Mentioned Users Display */}
          {mentionedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {mentionedUsers.map((user) => (
                <span
                  key={user.id}
                  className="bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  @{user.username}
                  <button
                    onClick={() => handleRemoveMention(user.id)}
                    className="text-blue-200 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <UserMentionInput
            value={mentionInputValue}
            onChange={setMentionInputValue}
            onMentionSelect={handleMentionSelect}
            placeholder="Buscar usuarios para mencionar..."
            className="w-full bg-black/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/20 focus:border-white/50 focus:outline-none placeholder-gray-300"
          />
        </div>

        {/* Comments Toggle */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium flex items-center gap-2">
            {commentsEnabled ? (
              <MessageCircle className="w-4 h-4" />
            ) : (
              <MessageCircleOff className="w-4 h-4" />
            )}
            <span>Configuración de comentarios</span>
          </label>
          
          <div className="flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <span className="text-white">
              {commentsEnabled ? 'Comentarios activados' : 'Comentarios desactivados'}
            </span>
            <button
              onClick={() => setCommentsEnabled(!commentsEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                commentsEnabled ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  commentsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Publish Button */}
        <button
          onClick={handleFinalPublish}
          disabled={isPublishing || !title.trim()}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPublishing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Publicando...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              PUBLICAR
            </>
          )}
        </button>

        <p className="text-white/70 text-center text-sm">
          Una vez publicado, tu contenido será visible para todos los usuarios
        </p>

      </div>
    </div>
  );
};

export default ContentPublishPage;