import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Music, LayoutGrid, Plus, Upload, Image as ImageIcon, Video, AtSign, Edit3 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import MusicSelector from '../components/MusicSelector';
import UserMentionInput from '../components/UserMentionInput';
import { fileToBase64 } from '../services/mockData';
import pollService from '../services/pollService';
import UploadWidget from '../components/UploadWidget';

const LAYOUT_OPTIONS = [
  { id: 'off', name: 'Off', description: 'Sin layout (solo una imagen)' },
  { id: 'vertical', name: 'Vertical', description: 'Pantalla dividida en 2 partes verticales' },
  { id: 'horizontal', name: 'Horizontal', description: 'Pantalla dividida en 2 partes horizontales' },
  { id: 'triptych-vertical', name: 'Triptych vertical', description: 'Pantalla dividida en 3 partes verticales' },
  { id: 'triptych-horizontal', name: 'Triptych horizontal', description: 'Pantalla dividida en 3 partes horizontales' },
  { id: 'grid-2x2', name: 'Grid 2x2', description: 'Pantalla dividida en 4 partes (cuadrícula de 2x2)' },
  { id: 'grid-3x3', name: 'Grid 3x3', description: 'Pantalla dividida en 9 partes (cuadrícula de 3x3)' },
  { id: 'horizontal-3x3', name: 'Horizontal 3x3', description: 'Pantalla dividida en 9 partes (horizontal de 3x3)' }
];

