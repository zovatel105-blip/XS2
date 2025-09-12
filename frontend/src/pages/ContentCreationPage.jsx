import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Music, LayoutGrid, Plus, Upload, Image as ImageIcon, Video, AtSign, Edit3, Search, Send } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { useTikTok } from '../contexts/TikTokContext';
import MusicSelector from '../components/MusicSelector';
import UserMentionInput from '../components/UserMentionInput';
import { fileToBase64 } from '../services/mockData';
import pollService from '../services/pollService';
import UploadWidget from '../components/UploadWidget';
import InlineCrop from '../components/InlineCrop';
import config from '../config/config';

// Layout Icon Components
const LayoutIcon = ({ type }) => {
  const iconProps = {
    className: "w-8 h-8 text-white",
    strokeWidth: 1.5
  };

  switch (type) {
    case 'off':
      return (
        <div className="w-8 h-8 border-2 border-white rounded bg-gray-600 flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded"></div>
        </div>
      );
    case 'vertical': // Lado a lado
      return (
        <div className="w-8 h-8 border-2 border-white rounded flex">
          <div className="w-1/2 bg-white"></div>
          <div className="w-px bg-gray-400"></div>
          <div className="w-1/2 bg-gray-600"></div>
        </div>
      );
    case 'horizontal': // Arriba y abajo
      return (
        <div className="w-8 h-8 border-2 border-white rounded flex flex-col">
          <div className="h-1/2 bg-white"></div>
          <div className="h-px bg-gray-400"></div>
          <div className="h-1/2 bg-gray-600"></div>
        </div>
      );
    case 'triptych-vertical': // 3 lado a lado
      return (
        <div className="w-8 h-8 border-2 border-white rounded flex">
          <div className="w-1/3 bg-white"></div>
          <div className="w-px bg-gray-400"></div>
          <div className="w-1/3 bg-gray-600"></div>
          <div className="w-px bg-gray-400"></div>
          <div className="w-1/3 bg-white"></div>
        </div>
      );
    case 'triptych-horizontal': // 3 arriba y abajo
      return (
        <div className="w-8 h-8 border-2 border-white rounded flex flex-col">
          <div className="h-1/3 bg-white"></div>
          <div className="h-px bg-gray-400"></div>
          <div className="h-1/3 bg-gray-600"></div>
          <div className="h-px bg-gray-400"></div>
          <div className="h-1/3 bg-white"></div>
        </div>
      );
    case 'grid-2x2': // 2x2 grid
      return (
        <div className="w-8 h-8 border-2 border-white rounded grid grid-cols-2 grid-rows-2 gap-px">
          <div className="bg-white"></div>
          <div className="bg-gray-600"></div>
          <div className="bg-gray-600"></div>
          <div className="bg-white"></div>
        </div>
      );
    case 'grid-3x2': // 3x2 grid
      return (
        <div className="w-8 h-8 border-2 border-white rounded grid grid-cols-3 grid-rows-2 gap-px">
          <div className="bg-white"></div>
          <div className="bg-gray-600"></div>
          <div className="bg-white"></div>
          <div className="bg-gray-600"></div>
          <div className="bg-white"></div>
          <div className="bg-gray-600"></div>
        </div>
      );
    case 'horizontal-3x2': // 2x3 grid
      return (
        <div className="w-8 h-8 border-2 border-white rounded grid grid-cols-2 grid-rows-3 gap-px">
          <div className="bg-white"></div>
          <div className="bg-gray-600"></div>
          <div className="bg-gray-600"></div>
          <div className="bg-white"></div>
          <div className="bg-white"></div>
          <div className="bg-gray-600"></div>
        </div>
      );
    default:
      return <div className="w-8 h-8 border-2 border-white rounded bg-gray-600"></div>;
  }
};

const LAYOUT_OPTIONS = [
  { id: 'off', name: 'Off', description: 'Sin layout (solo una imagen)' },
  { id: 'vertical', name: 'Lado a lado', description: 'Pantalla dividida en 2 partes lado a lado' },
  { id: 'horizontal', name: 'Arriba y abajo', description: 'Pantalla dividida en 2 partes arriba y abajo' },
  { id: 'triptych-vertical', name: 'Triptych lado a lado', description: 'Pantalla dividida en 3 partes lado a lado' },
  { id: 'triptych-horizontal', name: 'Triptych arriba y abajo', description: 'Pantalla dividida en 3 partes arriba y abajo' },
  { id: 'grid-2x2', name: 'Grid 2x2', description: 'Pantalla dividida en 4 partes (cuadrícula de 2x2)' },
  { id: 'grid-3x2', name: 'Grid 3x2', description: 'Pantalla dividida en 6 partes (cuadrícula de 3x2)' },
  { id: 'horizontal-3x2', name: 'Grid 2x3', description: 'Pantalla dividida en 6 partes (cuadrícula de 2x3)' }
];

