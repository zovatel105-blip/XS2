import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import pollService from '../services/pollService';
import uploadService from '../services/uploadService';  // ⚡ Import upload service

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
  const [uploadProgress, setUploadProgress] = useState(0);  // ⚡ Upload progress
  const [uploadStatus, setUploadStatus] = useState('');  // ⚡ Upload status message
  
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
    setUploadProgress(0);
    setUploadStatus('Preparando archivos...');

    try {
      console.log('🚀 Starting optimized upload process...');
      
      // ⚡ PASO 1: Identificar archivos que necesitan subirse
      const filesToUpload = contentData.options
        .filter(opt => opt.file && opt.needsUpload !== false)
        .map(opt => opt.file);
      
      console.log(`📦 Found ${filesToUpload.length} files to upload`);
      
      let uploadedOptions = [...contentData.options];
      
      // ⚡ PASO 2: Subir archivos usando multipart/form-data (RÁPIDO)
      if (filesToUpload.length > 0) {
        setUploadStatus(`Subiendo ${filesToUpload.length} archivos...`);
        
        const uploadResults = await uploadService.uploadMultipleFiles(
          filesToUpload,
          'poll_options',
          (progress, index, fileProgress) => {
            setUploadProgress(progress);
            setUploadStatus(`Subiendo archivo ${index + 1}/${filesToUpload.length}... ${fileProgress}%`);
          }
        );
        
        console.log('✅ All files uploaded:', uploadResults);
        
        // ⚡ PASO 3: Reemplazar URLs locales con URLs del servidor
        let uploadIndex = 0;
        uploadedOptions = contentData.options.map(opt => {
          if (opt.file && opt.needsUpload !== false) {
            const uploadResult = uploadResults[uploadIndex++];
            return {
              text: opt.text || '',
              media_type: uploadResult.file_type === 'video' ? 'video' : 'image',
              media_url: uploadResult.public_url,  // ⚡ URL del servidor
              thumbnail_url: uploadResult.thumbnail_url || uploadResult.public_url,
              media_transform: opt.media_transform || null,
              mentioned_users: opt.mentionedUsers ? opt.mentionedUsers.map(u => u.id) : []
            };
          }
          return {
            text: opt.text || '',
            media_type: opt.media_type,
            media_url: opt.media_url,
            thumbnail_url: opt.thumbnail_url || opt.media_url,
            media_transform: opt.media_transform || null,
            mentioned_users: opt.mentionedUsers ? opt.mentionedUsers.map(u => u.id) : []
          };
        });
      }
      
      setUploadStatus('Creando publicación...');
      setUploadProgress(90);
      
      // ⚡ PASO 4: Crear poll con las URLs ya subidas
      const allMentionedUsers = [
        ...contentData.mentioned_users,
        ...mentionedUsers.map(user => user.id)
      ];

      const pollData = {
        title: title.trim(),
        description: null,
        options: uploadedOptions,
        music_id: contentData.music_id,
        tags: hashtagsList.map(tag => tag.startsWith('#') ? tag : `#${tag}`),
        category: 'general',
        mentioned_users: [...new Set(allMentionedUsers)],
        video_playbook_settings: null,
        layout: contentData.layout,
        comments_enabled: commentsEnabled
      };

      console.log('📤 Creating poll with uploaded URLs:', pollData);

      const newPoll = await pollService.createPoll(pollData);
      
      setUploadProgress(100);
      setUploadStatus('¡Publicado!');

      toast({
        title: "🎉 ¡Publicación creada!",
        description: "Tu contenido ha sido publicado exitosamente",
      });

      // Navigate to feed after successful publication
      setTimeout(() => {
        navigate('/feed');
      }, 1000);

    } catch (error) {
      console.error('❌ Error creating content:', error);
      
      let errorMessage = "No se pudo crear la publicación. Inténtalo de nuevo.";
      
      if (error.message) {
        if (error.message.includes('Not authenticated')) {
          errorMessage = "Tu sesión ha expirado. Inicia sesión nuevamente.";
          setTimeout(() => navigate('/'), 2000);
        } else if (error.message.includes('validation')) {
          errorMessage = "Error en los datos. Verifica que todos los campos estén correctos.";
        } else if (error.message.includes('Upload failed') || error.message.includes('Network error')) {
          errorMessage = "Error al subir archivos. Verifica tu conexión e intenta de nuevo.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Error al crear publicación",
        description: errorMessage,
        variant: "destructive",
      });
      
      setUploadStatus('');
      setUploadProgress(0);
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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-900 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white text-sm font-medium">New post</h1>
        <div className="w-9"></div> {/* Spacer for centering */}
      </div>

      {/* Main Content - Fixed Two Column Layout */}
      <div className="px-3 sm:px-4 pt-4 pb-32">
        
        {/* Two Column Layout - Always the same */}
        <div className="flex gap-3 sm:gap-4">
          
          {/* Left Column - Preview */}
          <div className="w-24 sm:w-28 flex-shrink-0">
            <div className="sticky top-4">
              <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg w-full h-32 sm:h-36">
                {contentData && contentData.options && contentData.options.length > 0 ? (
                  <div className="relative w-full h-full">
                    {contentData.layout === 'vertical' && contentData.options.length >= 2 ? (
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
                              <video 
                                src={option.media_url}
                                className="w-full h-full object-cover"
                                muted
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        {contentData.options[0].media_type?.startsWith('image') ? (
                          <img 
                            src={contentData.options[0].media_url} 
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video 
                            src={contentData.options[0].media_url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        )}
                      </div>
                    )}
                    
                    {/* Edit cover overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                      <p className="text-white text-[10px] sm:text-xs text-center font-medium">Preview</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-lg sm:text-xl mb-1">📱</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Description and Options */}
          <div className="flex-1 min-w-0">
            
            {/* Description Input */}
            <div className="mb-5">
              <textarea
                id="title-input"
                placeholder="Add description..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-white text-sm sm:text-base placeholder-gray-500 bg-transparent border-none outline-none resize-none leading-relaxed"
                rows={5}
                maxLength={200}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">{title.length}/200</span>
              </div>
            </div>

            {/* Action Items - Mobile Optimized */}
            <div className="space-y-1">

              {/* Who can view */}
              <div className="w-full flex items-center justify-between py-3 px-2 min-h-[48px]">
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-gray-300 text-sm">Who can view</span>
                    <span className="text-gray-500 text-xs">Everyone</span>
                  </div>
                </div>
              </div>

              {/* Allow comments */}
              <div className="w-full flex items-center justify-between py-3 px-2 min-h-[48px]">
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Comments</span>
                </div>
                <button
                  onClick={() => setCommentsEnabled(!commentsEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors touch-manipulation ${
                    commentsEnabled ? 'bg-pink-500' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      commentsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Bottom Action Bar - Mobile Optimized */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 px-3 md:px-4 py-3 safe-area-inset-bottom">
        {/* Progress Bar */}
        {isPublishing && uploadProgress > 0 && (
          <div className="mb-2.5 md:mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-400 truncate pr-2">{uploadStatus}</span>
              <span className="text-xs font-semibold text-pink-500 flex-shrink-0">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-pink-500 to-red-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 md:gap-3">
          <button 
            className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2.5 md:py-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm touch-manipulation"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span className="hidden sm:inline">Drafts</span>
          </button>
          <button
            onClick={handleFinalPublish}
            disabled={isPublishing || !title.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2.5 md:py-3 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 active:from-pink-700 active:to-red-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed text-sm touch-manipulation min-h-[44px]"
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                <span className="truncate">{uploadProgress > 0 ? `${uploadProgress}%` : 'Publishing...'}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>Post</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hashtag Modal - Mobile Optimized */}
      {showHashtagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-end">
          <div className="bg-gray-900 w-full rounded-t-2xl max-h-[85vh] overflow-hidden safe-area-inset-bottom">
            <div className="px-3 md:px-4 py-3 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-base font-semibold">Add hashtags</h3>
                <button
                  onClick={() => setShowHashtagModal(false)}
                  className="w-9 h-9 flex items-center justify-center hover:bg-gray-800 active:bg-gray-700 rounded-full transition-colors touch-manipulation"
                >
                  <span className="text-gray-400 text-2xl leading-none">×</span>
                </button>
              </div>
            </div>
            <div className="p-3 md:p-4 space-y-3 md:space-y-4 overflow-y-auto max-h-[calc(85vh-60px)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type hashtag (without #)"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyPress={handleHashtagKeyPress}
                  className="flex-1 min-w-0 px-3 md:px-4 py-2.5 bg-gray-800 text-white text-sm md:text-base placeholder-gray-500 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={handleAddHashtag}
                  disabled={!hashtagInput.trim()}
                  className="px-4 md:px-5 py-2.5 bg-pink-500 hover:bg-pink-600 active:bg-pink-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex-shrink-0 touch-manipulation text-sm md:text-base"
                >
                  Add
                </button>
              </div>
              
              {hashtagsList.length > 0 && (
                <div className="space-y-2 md:space-y-3">
                  <p className="text-xs md:text-sm text-gray-400 font-medium">Added hashtags:</p>
                  <div className="flex flex-wrap gap-2">
                    {hashtagsList.map((hashtag, index) => (
                      <span 
                        key={index} 
                        className="bg-gray-800 text-white px-3 py-1.5 md:py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-700 active:bg-gray-600 transition-colors"
                      >
                        #{hashtag}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveHashtag(hashtag);
                          }}
                          className="text-gray-400 hover:text-white active:text-white text-lg touch-manipulation"
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

      {/* Mention Modal - Mobile Optimized */}
      {showMentionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-end">
          <div className="bg-gray-900 w-full rounded-t-2xl max-h-[85vh] overflow-hidden safe-area-inset-bottom">
            <div className="px-3 md:px-4 py-3 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-base font-semibold">Tag people</h3>
                <button
                  onClick={() => setShowMentionModal(false)}
                  className="w-9 h-9 flex items-center justify-center hover:bg-gray-800 active:bg-gray-700 rounded-full transition-colors touch-manipulation"
                >
                  <span className="text-gray-400 text-2xl leading-none">×</span>
                </button>
              </div>
            </div>
            <div className="p-3 md:p-4 space-y-3 md:space-y-4 overflow-y-auto max-h-[calc(85vh-60px)]">
              <UserMentionInput
                value={mentionInput}
                onChange={setMentionInput}
                onMentionSelect={handleMentionSelect}
                placeholder="Search users to mention..."
                className="w-full bg-gray-800 text-white text-sm md:text-base"
              />
              
              {mentionedUsers.length > 0 && (
                <div className="space-y-2 md:space-y-3">
                  <p className="text-xs md:text-sm text-gray-400 font-medium">Tagged users:</p>
                  <div className="flex flex-wrap gap-2">
                    {mentionedUsers.map((user) => (
                      <span 
                        key={user.id} 
                        className="bg-gray-800 text-white px-3 py-1.5 md:py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-700 active:bg-gray-600 transition-colors"
                      >
                        @{user.username}
                        <button
                          onClick={() => handleRemoveMention(user.id)}
                          className="text-gray-400 hover:text-white active:text-white text-lg touch-manipulation"
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