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
    setMentionInput('');
  };

  const handleRemoveMention = (userId) => {
    setMentionedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleAddHashtag = () => {
    if (hashtagInput.trim() && !hashtagsList.includes(hashtagInput.trim())) {
      setHashtagsList(prev => [...prev, hashtagInput.trim()]);
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (hashtag) => {
    setHashtagsList(prev => prev.filter(h => h !== hashtag));
  };

  const handleHashtagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  // Function to add # to title field
  const handleAddHashtagSymbol = () => {
    setTitle(prev => prev + '#');
    // Focus on the title input
    setTimeout(() => {
      const titleInput = document.querySelector('input[type="text"]');
      if (titleInput) {
        titleInput.focus();
        // Move cursor to end
        titleInput.selectionStart = titleInput.selectionEnd = titleInput.value.length;
      }
    }, 0);
  };

  // Function to add @ to title field
  const handleAddMentionSymbol = () => {
    setTitle(prev => prev + '@');
    // Focus on the title input
    setTimeout(() => {
      const titleInput = document.querySelector('input[type="text"]');
      if (titleInput) {
        titleInput.focus();
        // Move cursor to end
        titleInput.selectionStart = titleInput.selectionEnd = titleInput.value.length;
      }
    }, 0);
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
        tags: hashtagsList.map(tag => tag.startsWith('#') ? tag : `#${tag}`),
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
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">

        {/* Content Preview - How it will look */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Vista previa:</h3>
          
          <div className="bg-black rounded-lg overflow-hidden shadow-md w-32 h-40 mx-auto">
            {contentData && contentData.options && contentData.options.length > 0 ? (
              <div className="relative w-full h-full">
                {/* Main content based on layout */}
                {contentData.layout === 'vertical' && contentData.options.length >= 2 ? (
                  /* Side by side layout */
                  <div className="flex h-full">
                    {contentData.options.slice(0, 2).map((option, index) => (
                      <div key={index} className="flex-1 relative">
                        {option.media_type?.startsWith('image') ? (
                          <img 
                            src={option.media_url} 
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <video 
                              src={option.media_url}
                              className="w-full h-full object-cover"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                                <div className="w-0 h-0 border-l-[4px] border-l-white border-t-[2px] border-t-transparent border-b-[2px] border-b-transparent ml-0.5"></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Single option or other layouts */
                  <div className="relative w-full h-full">
                    {contentData.options[0].media_type?.startsWith('image') ? (
                      <img 
                        src={contentData.options[0].media_url} 
                        alt="Preview"
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
                            <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Title overlay - smaller */}
                    {title && (
                      <div className="absolute bottom-8 left-1 right-1">
                        <p className="text-white text-xs font-medium leading-tight drop-shadow-lg truncate">{title}</p>
                      </div>
                    )}
                    
                    {/* Hashtags overlay - smaller */}
                    {hashtagsList.length > 0 && (
                      <div className="absolute bottom-1 left-1 right-1">
                        <div className="flex flex-wrap gap-0.5">
                          {hashtagsList.slice(0, 2).map((hashtag, index) => (
                            <span key={index} className="text-white text-xs opacity-80 truncate">
                              #{hashtag}
                            </span>
                          ))}
                          {hashtagsList.length > 2 && (
                            <span className="text-white text-xs opacity-80">
                              +{hashtagsList.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-2xl mb-1">📱</div>
                  <p className="text-xs">Preview</p>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 text-center">Así se verá en el feed</p>
        </div>

        {/* Title Input with Hashtags and Mentions */}
        <div className="space-y-4">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Add a catchy title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-medium text-gray-900 placeholder-gray-400 border-0 outline-none resize-none bg-transparent leading-relaxed"
              maxLength={200}
            />
            
            {/* Hashtags and Mentions integrated with title */}
            <div className="space-y-3">
              {/* Display selected hashtags */}
              {hashtagsList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hashtagsList.map((hashtag, index) => (
                    <span 
                      key={index} 
                      className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1"
                    >
                      #{hashtag}
                      <button
                        onClick={() => handleRemoveHashtag(hashtag)}
                        className="text-blue-500 hover:text-blue-700 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Display mentioned users */}
              {mentionedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {mentionedUsers.map((user) => (
                    <span 
                      key={user.id} 
                      className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1"
                    >
                      @{user.username}
                      <button
                        onClick={() => handleRemoveMention(user.id)}
                        className="text-green-500 hover:text-green-700 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add buttons for hashtags and mentions */}
              <div className="flex gap-2">
                <button 
                  onClick={handleAddHashtagSymbol}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
                >
                  <Hash className="w-4 h-4" />
                  Hashtags
                  {hashtagsList.length > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {hashtagsList.length}
                    </span>
                  )}
                </button>
                
                <button 
                  onClick={handleAddMentionSymbol}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
                >
                  <AtSign className="w-4 h-4" />
                  Etiquetar personas
                  {mentionedUsers.length > 0 && (
                    <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {mentionedUsers.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Writing a long description can help get 3x more views on average.
              </p>
              <span className="text-xs text-gray-400">
                {title.length}/200
              </span>
            </div>
          </div>
          <div className="h-px bg-gray-200"></div>
        </div>

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

      {/* Hashtag Modal */}
      {showHashtagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Agregar Hashtags</h3>
                <button
                  onClick={() => setShowHashtagModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe un hashtag (sin #)"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyPress={handleHashtagKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddHashtag}
                  disabled={!hashtagInput.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium"
                >
                  Agregar
                </button>
              </div>
              
              {hashtagsList.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 font-medium">Hashtags agregados:</p>
                  <div className="flex flex-wrap gap-2">
                    {hashtagsList.map((hashtag, index) => (
                      <span 
                        key={index} 
                        className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        #{hashtag}
                        <button
                          onClick={() => handleRemoveHashtag(hashtag)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mention Modal */}
      {showMentionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Mencionar Usuarios</h3>
                <button
                  onClick={() => setShowMentionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <UserMentionInput
                value={mentionInput}
                onChange={setMentionInput}
                onMentionSelect={handleMentionSelect}
                placeholder="Buscar usuarios para mencionar..."
                className="w-full"
              />
              
              {mentionedUsers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 font-medium">Usuarios mencionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {mentionedUsers.map((user) => (
                      <span 
                        key={user.id} 
                        className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        @{user.username}
                        <button
                          onClick={() => handleRemoveMention(user.id)}
                          className="text-green-500 hover:text-green-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ContentPublishPage;