const LayoutPreview = ({ layout, options = [], title, selectedMusic, onImageUpload, onImageRemove, onOptionTextChange, onMentionSelect, onCropFromPreview, cropActiveSlot, onInlineCropSave, onInlineCropCancel, fullscreen = false }) => {
  const getLayoutStyle = () => {
    switch (layout.id) {
      case 'off':
        return 'grid-cols-1 grid-rows-1';
      case 'vertical': // "Lado a lado" - 2 elementos horizontalmente
        return 'grid-cols-2 grid-rows-1';
      case 'horizontal': // "Arriba y abajo" - 2 elementos verticalmente
        return 'grid-cols-1 grid-rows-2';
      case 'triptych-vertical': // "Lado a lado" - 3 elementos horizontalmente
        return 'grid-cols-3 grid-rows-1';
      case 'triptych-horizontal': // "Arriba y abajo" - 3 elementos verticalmente
        return 'grid-cols-1 grid-rows-3';
      case 'grid-2x2':
        return 'grid-cols-2 grid-rows-2';
      case 'grid-3x2': // 3 columnas x 2 filas
        return 'grid-cols-3 grid-rows-2';
      case 'horizontal-3x2': // 2 columnas x 3 filas
        return 'grid-cols-2 grid-rows-3';
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
      case 'grid-3x2': return 6;
      case 'horizontal-3x2': return 6;
      default: return 1;
    }
  };

  const slots = Array.from({ length: getSlotsCount() }, (_, index) => index);

  // If fullscreen mode, show only first option that has content
  if (fullscreen) {
    const filledOptions = options.filter(opt => opt && opt.media);
    const previewOption = filledOptions[0] || { text: '', media: null, mentionedUsers: [] };
    const previewIndex = options.findIndex(opt => opt === previewOption);
    
    if (!previewOption.media) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <div className="text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Agrega imágenes para preview</h3>
            <p className="text-gray-400">Sube imágenes a las opciones para ver el preview fullscreen</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full relative">
        {/* Single option fullscreen preview */}
        <div className="w-full h-full relative bg-black">
          {/* Letter identifier */}
          <div className="absolute top-6 left-6 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-lg z-20">
            {String.fromCharCode(65 + previewIndex)}
          </div>

          {/* Background Image - True Fullscreen */}
          <img 
            src={previewOption.media.url} 
            alt={`Opción ${previewIndex + 1}`}
            className="w-full h-full object-cover"
          />
          
          {/* No overlay - clean image only */}
        </div>
      </div>
    );
  }

  // Normal grid mode
  return (
    <div className="w-full h-full">
      <div className={`grid w-full h-full ${getLayoutStyle()}`} style={{ gap: '1px' }}>
        {slots.map((slotIndex) => {
          const option = options[slotIndex] || { text: '', media: null, mentionedUsers: [] };
          return (
            <div
              key={slotIndex}
              className="relative bg-black overflow-hidden group w-full h-full min-h-0"
            >
              {/* Letter identifier */}
              <div className="absolute top-2 left-2 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                {String.fromCharCode(65 + slotIndex)}
              </div>
              
              {/* Fullscreen Feed-style Preview */}
              <div 
                className={`w-full h-full relative overflow-hidden ${
                  cropActiveSlot === slotIndex ? '' : 'cursor-pointer'
                }`}
                onClick={(e) => {
                  // FIXED: Don't intercept events when in crop mode
                  if (cropActiveSlot === slotIndex) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  
                  // If image exists, open crop directly. If not, upload new image.
                  if (option.media && option.media.type === 'image') {
                    onCropFromPreview(slotIndex);
                  } else {
                    onImageUpload(slotIndex);
                  }
                }}
                style={{
                  // FIXED: Disable pointer events on parent when crop is active
                  pointerEvents: cropActiveSlot === slotIndex ? 'none' : 'auto'
                }}
              >
                {option.media ? (
                  <>
                    {/* Background Media - Fullscreen style */}
                    {option.media.type === 'video' ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={option.media.thumbnail || option.media.url} 
                          alt={`Video Opción ${slotIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Video play overlay */}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                            <Video className="w-8 h-8 text-gray-900 ml-1" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <InlineCrop
                        key={`${slotIndex}-${option.media.url}`} // Force re-render with fresh props
                        isActive={cropActiveSlot === slotIndex}
                        imageSrc={option.media.url}
                        savedTransform={option.media.transform || null}
                        onSave={onInlineCropSave}
                        onCancel={onInlineCropCancel}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* DEBUG VISUAL for savedTransform */}
                    {option.media && option.media.type === 'image' && (
                      <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs p-1 rounded pointer-events-none z-50">
                        Slot {slotIndex}: T: {option.media.transform ? 'YES' : 'NO'}
                        {option.media.transform && (
                          <div>P: {option.media.transform.position?.x},{option.media.transform.position?.y}</div>
                        )}
                      </div>
                    )}
                    
                    {/* Clean Image Preview - NO decorative elements */}
                    <div className="absolute inset-0">
                      {/* Only show the image, no overlays or decorative elements */}
                    </div>

                    {/* Minimalist edit controls - top corner */}
                    <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const textInput = document.querySelector(`input[data-option-index="${slotIndex}"]`);
                            if (textInput) textInput.focus();
                          }}
                          className="w-8 h-8 bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                          title="Editar descripción"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onImageRemove(slotIndex);
                          }}
                          className="w-8 h-8 bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                          title="Cambiar imagen/video"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Fullscreen Upload Area - Exactly like the reference image */
                  <div className="w-full h-full flex items-center justify-center relative">
                    {/* Main gradient background - matches the reference */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"></div>
                    
                    {/* TikTok-style right sidebar - HIDDEN */}
                    {false && (
                    <div className="absolute top-1/2 right-2 sm:right-4 transform -translate-y-1/2 z-20">
                      <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4">
                        {/* Like Button */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-white text-sm sm:text-base lg:text-xl">❤️</span>
                        </div>
                        
                        {/* Comment Button */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-white text-sm sm:text-base lg:text-xl">💬</span>
                        </div>
                        
                        {/* Share Button */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-white text-sm sm:text-base lg:text-xl">📤</span>
                        </div>
                        
                        {/* Plus Button (matches reference) */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                        </div>
                        
                        {/* More options */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-white text-sm sm:text-base lg:text-xl">💭</span>
                        </div>
                        
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-white text-sm sm:text-base lg:text-xl">👤</span>
                        </div>
                      </div>
                    </div>
                    )}
                    
                    {/* Central upload content - responsive for mobile */}
                    <div className="text-center z-10 px-4">
                      {/* Large circular button with gradient - responsive */}
                      <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mb-4 sm:mb-6 lg:mb-8 mx-auto shadow-2xl">
                        <Plus className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                      </div>
                      
                      {/* Text responsive for mobile */}
                      <h3 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 lg:mb-4">Opción {String.fromCharCode(65 + slotIndex)}</h3>
                      <p className="text-white text-base sm:text-lg lg:text-xl mb-1 sm:mb-2">Toca para agregar imagen o video</p>
                      <p className="text-gray-300 text-sm sm:text-base">Se verá exactamente como en el feed</p>
                    </div>

                    {/* Letter identifier - top left like TikTok - responsive */}
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 lg:top-6 lg:left-6 w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base lg:text-lg z-20">
                      {String.fromCharCode(65 + slotIndex)}
                    </div>
                  </div>
                )}
              </div>

              {/* Edit controls */}
              {option.media && (
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <UserMentionInput
                    placeholder={`Descripción opción ${String.fromCharCode(65 + slotIndex)}...`}
                    value={option.text}
                    onChange={(newText) => onOptionTextChange(slotIndex, newText)}
                    onMentionSelect={(user) => onMentionSelect(slotIndex, user)}
                    className="w-full bg-black/60 backdrop-blur-sm text-white px-3 py-2 text-sm rounded-lg border border-white/20 focus:border-white/40 focus:outline-none placeholder-gray-300"
                    data-option-index={slotIndex}
                  />
                </div>
              )}
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
  const { enterTikTokMode, exitTikTokMode, hideRightNavigationBar, showRightNavigationBar } = useTikTok();
  const fileInputRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Enter TikTok mode when on create page (hides all navigation)
  useEffect(() => {
    enterTikTokMode();
    hideRightNavigationBar(); // Explicitly hide right navigation
    
    // Remove any body margins/padding that could cause white space
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.body.style.overflow = 'hidden';
    
    // Exit TikTok mode when leaving the page
    return () => {
      exitTikTokMode();
      showRightNavigationBar(); // Restore right navigation
      // Restore body styles
      document.body.style.overflow = 'auto';
    };
  }, [enterTikTokMode, exitTikTokMode, hideRightNavigationBar, showRightNavigationBar]);

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
  const [previewMode, setPreviewMode] = useState(false); // New state for fullscreen preview
  const [cropActiveSlot, setCropActiveSlot] = useState(null); // Which slot is in crop mode

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

  // Handle crop from preview (inline crop mode)
  const handleCropFromPreview = (slotIndex) => {
    const option = options[slotIndex];
    if (!option?.media?.file || option.media.type !== 'image') {
      return;
    }
    
    // Activate inline crop for this slot
    setCropActiveSlot(slotIndex);
  };

  // Handle inline crop save - now saves transform data only
  const handleInlineCropSave = (transformResult) => {
    if (cropActiveSlot === null) return;
    
    console.log('📥 Received transform data:', transformResult);
    console.log('📍 Current slot:', cropActiveSlot);
    
    // Update the option media with transform data (no actual cropping)
    const updatedMedia = {
      ...options[cropActiveSlot].media,
      transform: transformResult.transform // Save position and scale
    };
    
    updateOption(cropActiveSlot, 'media', updatedMedia);
    console.log('💾 Updated option media with transform');
  };

  // Add useEffect to properly verify state changes
  useEffect(() => {
    console.log('📦 Options state updated:', options);
  }, [options]);

  // Handle inline crop cancel
  const handleInlineCropCancel = () => {
    setCropActiveSlot(null);
  };

  const getSlotsCount = () => {
    switch (selectedLayout.id) {
      case 'off': return 1;
      case 'vertical': return 2;
      case 'horizontal': return 2;
      case 'triptych-vertical': return 3;
      case 'triptych-horizontal': return 3;
      case 'grid-2x2': return 4;
      case 'grid-3x2': return 6;
      case 'horizontal-3x2': return 6;
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
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen o video (JPG, PNG, GIF, WEBP, MP4, MOV, AVI)",
        variant: "destructive"
      });
      return;
    }

    // Check file size (max 50MB for videos, 10MB for images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: `El archivo es muy grande. Máximo ${isVideo ? '50MB' : '10MB'} permitido.`,
        variant: "destructive"
      });
      return;
    }

    // Process files directly without crop - crop will be available after upload
    if (isImage) {
      processImageFile(file);
    } else if (isVideo) {
      processVideoFile(file);
    }

    // Reset file input
    event.target.value = '';
  };

  // Handle crop save
  const handleCropSave = (cropResult) => {
    // This function is now replaced by handleInlineCropSave
    console.log('handleCropSave called but should use inline crop');
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    // This function is now replaced by handleInlineCropCancel
    console.log('handleCropCancel called but should use inline crop');
  };

  // Process image file (after crop)
  const processImageFile = async (file, base64 = null) => {
    try {
      let mediaData;
      
      if (!base64) {
        base64 = await fileToBase64(file);
      }
      
      mediaData = {
        url: base64,
        type: 'image',
        file: file
      };

      updateOption(currentSlotIndex, 'media', mediaData);

      toast({
        title: "Imagen cargada",
        description: "La imagen se ha agregado exitosamente",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar la imagen. Intenta con otra imagen.",
        variant: "destructive"
      });
    }
  };

  // Process video file
  const processVideoFile = async (file) => {
    try {
      console.log('🎥 Processing video with base64...');
      const base64 = await fileToBase64(file);
        
      // Create thumbnail like the original modal
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      // Fondo degradado
      const gradient = ctx.createLinearGradient(0, 0, 0, 600);
      gradient.addColorStop(0, '#1f2937');
      gradient.addColorStop(1, '#111827');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 600);
      
      // Ícono de play
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(160, 250);
      ctx.lineTo(160, 350);
      ctx.lineTo(240, 300);
      ctx.closePath();
      ctx.fill();
      
      // Agregar texto
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.textAlign = 'center';
      ctx.fillText('Video Preview', 200, 380);
      
      const mediaData = {
        type: 'video',
        url: base64,
        thumbnail: canvas.toDataURL('image/png'),
        file: file,
        name: file.name,
        size: file.size
      };
      
      updateOption(currentSlotIndex, 'media', mediaData);

      toast({
        title: "✅ Video agregado",
        description: `Video agregado a la opción ${String.fromCharCode(65 + currentSlotIndex)}`,
      });
    } catch (error) {
      console.error('❌ Video upload error:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el video. Intenta con otro video.",
        variant: "destructive"
      });
    }
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
        description: "Necesitas agregar al menos una imagen o video",
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
          text: opt.text.trim() || '', // Use provided text or empty string
          media_type: opt.media.type, // Use the actual media type (image or video)
          media_url: opt.media.url,
          thumbnail_url: opt.media.thumbnail || opt.media.url, // Use thumbnail for videos, original for images
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
    <div className="fixed inset-0 z-50 relative h-screen w-screen overflow-hidden" style={{ margin: 0, padding: 0 }}>
      {/* Main Content Area - Preview ocupa TODA la pantalla */}
      <div className="w-full h-full min-h-screen">
        <LayoutPreview
          layout={selectedLayout}
          options={options}
          title={title}
          selectedMusic={selectedMusic}
          onImageUpload={handleImageUpload}
          onImageRemove={handleImageRemove}
          onOptionTextChange={handleOptionTextChange}
          onMentionSelect={handleMentionSelect}
          onCropFromPreview={handleCropFromPreview}
          cropActiveSlot={cropActiveSlot}
          onInlineCropSave={handleInlineCropSave}
          onInlineCropCancel={handleInlineCropCancel}
          fullscreen={previewMode}
        />
      </div>

      {/* Header Controls - Floating on top - Hidden in preview mode */}
      {!previewMode && (
        <div className="absolute top-0 left-0 right-0 z-50">
          {/* Main Controls Row */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
            {/* Close button - Left */}
            <button
              onClick={handleClose}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white bg-black/50 backdrop-blur-sm rounded-lg"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Add Sound button - Center (pill style) */}
            <button
              onClick={() => setShowMusicSelector(true)}
              className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-black/70 backdrop-blur-sm hover:bg-black/80 rounded-full text-white transition-colors"
            >
              <Music className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium truncate max-w-24 sm:max-w-40">
                {selectedMusic ? `🎵 ${selectedMusic.title}` : 'Add sound'}
              </span>
            </button>

            {/* Preview button - Right */}
            <button
              onClick={() => setPreviewMode(true)}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/60 transition-colors"
              title="Vista previa fullscreen"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Description Input - Small, below Add Sound */}
          <div className="px-3 sm:px-4 pb-2">
            <input
              type="text"
              placeholder="Describe tu publicación..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg border border-white/20 focus:border-white/50 focus:outline-none placeholder-gray-300 text-xs sm:text-sm"
            />
          </div>
        </div>
      )}

      {/* Exit preview button - Only visible in preview mode */}
      {previewMode && (
        <button
          onClick={() => setPreviewMode(false)}
          className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Floating Right Sidebar - Overlay on top of content - Hidden in preview mode */}
      {!previewMode && (
        <div className="absolute top-16 sm:top-20 right-2 sm:right-4 z-40 flex flex-col gap-2 sm:gap-3">
          {/* Spacer for where music button was - to maintain layout positioning */}
          <div className="w-10 h-10 sm:w-12 sm:h-12"></div>

          {/* Layout Button */}
          <div className="relative">
            <button
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-black/70 backdrop-blur-sm hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all shadow-lg border border-white/10"
            >
              <div className="scale-75 sm:scale-90">
                <LayoutIcon type={selectedLayout.id} />
              </div>
            </button>

            {/* Layout Menu */}
            {showLayoutMenu && (
              <div className="absolute right-full top-0 mr-2 sm:mr-3 w-16 sm:w-20 bg-gray-900 rounded-lg shadow-xl overflow-hidden z-50 border border-white/10">
                <div className="py-2">
                  {LAYOUT_OPTIONS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => handleLayoutSelect(layout)}
                      className={`w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                        selectedLayout.id === layout.id ? 'bg-gray-600 text-white' : 'text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <LayoutIcon type={layout.id} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Publish Button */}
          <button
            onClick={handleCreate}
            disabled={isCreating || !title.trim() || options.filter(opt => opt && opt.media).length < 2}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/90 backdrop-blur-sm hover:bg-red-600/90 disabled:bg-gray-500/70 rounded-lg flex items-center justify-center text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
            title={isCreating ? 'Publicando...' : 'Publicar'}
          >
            {isCreating ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      )}

      {/* Music Selector Modal */}
      {showMusicSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Seleccionar Música</h3>
              <button
                onClick={() => setShowMusicSelector(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
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
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ContentCreationPage;