const LayoutPreview = ({ layout, options = [], onImageUpload, onImageRemove, onOptionTextChange, onMentionSelect, fullscreen = false }) => {
  const getLayoutStyle = () => {
    switch (layout.id) {
      case 'off':
        return 'grid-cols-1 grid-rows-1';
      case 'vertical':
        return 'grid-cols-2 grid-rows-1';
      case 'horizontal':
        return 'grid-cols-1 grid-rows-2';
      case 'triptych-vertical':
        return 'grid-cols-3 grid-rows-1';
      case 'triptych-horizontal':
        return 'grid-cols-1 grid-rows-3';
      case 'grid-2x2':
        return 'grid-cols-2 grid-rows-2';
      case 'grid-3x3':
        return 'grid-cols-3 grid-rows-3';
      case 'horizontal-3x3':
        return 'grid-cols-9 grid-rows-1';
      default:
        return 'grid-cols-1 grid-rows-1';
    }
  };

  const getSlotsCount = () => {
    switch (layout.id) {
      case 'off': return 1;
      case 'vertical': return 2;
      case 'horizontal': return 2;
      case 'triptych-vertical': return 3;
      case 'triptych-horizontal': return 3;
      case 'grid-2x2': return 4;
      case 'grid-3x3': return 9;
      case 'horizontal-3x3': return 9;
      default: return 1;
    }
  };

  const slots = Array.from({ length: getSlotsCount() }, (_, index) => index);

  return (
    <div className="space-y-6">
      <div className={`grid gap-4 w-full ${getLayoutStyle()}`}>
        {slots.map((slotIndex) => {
          const option = options[slotIndex] || { text: '', media: null, mentionedUsers: [] };
          return (
            <div
              key={slotIndex}
              className="relative bg-gray-800 border border-gray-600 rounded-lg overflow-hidden group"
            >
              {/* Letter identifier */}
              <div className="absolute top-2 left-2 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                {String.fromCharCode(65 + slotIndex)}
              </div>
              
              {/* Image or upload area with fullscreen-style preview */}
              <div 
                className="w-full aspect-[9/16] cursor-pointer hover:bg-gray-700 transition-colors relative rounded-xl overflow-hidden shadow-2xl"
                onClick={() => onImageUpload(slotIndex)}
              >
                {option.media ? (
                  <>
                    {/* Background Image - Fullscreen style */}
                    <img 
                      src={option.media.url} 
                      alt={`Opción ${slotIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* TikTok-style Preview Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20">
                      
                      {/* Top Section - Like TikTok profile info */}
                      <div className="absolute top-4 left-4 right-16">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                            <span className="text-black text-sm font-bold">{String.fromCharCode(65 + slotIndex)}</span>
                          </div>
                          <span className="text-white text-sm font-semibold">Opción {String.fromCharCode(65 + slotIndex)}</span>
                          <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                            <span className="text-white text-xs">Vista previa</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - TikTok style buttons */}
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">❤️</span>
                        </div>
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">💬</span>
                        </div>
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">📤</span>
                        </div>
                      </div>
                      
                      {/* Bottom Section - TikTok style description */}
                      <div className="absolute bottom-4 left-4 right-16">
                        {/* Option Text */}
                        {option.text && (
                          <div className="mb-3">
                            <p className="text-white font-semibold text-lg leading-tight drop-shadow-lg">
                              {option.text}
                            </p>
                          </div>
                        )}
                        
                        {/* Mentioned Users */}
                        {option.mentionedUsers && option.mentionedUsers.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {option.mentionedUsers.map((user) => (
                              <span
                                key={user.id}
                                className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full font-medium"
                              >
                                <AtSign className="w-3 h-3" />
                                {user.username}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Music info - TikTok style */}
                        <div className="flex items-center gap-2 text-white/90">
                          <Music className="w-4 h-4" />
                          <span className="text-sm">Sonido original</span>
                        </div>
                      </div>

                      {/* Progress bar - like TikTok video progress */}
                      <div className="absolute bottom-0 left-0 right-0 h-1">
                        <div className="w-full bg-white/30 h-full">
                          <div className="bg-white h-full w-3/4 transition-all duration-300"></div>
                        </div>
                      </div>
                    </div>

                    {/* Edit/Remove buttons - Hidden until hover */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const textInput = document.querySelector(`input[data-option-index="${slotIndex}"]`);
                          if (textInput) textInput.focus();
                        }}
                        className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg"
                        title="Editar texto"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageRemove(slotIndex);
                        }}
                        className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                        title="Eliminar imagen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 group-hover:text-gray-300 transition-colors border-2 border-dashed border-gray-600 rounded-xl bg-gray-800/50">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Plus className="w-8 h-8" />
                      </div>
                      <span className="text-lg font-medium">Agregar imagen</span>
                      <p className="text-sm text-gray-500 mt-2">Opción {String.fromCharCode(65 + slotIndex)}</p>
                      <p className="text-xs text-gray-600 mt-1">Vista previa estilo TikTok</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Title/Description input */}
              <div className="p-3 bg-gray-900">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{String.fromCharCode(65 + slotIndex)}</span>
                  </div>
                  <span className="text-gray-300 text-sm font-medium">Opción {String.fromCharCode(65 + slotIndex)}</span>
                </div>
                
                <UserMentionInput
                  placeholder={`Describe esta opción (opcional)...`}
                  value={option.text}
                  onChange={(newText) => onOptionTextChange(slotIndex, newText)}
                  onMentionSelect={(user) => onMentionSelect(slotIndex, user)}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  data-option-index={slotIndex}
                />
                
                {/* Mentioned users display - Edit Mode */}
                {option.mentionedUsers && option.mentionedUsers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-gray-400 text-xs mb-1">Usuarios mencionados:</p>
                    <div className="flex flex-wrap gap-1">
                      {option.mentionedUsers.map((user, userIndex) => (
                        <span
                          key={user.id}
                          className="inline-flex items-center gap-1 bg-purple-600 text-white text-xs px-2 py-1 rounded-full"
                        >
                          <AtSign className="w-3 h-3" />
                          {user.username}
                          <button
                            onClick={() => {
                              // Remove this mentioned user
                              const newMentioned = option.mentionedUsers.filter((_, i) => i !== userIndex);
                              updateOption(slotIndex, 'mentionedUsers', newMentioned);
                            }}
                            className="ml-1 w-3 h-3 text-purple-200 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Preview indicator */}
                {option.media && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Vista previa arriba muestra cómo se verá publicado
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ContentCreationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const fileInputRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate]);

  // States
  const [selectedLayout, setSelectedLayout] = useState(LAYOUT_OPTIONS[0]); // Off by default
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [options, setOptions] = useState([]); // Changed from images to options
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with pre-selected audio if provided
  useEffect(() => {
    const preSelectedAudio = location.state?.preSelectedAudio;
    if (preSelectedAudio) {
      setSelectedMusic(preSelectedAudio);
      toast({
        title: "🎵 Audio seleccionado",
        description: `${preSelectedAudio.title} - ${preSelectedAudio.artist}`,
      });
    }
  }, [location.state, toast]);

  const handleClose = () => {
    navigate('/feed');
  };

  const handleMusicSelect = (music) => {
    setSelectedMusic(music);
    setShowMusicSelector(false);
    toast({
      title: "🎵 Música agregada",
      description: `${music.title} - ${music.artist}`,
    });
  };

  const handleLayoutSelect = (layout) => {
    setSelectedLayout(layout);
    setShowLayoutMenu(false);
    // Clear options when changing layout to avoid confusion
    setOptions([]);
    toast({
      title: "📐 Layout seleccionado",
      description: layout.description,
    });
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...options];
    while (newOptions.length <= index) {
      newOptions.push({ text: '', media: null, mentionedUsers: [] });
    }
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleOptionTextChange = (index, text) => {
    updateOption(index, 'text', text);
  };

  const handleMentionSelect = (index, user) => {
    const currentOption = options[index] || { text: '', media: null, mentionedUsers: [] };
    const currentMentioned = currentOption.mentionedUsers || [];
    const exists = currentMentioned.find(u => u.id === user.id);
    
    if (!exists) {
      updateOption(index, 'mentionedUsers', [...currentMentioned, user]);
      toast({
        title: "Usuario mencionado",
        description: `@${user.username} será notificado en la opción ${String.fromCharCode(65 + index)}`,
      });
    }
  };

  const getSlotsCount = () => {
    switch (selectedLayout.id) {
      case 'off': return 1;
      case 'vertical': return 2;
      case 'horizontal': return 2;
      case 'triptych-vertical': return 3;
      case 'triptych-horizontal': return 3;
      case 'grid-2x2': return 4;
      case 'grid-3x3': return 9;
      case 'horizontal-3x3': return 9;
      default: return 1;
    }
  };

  const handleImageUpload = (slotIndex) => {
    setCurrentSlotIndex(slotIndex);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP)",
        variant: "destructive"
      });
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "La imagen es muy grande. Máximo 10MB permitido.",
        variant: "destructive"
      });
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const mediaData = {
        url: base64,
        type: 'image',
        file: file,
        name: file.name,
        size: file.size
      };
      
      updateOption(currentSlotIndex, 'media', mediaData);

      toast({
        title: "✅ Imagen agregada",
        description: `Imagen agregada a la opción ${String.fromCharCode(65 + currentSlotIndex)}`,
      });
    } catch (error) {
      console.error('Error loading image:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la imagen. Intenta con otra imagen.",
        variant: "destructive"
      });
    }

    // Reset file input
    event.target.value = '';
  };

  const handleImageRemove = (slotIndex) => {
    updateOption(slotIndex, 'media', null);
  };

  const handleCreate = async () => {
    // Validate authentication
    if (!isAuthenticated) {
      toast({
        title: "Error de autenticación",
        description: "Necesitas iniciar sesión para crear contenido",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Necesitas escribir una pregunta o descripción",
        variant: "destructive"
      });
      return;
    }

    const validOptions = options.filter(opt => opt && opt.media);
    if (validOptions.length === 0) {
      toast({
        title: "Error", 
        description: "Necesitas agregar al menos una imagen",
        variant: "destructive"
      });
      return;
    }

    // Validate minimum options (like CreatePollModal)
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Necesitas al menos 2 opciones para crear una votación",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Prepare poll data exactly like CreatePollModal
      const allMentionedUsers = [];
      const processedOptions = validOptions.map((opt) => {
        // Collect mentioned users from this option
        if (opt.mentionedUsers) {
          allMentionedUsers.push(...opt.mentionedUsers.map(user => user.id));
        }
        
        return {
          text: opt.text.trim() || `Opción ${String.fromCharCode(65 + options.indexOf(opt))}`, // Use provided text or default
          media_type: 'image',
          media_url: opt.media.url,
          thumbnail_url: opt.media.url, // For images, thumbnail is same as url
          mentioned_users: opt.mentionedUsers ? opt.mentionedUsers.map(user => user.id) : []
        };
      });

      const pollData = {
        title: title.trim(),
        description: null, // No description field
        options: processedOptions,
        music_id: selectedMusic?.id || null, // Use music_id format
        tags: [], // No tags
        category: 'general', // Default category
        mentioned_users: [...new Set(allMentionedUsers)], // All mentioned users from all options (remove duplicates)
        video_playback_settings: null, // No video settings
        layout: selectedLayout.id // Custom field for layout
      };

      console.log('Creating poll with data:', pollData);

      // Create poll using API
      const newPoll = await pollService.createPoll(pollData);

      toast({
        title: "🎉 ¡Publicación creada!",
        description: "Tu contenido ha sido publicado exitosamente",
      });

      // Reset form data (like CreatePollModal)
      setTitle('');
      setOptions([]);
      setSelectedMusic(null);
      setSelectedLayout(LAYOUT_OPTIONS[0]);
      setShowMusicSelector(false);
      setShowLayoutMenu(false);

      // Navigate to feed after a short delay to show the success message
      setTimeout(() => {
        navigate('/feed');
      }, 1500);

    } catch (error) {
      console.error('Error creating content:', error);
      
      // Enhanced error handling
      let errorMessage = "No se pudo crear la publicación. Inténtalo de nuevo.";
      
      if (error.message) {
        if (error.message.includes('Not authenticated')) {
          errorMessage = "Tu sesión ha expirado. Inicia sesión nuevamente.";
          // Redirect to login if token expired
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
      setIsCreating(false);
    }
  };

  // Show loading screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black border-b border-gray-800">
        {/* Close button - Left */}
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Add Sound button - Center */}
        <button
          onClick={() => setShowMusicSelector(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white transition-colors max-w-xs"
        >
          <Music className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium truncate">
            {selectedMusic ? `🎵 ${selectedMusic.title}` : 'Add sound'}
          </span>
        </button>

        {/* Empty space - Right */}
        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Central Zone */}
        <div className="flex-1 bg-black p-4 flex flex-col">
          {/* Title Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Escribe una pregunta o descripción..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Selected Music Display */}
          {selectedMusic && (
            <div className="mb-4 bg-gray-800 rounded-lg p-3 border border-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{selectedMusic.title}</p>
                  <p className="text-gray-400 text-sm truncate">{selectedMusic.artist}</p>
                </div>
                <button
                  onClick={() => setSelectedMusic(null)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Layout Preview */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-4xl">
              <div className="mb-3 text-center">
                <h3 className="text-white font-medium text-sm">Vista previa - Layout: {selectedLayout.name}</h3>
                <p className="text-gray-400 text-xs mt-1">{selectedLayout.description}</p>
              </div>
              <LayoutPreview
                layout={selectedLayout}
                options={options}
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                onOptionTextChange={handleOptionTextChange}
                onMentionSelect={handleMentionSelect}
              />
              
              {/* Progress indicator */}
              {options.filter(opt => opt && opt.media).length > 0 && (
                <div className="mt-3 bg-gray-800 rounded-lg p-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Progreso:</span>
                    <span className="text-white">
                      {options.filter(opt => opt && opt.media).length} / {getSlotsCount()} opciones
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-300"
                      style={{
                        width: `${(options.filter(opt => opt && opt.media).length / getSlotsCount()) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Create Button */}
          <div className="mt-6">
            <button
              onClick={handleCreate}
              disabled={isCreating || !title.trim() || options.filter(opt => opt && opt.media).length < 2}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              {isCreating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creando publicación...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Crear publicación</span>
                  {options.filter(opt => opt && opt.media).length >= 2 && title.trim() && (
                    <span className="text-sm opacity-75">({options.filter(opt => opt && opt.media).length} opciones)</span>
                  )}
                </div>
              )}
            </button>
            {/* Help text */}
            {(!title.trim() || options.filter(opt => opt && opt.media).length < 2) && (
              <p className="text-gray-400 text-sm mt-2 text-center">
                {!title.trim() 
                  ? "Agrega una pregunta o descripción" 
                  : options.filter(opt => opt && opt.media).length < 2 
                    ? `Necesitas al menos 2 imágenes (tienes ${options.filter(opt => opt && opt.media).length})`
                    : ""}
              </p>
            )}
          </div>
        </div>

        {/* Right Sidebar Menu */}
        <div className="w-20 bg-black border-l border-gray-800 p-4 flex flex-col items-center">
          {/* Layout Button */}
          <div className="relative">
            <button
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
              className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <LayoutGrid className="w-6 h-6" />
            </button>

            {/* Layout Menu */}
            {showLayoutMenu && (
              <div className="absolute right-full top-0 mr-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-600 overflow-hidden z-10">
                <div className="p-3 border-b border-gray-600">
                  <h3 className="text-white font-medium">Plantillas de Layout</h3>
                  <p className="text-gray-400 text-sm">Selecciona cómo organizar tu contenido</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {LAYOUT_OPTIONS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => handleLayoutSelect(layout)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                        selectedLayout.id === layout.id ? 'bg-blue-600 hover:bg-blue-500' : ''
                      }`}
                    >
                      <div className="text-white font-medium">{layout.name}</div>
                      <div className="text-gray-300 text-sm">{layout.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Music Selector Modal */}
      {showMusicSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Seleccionar Música</h3>
              <button
                onClick={() => setShowMusicSelector(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh]">
              <MusicSelector
                onSelectMusic={handleMusicSelect}
                selectedMusic={selectedMusic}
                pollTitle={title}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ContentCreationPage;