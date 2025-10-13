import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Camera, 
  Video, 
  Type, 
  Send,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import storyService from '../services/storyService';

const StoryCreationPage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuth();
  
  const [storyType, setStoryType] = useState(null); // 'image', 'video', 'text'
  const [contentUrl, setContentUrl] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#8B5CF6');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontStyle, setFontStyle] = useState('default');
  const [privacy, setPrivacy] = useState('public');
  const [duration, setDuration] = useState(15);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Color options
  const backgroundColors = [
    { color: '#8B5CF6', name: 'Morado' },
    { color: '#EC4899', name: 'Rosa' },
    { color: '#F59E0B', name: 'Naranja' },
    { color: '#10B981', name: 'Verde' },
    { color: '#3B82F6', name: 'Azul' },
    { color: '#EF4444', name: 'Rojo' },
    { color: '#000000', name: 'Negro' },
    { color: '#FFFFFF', name: 'Blanco' },
    { color: '#6B7280', name: 'Gris' },
  ];

  const textColors = [
    '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

  const fontStyles = [
    { value: 'default', label: 'Default', style: 'font-sans' },
    { value: 'bold', label: 'Bold', style: 'font-bold' },
    { value: 'script', label: 'Script', style: 'font-serif italic' },
    { value: 'mono', label: 'Mono', style: 'font-mono' }
  ];

  const handleClose = () => {
    navigate(-1);
  };

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande. Máximo 50MB.');
      return;
    }

    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];

    if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
      toast.error('Tipo de archivo no válido. Use imágenes o videos.');
      return;
    }

    setIsUploading(true);
    setSelectedFile(file);

    try {
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setContentUrl(e.target.result);
        if (validImageTypes.includes(file.type)) {
          setStoryType('image');
        } else {
          setStoryType('video');
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error('Error al cargar el archivo');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Error al procesar el archivo');
      setIsUploading(false);
    }
  }, []);

  const handleCreateStory = async () => {
    if (!contentUrl && !textContent.trim()) {
      toast.error('Agrega contenido a tu historia');
      return;
    }

    setIsCreating(true);

    try {
      const storyData = storyService.createStoryData({
        contentUrl: storyType !== 'text' ? contentUrl : null,
        textContent: textContent.trim() || null,
        storyType: storyType || 'text',
        backgroundColor: storyType === 'text' ? backgroundColor : null,
        textColor: storyType === 'text' ? textColor : null,
        fontStyle: storyType === 'text' ? fontStyle : null,
        privacy,
        duration,
      });

      await storyService.createStory(storyData);
      
      toast.success('¡Historia creada exitosamente!', {
        duration: 3000,
      });

      // Navigate back to feed or profile
      navigate('/feed');
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Error al crear la historia. Inténtalo de nuevo.', {
        duration: 4000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleTextStoryCreate = () => {
    setStoryType('text');
    setContentUrl(null);
  };

  const triggerFileInput = (type) => {
    setStoryType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' 
        ? 'image/jpeg,image/png,image/gif,image/webp'
        : 'video/mp4,video/webm,video/ogg';
      fileInputRef.current.click();
    }
  };

  const getFontStyleClass = () => {
    const style = fontStyles.find(f => f.value === fontStyle);
    return style ? style.style : 'font-sans';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
        >
          <X size={24} className="text-white" />
        </button>
        
        <h1 className="text-white text-xl font-bold">Crear Historia</h1>
        
        <button
          onClick={handleCreateStory}
          disabled={isCreating || (!contentUrl && !textContent.trim())}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 
                   disabled:cursor-not-allowed text-white rounded-full font-semibold 
                   transition-colors flex items-center gap-2"
        >
          {isCreating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Send size={18} />
              Publicar
            </>
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="h-full flex items-center justify-center">
        {!storyType ? (
          /* Type Selection */
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 p-8"
          >
            <h2 className="text-white text-2xl font-bold mb-4">¿Qué tipo de historia quieres crear?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
              {/* Image Story */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => triggerFileInput('image')}
                className="flex flex-col items-center gap-4 p-8 bg-gradient-to-br 
                         from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 
                         rounded-2xl text-white transition-all shadow-2xl"
              >
                <div className="p-4 bg-white/20 rounded-full">
                  <Camera size={48} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Foto</h3>
                  <p className="text-sm opacity-90">Comparte una imagen</p>
                </div>
              </motion.button>

              {/* Video Story */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => triggerFileInput('video')}
                className="flex flex-col items-center gap-4 p-8 bg-gradient-to-br 
                         from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 
                         rounded-2xl text-white transition-all shadow-2xl"
              >
                <div className="p-4 bg-white/20 rounded-full">
                  <Video size={48} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Video</h3>
                  <p className="text-sm opacity-90">Graba o sube un video</p>
                </div>
              </motion.button>

              {/* Text Story */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleTextStoryCreate}
                className="flex flex-col items-center gap-4 p-8 bg-gradient-to-br 
                         from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
                         rounded-2xl text-white transition-all shadow-2xl"
              >
                <div className="p-4 bg-white/20 rounded-full">
                  <Type size={48} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Texto</h3>
                  <p className="text-sm opacity-90">Escribe un mensaje</p>
                </div>
              </motion.button>
            </div>

            {isUploading && (
              <div className="mt-8 flex items-center gap-3 text-white">
                <Loader2 size={24} className="animate-spin" />
                <span>Cargando archivo...</span>
              </div>
            )}
          </motion.div>
        ) : (
          /* Content Editor */
          <div className="w-full h-full max-w-md mx-auto flex flex-col">
            {/* Preview Area */}
            <div className="flex-1 relative flex items-center justify-center">
              {storyType === 'text' ? (
                /* Text Story Editor */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full flex items-center justify-center px-8"
                  style={{ backgroundColor }}
                >
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Escribe tu historia aquí..."
                    className={`w-full h-auto max-h-[60vh] bg-transparent border-none outline-none 
                             text-center resize-none text-3xl ${getFontStyleClass()}`}
                    style={{ color: textColor }}
                    maxLength={500}
                  />
                </motion.div>
              ) : storyType === 'image' && contentUrl ? (
                /* Image Preview */
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={contentUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : storyType === 'video' && contentUrl ? (
                /* Video Preview */
                <motion.video
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  ref={videoRef}
                  src={contentUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : null}
            </div>

            {/* Controls */}
            {storyType === 'text' && (
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="max-w-md mx-auto space-y-4">
                  {/* Background Colors */}
                  <div>
                    <p className="text-white text-sm mb-2 font-semibold">Color de fondo</p>
                    <div className="flex flex-wrap gap-3">
                      {backgroundColors.map(({ color, name }) => (
                        <button
                          key={color}
                          onClick={() => setBackgroundColor(color)}
                          className={`w-12 h-12 rounded-full border-4 transition-all ${
                            backgroundColor === color 
                              ? 'border-white scale-110' 
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Text Colors */}
                  <div>
                    <p className="text-white text-sm mb-2 font-semibold">Color de texto</p>
                    <div className="flex flex-wrap gap-3">
                      {textColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setTextColor(color)}
                          className={`w-10 h-10 rounded-full border-3 transition-all ${
                            textColor === color 
                              ? 'border-white scale-110' 
                              : 'border-gray-600 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Font Styles */}
                  <div>
                    <p className="text-white text-sm mb-2 font-semibold">Estilo de fuente</p>
                    <div className="flex flex-wrap gap-2">
                      {fontStyles.map((font) => (
                        <button
                          key={font.value}
                          onClick={() => setFontStyle(font.value)}
                          className={`px-4 py-2 rounded-lg transition-all ${
                            fontStyle === font.value
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          } ${font.style}`}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*"
      />
    </div>
  );
};

export default StoryCreationPage;
