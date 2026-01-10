import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, Image as ImageIcon, MapPin, Send, Sparkles, RotateCcw, Upload, Edit3 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { useTikTok } from '../contexts/TikTokContext';
import InlineCrop from '../components/InlineCrop';
import config from '../config/config';

const MomentCreationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { enterTikTokMode, exitTikTokMode, hideRightNavigationBar, showRightNavigationBar } = useTikTok();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // States
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [filter, setFilter] = useState('none');
  const [cropActive, setCropActive] = useState(false);
  const [imageTransform, setImageTransform] = useState(null);
  const [showCaptionInput, setShowCaptionInput] = useState(false);

  // Available filters
  const filters = [
    { id: 'none', name: 'Original', class: '' },
    { id: 'warm', name: 'Cálido', class: 'sepia-[0.3] saturate-150' },
    { id: 'cool', name: 'Frío', class: 'hue-rotate-15 saturate-110' },
    { id: 'vintage', name: 'Vintage', class: 'sepia-[0.5] contrast-110' },
    { id: 'bw', name: 'B&N', class: 'grayscale' },
    { id: 'vivid', name: 'Vívido', class: 'saturate-150 contrast-110' },
    { id: 'fade', name: 'Desvanecido', class: 'brightness-110 contrast-90 saturate-75' },
    { id: 'dramatic', name: 'Dramático', class: 'contrast-125 saturate-110' },
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Enter TikTok mode (hide navigation)
  useEffect(() => {
    enterTikTokMode();
    hideRightNavigationBar();
    
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.body.style.overflow = 'hidden';
    
    return () => {
      exitTikTokMode();
      showRightNavigationBar();
      document.body.style.overflow = 'auto';
    };
  }, [enterTikTokMode, exitTikTokMode, hideRightNavigationBar, showRightNavigationBar]);

  // Handle image selection
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Formato no válido",
        description: "Por favor selecciona una imagen",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Imagen muy grande",
        description: "El tamaño máximo es 10MB",
        variant: "destructive"
      });
      return;
    }

    setImageFile(file);
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setImageTransform(null);
  };

  // Handle camera capture
  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  // Handle gallery selection
  const handleGallerySelect = () => {
    fileInputRef.current?.click();
  };

  // Reset image
  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageFile(null);
    setFilter('none');
    setImageTransform(null);
    setCropActive(false);
  };

  // Handle inline crop save
  const handleCropSave = (transform) => {
    setImageTransform(transform);
    setCropActive(false);
    toast({
      title: "✅ Ajuste guardado",
      description: "La imagen ha sido ajustada",
    });
  };

  // Handle inline crop cancel
  const handleCropCancel = () => {
    setCropActive(false);
  };

  // Publish moment
  const handlePublish = async () => {
    if (!selectedImage) {
      toast({
        title: "Sin imagen",
        description: "Selecciona una imagen para tu momento",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('caption', caption);
      formData.append('location', location);
      formData.append('filter', filter);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${config.BACKEND_URL}/api/moments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al publicar el momento');
      }

      toast({
        title: "¡Momento publicado!",
        description: "Tu momento ha sido compartido con tus seguidores",
      });

      navigate('/');
    } catch (error) {
      console.error('Error publishing moment:', error);
      toast({
        title: "Error",
        description: "No se pudo publicar el momento. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
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
    <div className="fixed inset-0 z-50 relative h-screen w-screen overflow-hidden bg-black" style={{ margin: 0, padding: 0 }}>
      {/* Main Content Area */}
      <div className="absolute top-0 left-0 right-0 bottom-32">
        <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden">
          
          {!imagePreview ? (
            // Image Selection View - Similar to ContentCreationPage empty state
            <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-8">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-white text-xl font-bold mb-2">Captura tu momento</h2>
                <p className="text-white/60 text-sm max-w-xs">
                  Guarda esos instantes especiales que no quieres olvidar
                </p>
              </div>

              <div className="flex gap-4">
                {/* Camera Button */}
                <button
                  onClick={handleCameraCapture}
                  className="flex flex-col items-center gap-2 p-6 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl hover:scale-105 transition-transform"
                >
                  <Camera className="w-8 h-8 text-white" />
                  <span className="text-white font-medium text-sm">Cámara</span>
                </button>

                {/* Gallery Button */}
                <button
                  onClick={handleGallerySelect}
                  className="flex flex-col items-center gap-2 p-6 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors"
                >
                  <ImageIcon className="w-8 h-8 text-white" />
                  <span className="text-white font-medium text-sm">Galería</span>
                </button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          ) : (
            // Image Preview with InlineCrop - Same as ContentCreationPage
            <div 
              className="w-full h-full relative overflow-hidden cursor-pointer"
              onClick={() => !cropActive && setCropActive(true)}
            >
              <InlineCrop
                isActive={cropActive}
                imageSrc={imagePreview}
                savedTransform={imageTransform ? { transform: imageTransform } : null}
                onSave={handleCropSave}
                onCancel={handleCropCancel}
                className={`w-full h-full object-cover ${filters.find(f => f.id === filter)?.class || ''}`}
              />

              {/* Edit controls - Top left */}
              {!cropActive && (
                <div className="absolute top-4 left-4 z-30">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCaptionInput(true);
                      }}
                      className="w-10 h-10 bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                      title="Editar descripción"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGallerySelect();
                      }}
                      className="w-10 h-10 bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                      title="Cambiar imagen"
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      className="w-10 h-10 bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                      title="Eliminar"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Caption overlay at bottom */}
              {caption && !cropActive && (
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <p className="text-white text-sm font-medium drop-shadow-lg line-clamp-3 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
                    {caption}
                  </p>
                </div>
              )}

              {/* Location badge */}
              {location && !cropActive && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <MapPin className="w-3 h-3 text-white" />
                  <span className="text-white text-xs">{location}</span>
                </div>
              )}

              {/* Tap to adjust hint */}
              {!cropActive && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
                  <span className="text-white/60 text-xs bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                    Toca para ajustar
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Area - Same style as ContentCreationPage */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-black px-4 flex flex-col justify-center gap-3">
        
        {/* Filters row - only show when image is selected */}
        {imagePreview && !cropActive && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
                  filter === f.id ? 'bg-amber-500/30 ring-2 ring-amber-500' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg overflow-hidden ${f.class}`}>
                  <img
                    src={imagePreview}
                    alt={f.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-[10px] ${filter === f.id ? 'text-amber-400' : 'text-white/70'}`}>
                  {f.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Action buttons row */}
        <div className="flex items-center justify-between">
          {/* Close button */}
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-white font-semibold">Momento</span>
          </div>

          {/* Publish button */}
          <button
            onClick={handlePublish}
            disabled={!selectedImage || isPublishing}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              selectedImage && !isPublishing
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:scale-105'
                : 'bg-white/20 cursor-not-allowed'
            }`}
          >
            {isPublishing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Caption/Location Input Modal */}
      {showCaptionInput && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end">
          <div className="w-full bg-zinc-900 rounded-t-3xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Detalles del momento</h3>
              <button
                onClick={() => setShowCaptionInput(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Caption input */}
            <div className="relative">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Escribe algo sobre este momento..."
                maxLength={500}
                rows={3}
                className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                autoFocus
              />
              <span className="absolute bottom-2 right-3 text-white/30 text-xs">
                {caption.length}/500
              </span>
            </div>

            {/* Location input */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Añadir ubicación"
                maxLength={100}
                className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Done button */}
            <button
              onClick={() => setShowCaptionInput(false)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default MomentCreationPage;
