import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Music, LayoutGrid, Plus, Upload, Image as ImageIcon, Video, AtSign, Edit3 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { useTikTok } from '../contexts/TikTokContext';
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

const LayoutPreview = ({ layout, options = [], title, selectedMusic, onImageUpload, onImageRemove, onOptionTextChange, onMentionSelect, fullscreen = false }) => {
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
          
          {/* Feed-style overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20">
            {/* Right Side Actions like TikTok - but bigger for preview */}
            <div className="absolute top-1/2 right-6 transform -translate-y-1/2 z-20">
              <div className="flex flex-col gap-6">
                {/* Like Button */}
                <div className="w-14 h-14 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <div className="text-white text-2xl">❤️</div>
                </div>
                <p className="text-white text-sm text-center font-medium">15.2K</p>
                
                {/* Comment Button */}
                <div className="w-14 h-14 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <div className="text-white text-2xl">💬</div>
                </div>
                <p className="text-white text-sm text-center font-medium">1.2K</p>
                
                {/* Share Button */}
                <div className="w-14 h-14 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <div className="text-white text-2xl">📤</div>
                </div>
                <p className="text-white text-sm text-center font-medium">3.1K</p>
              </div>
            </div>

            {/* Music Disc - Spinning */}
            {selectedMusic && (
              <div className="absolute bottom-24 right-6 z-20">
                <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-spin border-2 border-white">
                  <Music className="w-7 h-7 text-white" />
                </div>
              </div>
            )}
            
            {/* Bottom Section - Content Description */}
            <div className="absolute bottom-6 left-6 right-20 z-20">
              <div className="space-y-3">
                {/* Profile info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{String.fromCharCode(65 + previewIndex)}</span>
                  </div>
                  <div>
                    <span className="text-white font-semibold text-lg">@usuario_{String.fromCharCode(97 + previewIndex)}</span>
                    <p className="text-white/80 text-sm">Vista previa · Hace 2h</p>
                  </div>
                </div>

                {/* Main Title */}
                {title && (
                  <h3 className="text-white font-bold text-xl leading-tight">
                    {title}
                  </h3>
                )}
                
                {/* Option Text */}
                {previewOption.text && (
                  <p className="text-white font-medium text-lg leading-tight">
                    {previewOption.text}
                  </p>
                )}
                
                {/* Hashtags and Mentions */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-blue-300 text-base">#votación</span>
                  <span className="text-blue-300 text-base">#opción{String.fromCharCode(65 + previewIndex)}</span>
                  <span className="text-blue-300 text-base">#elige</span>
                  {previewOption.mentionedUsers?.map((user) => (
                    <span key={user.id} className="text-blue-300 text-base">@{user.username}</span>
                  ))}
                </div>
                
                {/* Music Info */}
                {selectedMusic && (
                  <div className="flex items-center gap-3 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 max-w-fit">
                    <Music className="w-5 h-5 text-white" />
                    <span className="text-white text-base font-medium">♪ {selectedMusic.title} - {selectedMusic.artist}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar like TikTok */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
              <div className="h-full w-3/4 bg-white"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal grid mode
  return (
    <div className="w-full h-full">
      <div className={`grid gap-0 w-full h-full ${getLayoutStyle()}`}>
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
                className="w-full h-full cursor-pointer relative overflow-hidden"
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
                    
                    {/* Clean Image Preview with Essential Info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40">
                      
                      {/* Top Section - Profile Info like TikTok */}
                      <div className="absolute top-4 left-4 right-4 z-20">
                        <div className="flex items-center gap-3">
                          {/* Profile Avatar */}
                          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{String.fromCharCode(65 + slotIndex)}</span>
                          </div>
                          
                          {/* Profile Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-sm">@usuario_{String.fromCharCode(97 + slotIndex)}</span>
                              <div className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                                <span className="text-white text-xs font-medium">Vista previa</span>
                              </div>
                            </div>
                            <p className="text-white/80 text-xs">Hace 2h</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Side Actions like TikTok */}
                      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
                        <div className="flex flex-col gap-4">
                          {/* Like Button */}
                          <div className="w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <div className="text-white text-lg">❤️</div>
                          </div>
                          <p className="text-white text-xs text-center font-medium">15.2K</p>
                          
                          {/* Comment Button */}
                          <div className="w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <div className="text-white text-lg">💬</div>
                          </div>
                          <p className="text-white text-xs text-center font-medium">1.2K</p>
                          
                          {/* Share Button */}
                          <div className="w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <div className="text-white text-lg">📤</div>
                          </div>
                          <p className="text-white text-xs text-center font-medium">3.1K</p>
                        </div>
                      </div>

                      {/* Music Disc - Spinning like TikTok */}
                      {selectedMusic && (
                        <div className="absolute bottom-20 right-4 z-20">
                          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-spin border-2 border-white">
                            <Music className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                      
                      {/* Bottom Section - Content Description */}
                      <div className="absolute bottom-4 left-4 right-16 z-20">
                        <div className="space-y-2">
                          {/* Main Title */}
                          {title && (
                            <h3 className="text-white font-bold text-lg leading-tight">
                              {title}
                            </h3>
                          )}
                          
                          {/* Option Text */}
                          {option.text && (
                            <p className="text-white font-medium text-base leading-tight">
                              {option.text}
                            </p>
                          )}
                          
                          {/* Hashtags and Mentions */}
                          <div className="flex flex-wrap gap-1">
                            <span className="text-blue-300 text-sm">#votación</span>
                            <span className="text-blue-300 text-sm">#opción{String.fromCharCode(65 + slotIndex)}</span>
                            <span className="text-blue-300 text-sm">#elige</span>
                            {option.mentionedUsers?.map((user) => (
                              <span key={user.id} className="text-blue-300 text-sm">@{user.username}</span>
                            ))}
                          </div>
                          
                          {/* Music Info */}
                          {selectedMusic && (
                            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 max-w-fit">
                              <Music className="w-4 h-4 text-white" />
                              <span className="text-white text-sm font-medium">♪ {selectedMusic.title} - {selectedMusic.artist}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar like TikTok */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                        <div className="h-full w-3/4 bg-white"></div>
                      </div>
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
                          title="Cambiar imagen"
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
                    
                    {/* TikTok-style right sidebar */}
                    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
                      <div className="flex flex-col gap-4">
                        {/* Like Button */}
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-white text-xl">❤️</span>
                        </div>
                        
                        {/* Comment Button */}
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-white text-xl">💬</span>
                        </div>
                        
                        {/* Share Button */}
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-white text-xl">📤</span>
                        </div>
                        
                        {/* Plus Button (matches reference) */}
                        <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <Plus className="w-6 h-6 text-white" />
                        </div>
                        
                        {/* More options */}
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-white text-xl">💭</span>
                        </div>
                        
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-white text-xl">👤</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Central upload content - matches reference exactly */}
                    <div className="text-center z-10">
                      {/* Large circular button with gradient - exactly like reference */}
                      <div className="w-32 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mb-8 mx-auto shadow-2xl">
                        <Plus className="w-12 h-12 text-white" />
                      </div>
                      
                      {/* Text exactly like reference */}
                      <h3 className="text-white text-3xl font-bold mb-4">Opción {String.fromCharCode(65 + slotIndex)}</h3>
                      <p className="text-white text-xl mb-2">Toca para agregar tu imagen</p>
                      <p className="text-gray-300 text-base">Se verá exactamente como en el feed</p>
                    </div>

                    {/* Letter identifier - top left like TikTok */}
                    <div className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg z-20">
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
  const { enterTikTokMode, exitTikTokMode } = useTikTok();
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
    
    // Exit TikTok mode when leaving the page
    return () => {
      exitTikTokMode();
    };
  }, [enterTikTokMode, exitTikTokMode]);

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
    <div className="fixed inset-0 bg-black z-50 relative">
      {/* Main Content Area - Preview ocupa TODA la pantalla */}
      <div className="w-full h-full">
        <LayoutPreview
          layout={selectedLayout}
          options={options}
          title={title}
          selectedMusic={selectedMusic}
          onImageUpload={handleImageUpload}
          onImageRemove={handleImageRemove}
          onOptionTextChange={handleOptionTextChange}
          onMentionSelect={handleMentionSelect}
          fullscreen={previewMode}
        />
      </div>

      {/* Header Controls - Floating on top - Hidden in preview mode */}
      {!previewMode && (
        <div className="absolute top-0 left-0 right-0 z-50">
          {/* Main Controls Row */}
          <div className="flex items-center justify-between px-4 py-3">
            {/* Close button - Left */}
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center text-white bg-black/50 backdrop-blur-sm rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Add Sound button - Center (pill style) */}
            <button
              onClick={() => setShowMusicSelector(true)}
              className="flex items-center gap-2 px-6 py-3 bg-black/70 backdrop-blur-sm hover:bg-black/80 rounded-full text-white transition-colors"
            >
              <Music className="w-5 h-5" />
              <span className="text-sm font-medium truncate max-w-40">
                {selectedMusic ? `🎵 ${selectedMusic.title}` : 'Add sound'}
              </span>
            </button>

            {/* Preview button - Right */}
            <button
              onClick={() => setPreviewMode(true)}
              className="w-8 h-8 flex items-center justify-center text-white bg-black/50 backdrop-blur-sm rounded-lg"
              title="Vista previa fullscreen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Description Input - Small, below Add Sound */}
          <div className="px-4 pb-2">
            <input
              type="text"
              placeholder="Describe tu publicación..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg border border-white/20 focus:border-white/50 focus:outline-none placeholder-gray-300 text-sm"
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
        <div className="absolute top-20 right-4 z-40 flex flex-col gap-3">
            {/* Add Sound Button */}
            <button
              onClick={() => setShowMusicSelector(true)}
              className="w-12 h-12 bg-black/70 backdrop-blur-sm hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all shadow-lg border border-white/10"
              title={selectedMusic ? `🎵 ${selectedMusic.title}` : 'Add sound'}
            >
              <Music className="w-6 h-6" />
            </button>

            {/* Layout Button */}
            <div className="relative">
              <button
                onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                className="w-12 h-12 bg-black/70 backdrop-blur-sm hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all shadow-lg border border-white/10"
              >
                <LayoutGrid className="w-6 h-6" />
              </button>

              {/* Layout Menu */}
              {showLayoutMenu && (
                <div className="absolute right-full top-0 mr-3 w-64 bg-gray-900 rounded-lg shadow-xl overflow-hidden z-50 border border-white/10">
                  <div className="py-2">
                    {LAYOUT_OPTIONS.map((layout) => (
                      <button
                        key={layout.id}
                        onClick={() => handleLayoutSelect(layout)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                          selectedLayout.id === layout.id ? 'bg-gray-600 text-white' : 'text-gray-300'
                        }`}
                      >
                        <div className="font-medium">{layout.name}</div>
                        <div className="text-sm text-gray-400">{layout.description}</div>
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
              className="w-12 h-12 bg-red-500/90 backdrop-blur-sm hover:bg-red-600/90 disabled:bg-gray-500/70 rounded-full flex items-center justify-center text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
              title={isCreating ? 'Publicando...' : 'Publicar'}
            >
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
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
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ContentCreationPage;