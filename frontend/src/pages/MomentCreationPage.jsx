import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, Image as ImageIcon, MapPin, Heart, Send, Sparkles, RotateCcw } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { useTikTok } from '../contexts/TikTokContext';
import config from '../config/config';

const MomentCreationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const { enterTikTokMode, exitTikTokMode } = useTikTok();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // States
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [filter, setFilter] = useState('none');

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
    document.body.style.overflow = 'hidden';
    
    return () => {
      exitTikTokMode();
      document.body.style.overflow = 'auto';
    };
  }, [enterTikTokMode, exitTikTokMode]);

  // Handle image selection
  const handleImageSelect = (e) => {
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

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
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
    setFilter('none');
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
      formData.append('image', selectedImage);
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

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h1 className="text-white font-semibold text-lg">Nuevo Momento</h1>
        </div>
        <button
          onClick={handlePublish}
          disabled={!selectedImage || isPublishing}
          className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
            selectedImage && !isPublishing
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-white/20 text-white/50 cursor-not-allowed'
          }`}
        >
          {isPublishing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!imagePreview ? (
          // Image Selection View
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                <Camera className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Captura tu momento</h2>
              <p className="text-white/60 text-sm max-w-xs">
                Guarda esos instantes especiales que no quieres olvidar y compártelos con tus seguidores
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
          // Image Preview & Edit View
          <div className="flex-1 flex flex-col">
            {/* Image Preview */}
            <div className="relative flex-1 flex items-center justify-center bg-black p-4">
              <div className="relative w-full max-w-md aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={imagePreview}
                  alt="Momento"
                  className={`w-full h-full object-cover ${filters.find(f => f.id === filter)?.class || ''}`}
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Caption preview */}
                {caption && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white text-sm font-medium drop-shadow-lg line-clamp-3">
                      {caption}
                    </p>
                  </div>
                )}

                {/* Location badge */}
                {location && (
                  <div className="absolute top-4 left-4 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <MapPin className="w-3 h-3 text-white" />
                    <span className="text-white text-xs">{location}</span>
                  </div>
                )}

                {/* Reset button */}
                <button
                  onClick={handleReset}
                  className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
                >
                  <RotateCcw className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 border-t border-white/10">
              <p className="text-white/60 text-xs mb-3 text-center">Filtros</p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                      filter === f.id ? 'bg-amber-500/30 ring-2 ring-amber-500' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg overflow-hidden ${f.class}`}>
                      <img
                        src={imagePreview}
                        alt={f.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className={`text-xs ${filter === f.id ? 'text-amber-400' : 'text-white/70'}`}>
                      {f.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Caption & Location */}
            <div className="p-4 space-y-3 border-t border-white/10">
              {/* Caption input */}
              <div className="relative">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escribe algo sobre este momento..."
                  maxLength={500}
                  rows={2}
                  className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MomentCreationPage;
