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
  const fileInputRef = useRef(null);

  // States
  const [selectedLayout, setSelectedLayout] = useState(LAYOUT_OPTIONS[0]); // Off by default
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);

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
        description: "Solo se permiten archivos de imagen",
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
        file: file
      };
      setImages(newImages);

      toast({
        title: "✅ Imagen agregada",
        description: `Imagen agregada al slot ${currentSlotIndex + 1}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la imagen",
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
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Necesitas escribir una pregunta o descripción",
        variant: "destructive"
      });
      return;
    }

    if (images.filter(img => img).length === 0) {
      toast({
        title: "Error", 
        description: "Necesitas agregar al menos una imagen",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Prepare poll data similar to CreatePollModal
      const pollData = {
        title: title.trim(),
        options: images.filter(img => img).map((img, index) => ({
          text: `Opción ${index + 1}`,
          media: {
            type: 'image',
            url: img.url
          },
          mentionedUsers: []
        })),
        music: selectedMusic ? {
          id: selectedMusic.id,
          title: selectedMusic.title,
          artist: selectedMusic.artist,
          preview_url: selectedMusic.preview_url,
          artwork_url: selectedMusic.artwork_url
        } : null,
        layout: selectedLayout.id,
        mentionedUsers: []
      };

      // Create poll using existing service
      await pollService.createPoll(pollData);

      toast({
        title: "🎉 ¡Publicación creada!",
        description: "Tu contenido ha sido publicado exitosamente",
      });

      // Navigate to feed
      navigate('/feed');

    } catch (error) {
      console.error('Error creating content:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la publicación. Inténtalo de nuevo.",
        variant: "destructive"
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
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white transition-colors"
        >
          <Music className="w-5 h-5" />
          <span className="text-sm font-medium">
            {selectedMusic ? selectedMusic.title : 'Add sound'}
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
              disabled={isCreating || !title.trim() || images.filter(img => img).length === 0}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
            >
              {isCreating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creando...
                </div>
              ) : (
                'Crear publicación'
              )}
            </button>
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
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh]">
            <MusicSelector
              onMusicSelect={handleMusicSelect} 
              onClose={() => setShowMusicSelector(false)}
              selectedMusic={selectedMusic}
            />
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