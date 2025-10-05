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
      // Temporary mock data for testing
      const mockContentData = {
        options: [{
          id: 'option1',
          text: 'Opción 1',
          media_type: 'image/jpeg',
          media_url: 'https://images.unsplash.com/photo-1555212697-194d092e3b8f?w=300&h=400&fit=crop',
          description: 'Test description'
        }],
        layout: 'vertical',
        mentioned_users: [],
        music_id: null,
        music: null
      };
      setContentData(mockContentData);
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
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-40">

        {/* Content Preview - How it will look */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Vista previa de tu publicación:</h3>
          
          <div className="bg-black rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: '9/16', maxHeight: '400px' }}>
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
                            alt={`Option ${index + 1}`}
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
                              <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                                <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Option text overlay */}
                        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-2">
                          <p className="text-white text-sm font-medium">{option.text || `Opción ${index + 1}`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Single option or other layouts */
                  <div className="relative w-full h-full">
                    {contentData.options[0].media_type?.startsWith('image') ? (
                      <img 
                        src={contentData.options[0].media_url} 
                        alt="Main content"
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
                          <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Title overlay */}
                    {title && (
                      <div className="absolute bottom-20 left-4 right-4">
                        <p className="text-white text-lg font-semibold leading-tight drop-shadow-lg">{title}</p>
                      </div>
                    )}
                    
                    {/* Hashtags overlay */}
                    {hashtagsList.length > 0 && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex flex-wrap gap-1">
                          {hashtagsList.slice(0, 3).map((hashtag, index) => (
                            <span key={index} className="text-white text-sm opacity-90">
                              #{hashtag}
                            </span>
                          ))}
                          {hashtagsList.length > 3 && (
                            <span className="text-white text-sm opacity-90">
                              +{hashtagsList.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Cover label */}
                <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md font-medium">
                  Cover
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-sm">Vista previa de contenido</p>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 text-center">Así se verá tu publicación en el feed</p>
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
                  onClick={() => setShowHashtagModal(true)}
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
                  onClick={() => setShowMentionModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
                >
                  <AtSign className="w-4 h-4" />
                  Mention
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