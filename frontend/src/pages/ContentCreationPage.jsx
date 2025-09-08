import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Music, LayoutGrid, Plus, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import MusicSelector from '../components/MusicSelector';
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

const LayoutPreview = ({ layout, images = [], onImageUpload, onImageRemove }) => {
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
    <div className={`grid gap-1 w-full h-full ${getLayoutStyle()}`}>
      {slots.map((slotIndex) => (
        <div
          key={slotIndex}
          className="relative bg-gray-800 border border-gray-600 rounded-lg overflow-hidden group cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => onImageUpload(slotIndex)}
        >
          {images[slotIndex] ? (
            <>
              <img 
                src={images[slotIndex].url} 
                alt={`Slot ${slotIndex + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onImageRemove(slotIndex);
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 group-hover:text-gray-300 transition-colors">
              <div className="text-center">
                <Plus className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs">Agregar</span>
              </div>
            </div>
          )}
        </div>
      ))}
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
  const [images, setImages] = useState([]);
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
    // Clear images when changing layout to avoid confusion
    setImages([]);
    toast({
      title: "📐 Layout seleccionado",
      description: layout.description,
    });
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
      const newImages = [...images];
      newImages[currentSlotIndex] = {
        url: base64,
        type: 'image',
        file: file,
        name: file.name,
        size: file.size
      };
      setImages(newImages);

      toast({
        title: "✅ Imagen agregada",
        description: `Imagen agregada al slot ${currentSlotIndex + 1}`,
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
    const newImages = [...images];
    newImages[slotIndex] = null;
    setImages(newImages);
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

    const validImages = images.filter(img => img);
    if (validImages.length === 0) {
      toast({
        title: "Error", 
        description: "Necesitas agregar al menos una imagen",
        variant: "destructive"
      });
      return;
    }

    // Validate minimum options (like CreatePollModal)
    if (validImages.length < 2) {
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
      const processedOptions = validImages.map((img, index) => ({
        text: `Opción ${index + 1}`, // Keep text simple
        media_type: 'image',
        media_url: img.url,
        thumbnail_url: img.url, // For images, thumbnail is same as url
        mentioned_users: [] // No mentions for now
      }));

      const pollData = {
        title: title.trim(),
        description: null, // No description field
        options: processedOptions,
        music_id: selectedMusic?.id || null, // Use music_id format
        tags: [], // No tags
        category: 'general', // Default category
        mentioned_users: [], // No global mentions
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

      // Navigate to feed
      navigate('/feed');

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
            <div className="w-full max-w-md h-96 bg-gray-900 rounded-lg p-2">
              <LayoutPreview
                layout={selectedLayout}
                images={images}
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
              />
            </div>
          </div>

          {/* Create Button */}
          <div className="mt-6">
            <button
              onClick={handleCreate}
              disabled={isCreating || !title.trim() || images.filter(img => img).length < 2}
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
                  {images.filter(img => img).length >= 2 && title.trim() && (
                    <span className="text-sm opacity-75">({images.filter(img => img).length} opciones)</span>
                  )}
                </div>
              )}
            </button>
            {/* Help text */}
            {(!title.trim() || images.filter(img => img).length < 2) && (
              <p className="text-gray-400 text-sm mt-2 text-center">
                {!title.trim() 
                  ? "Agrega una pregunta o descripción" 
                  : images.filter(img => img).length < 2 
                    ? `Necesitas al menos 2 imágenes (tienes ${images.filter(img => img).length})`
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