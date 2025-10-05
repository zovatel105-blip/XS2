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
  const [hashtagsList, setHashtagsList] = useState([]);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [contentData, setContentData] = useState(null);
  
  // Modal states
  const [showHashtagModal, setShowHashtagModal] = useState(false);
  const [showMentionModal, setShowMentionModal] = useState(false);
  const [hashtagInput, setHashtagInput] = useState('');
  const [mentionInput, setMentionInput] = useState('');

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Content Cover Preview */}
        <div className="flex gap-4">
          {/* Main cover image */}
          <div className="w-24 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            {contentData && contentData.options && contentData.options[0] ? (
              contentData.options[0].media_type?.startsWith('image') ? (
                <img 
                  src={contentData.options[0].media_url} 
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                  <video 
                    src={contentData.options[0].media_url}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1"></div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-500 text-xs">Cover</span>
              </div>
            )}
          </div>

          {/* Add more content button */}
          <div className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-4xl text-gray-400">+</div>
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Add a catchy title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xl font-medium text-gray-900 placeholder-gray-400 border-0 outline-none resize-none bg-transparent"
            maxLength={200}
          />
          <p className="text-sm text-gray-500">
            Writing a long description can help get 3x more views on average.
          </p>
          <div className="h-px bg-gray-200"></div>
        </div>

        {/* Hashtags Button */}
        <button 
          onClick={() => setShowHashtagModal(true)}
          className="flex items-center gap-4 py-4 border-b border-gray-100 w-full text-left hover:bg-gray-50"
        >
          <Hash className="w-5 h-5 text-gray-600" />
          <span className="flex-1 text-gray-900">
            {hashtagsList.length > 0 
              ? `${hashtagsList.length} hashtag${hashtagsList.length > 1 ? 's' : ''} selected`
              : 'Hashtags'
            }
          </span>
          <div className="text-gray-400">›</div>
        </button>

        {/* Display selected hashtags */}
        {hashtagsList.length > 0 && (
          <div className="flex flex-wrap gap-2 px-9 -mt-2">
            {hashtagsList.slice(0, 3).map((hashtag, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                #{hashtag}
              </span>
            ))}
            {hashtagsList.length > 3 && (
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                +{hashtagsList.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Mentions Button */}
        <button 
          onClick={() => setShowMentionModal(true)}
          className="flex items-center gap-4 py-4 border-b border-gray-100 w-full text-left hover:bg-gray-50"
        >
          <AtSign className="w-5 h-5 text-gray-600" />
          <span className="flex-1 text-gray-900">
            {mentionedUsers.length > 0 
              ? `${mentionedUsers.length} user${mentionedUsers.length > 1 ? 's' : ''} mentioned`
              : 'Mention'
            }
          </span>
          <div className="text-gray-400">›</div>
        </button>

        {/* Display mentioned users */}
        {mentionedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 px-9 -mt-2">
            {mentionedUsers.slice(0, 3).map((user) => (
              <span key={user.id} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                @{user.username}
              </span>
            ))}
            {mentionedUsers.length > 3 && (
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                +{mentionedUsers.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Comments Toggle */}
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <span className="text-gray-900">Allow comments</span>
          </div>
          <button
            onClick={() => setCommentsEnabled(!commentsEnabled)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              commentsEnabled ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                commentsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button className="px-6 py-2 text-gray-600 bg-gray-100 rounded-full font-medium">
            Drafts
          </button>
          <button
            onClick={handleFinalPublish}
            disabled={isPublishing || !title.trim()}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-full font-semibold transition-colors disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Publishing...
              </>
            ) : (
              "Post"
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default ContentPublishPage;