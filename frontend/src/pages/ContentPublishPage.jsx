import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Hash, AtSign } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import pollService from '../services/pollService';
import uploadService from '../services/uploadService';  // ⚡ Import upload service

const ContentPublishPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // States
  const [title, setTitle] = useState('');
  const [hashtagsList] = useState([]);
  const [mentionedUsers] = useState([]);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [allowReuse, setAllowReuse] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [contentData, setContentData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);  // ⚡ Upload progress
  const [uploadStatus, setUploadStatus] = useState('');  // ⚡ Upload status message

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

  // Function to add # to title field
  const handleAddHashtagSymbol = () => {
    setTitle(prev => prev + '#');
    // Focus on the title input
    setTimeout(() => {
      const titleInput = document.getElementById('title-input');
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
      const titleInput = document.getElementById('title-input');
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
              
              {/* Hashtag and Mention Quick Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAddHashtagSymbol}
                  className="flex-1 flex items-center justify-center py-2 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-colors touch-manipulation"
                  title="Add hashtag"
                >
                  <Hash className="w-4 h-4 text-gray-300" />
                </button>
                <button
                  onClick={handleAddMentionSymbol}
                  className="flex-1 flex items-center justify-center py-2 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-colors touch-manipulation"
                  title="Add mention"
                >
                  <AtSign className="w-4 h-4 text-gray-300" />
                </button>
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
            <div className="space-y-1 -mx-3 md:mx-0">

              {/* Location */}
              <button 
                className="w-full flex items-center justify-start md:justify-between py-3 px-5 md:px-2 hover:bg-gray-900 active:bg-gray-800 md:rounded-lg transition-colors group touch-manipulation min-h-[48px]"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-300 text-sm">Location</span>
                </div>
                <span className="text-gray-500 text-xl hidden md:inline">›</span>
              </button>

              {/* Add link */}
              <button 
                className="w-full flex items-center justify-between py-3 px-5 md:px-2 hover:bg-gray-900 active:bg-gray-800 md:rounded-lg transition-colors group touch-manipulation min-h-[48px]"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-gray-300 text-sm">Add link</span>
                </div>
                <span className="text-gray-500 text-xl">›</span>
              </button>

              {/* Everyone can view this post */}
              <button 
                className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-900 active:bg-gray-800 rounded-lg transition-colors group touch-manipulation min-h-[48px]"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-300 text-sm">Everyone can view this post</span>
                </div>
                <span className="text-gray-500 text-xl">›</span>
              </button>

              {/* Allow comments */}
              <div className="w-full flex items-center justify-between py-3 px-2 min-h-[48px]">
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Allow comments</span>
                </div>
                <button
                  onClick={() => setCommentsEnabled(!commentsEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors touch-manipulation ${
                    commentsEnabled ? 'bg-[#00D9FF]' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      commentsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Allow reuse of content */}
              <div className="w-full py-3 px-2 min-h-[48px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-gray-300 text-sm">Allow reuse of content</span>
                      <span className="text-gray-500 text-xs">Duet, Stitch, stickers, and add to Story</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setAllowReuse(!allowReuse)}
                    className={`relative w-11 h-6 rounded-full transition-colors touch-manipulation flex-shrink-0 ${
                      allowReuse ? 'bg-[#00D9FF]' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        allowReuse ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* More options */}
              <button 
                className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-900 active:bg-gray-800 rounded-lg transition-colors group touch-manipulation min-h-[48px]"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-gray-300 text-sm">More options</span>
                    <span className="text-gray-500 text-xs">Content disclosure</span>
                  </div>
                </div>
                <span className="text-gray-500 text-xl">›</span>
              </button>

              {/* Share to */}
              <div className="w-full py-3 px-2 min-h-[48px]">
                <div className="flex items-center justify-start gap-2.5 mb-2">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="text-gray-300 text-sm">Share to</span>
                </div>
                <div className="flex gap-3 justify-start pl-0 md:pl-8">
                  <button className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 active:bg-gray-500 flex items-center justify-center transition-colors touch-manipulation">
                    <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                  <button className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 active:bg-gray-500 flex items-center justify-center transition-colors touch-manipulation">
                    <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  <button className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 active:bg-gray-500 flex items-center justify-center transition-colors touch-manipulation">
                    <MessageCircle className="w-5 h-5 text-gray-300" />
                  </button>
                </div>
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

    </div>
  );
};

export default ContentPublishPage;