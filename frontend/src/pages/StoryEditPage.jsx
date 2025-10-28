import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Smile, 
  Sparkles, 
  Music, 
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  X
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import MusicSelector from '../components/MusicSelector';

const StoryEditPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const contentRef = useRef(null);

  // Obtener datos de sessionStorage
  const storedMediaType = sessionStorage.getItem('storyMediaType');
  const storedMediaPreview = sessionStorage.getItem('storyMediaPreview');
  const storedMediaFile = sessionStorage.getItem('storyMediaFile');
  const storedFileName = sessionStorage.getItem('storyFileName');

  // Estados principales
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(storedMediaType || null); // 'image' o 'video'
  const [mediaPreview, setMediaPreview] = useState(storedMediaPreview || null);
  const [description, setDescription] = useState('');
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [textOverlays, setTextOverlays] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Estados de modales
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Estados para zoom y pan (pinch-to-zoom estilo Instagram)
  const [scale, setScale] = useState(1);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [lastPanX, setLastPanX] = useState(0);
  const [lastPanY, setLastPanY] = useState(0);

  // Manejo de archivos
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.startsWith('image') ? 'image' : 'video';
    setMediaType(fileType);
    setMediaFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaType(null);
    setMediaPreview(null);
    // Reset zoom
    setScale(1);
    setPosX(0);
    setPosY(0);
  };

  // Calcular distancia entre dos puntos táctiles
  const getDistance = (touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handler para inicio de pinch gesture
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch con dos dedos
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialDistance(distance);
      setInitialScale(scale);
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan con un dedo (solo si hay zoom aplicado)
      setLastPanX(e.touches[0].clientX);
      setLastPanY(e.touches[0].clientY);
    }
  };

  // Handler para movimiento de pinch gesture
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);
      const newScale = (distance / initialDistance) * initialScale;
      
      // Limitar escala entre 1x y 3x (estilo Instagram)
      const clampedScale = Math.min(Math.max(newScale, 1), 3);
      setScale(clampedScale);
      
      // Si volvemos a escala 1, resetear posición
      if (clampedScale === 1) {
        setPosX(0);
        setPosY(0);
      }
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan/drag cuando hay zoom - movimiento libre
      e.preventDefault();
      const deltaX = e.touches[0].clientX - lastPanX;
      const deltaY = e.touches[0].clientY - lastPanY;
      
      // Permitir movimiento libre sin límites estrictos
      setPosX(posX + deltaX);
      setPosY(posY + deltaY);
      setLastPanX(e.touches[0].clientX);
      setLastPanY(e.touches[0].clientY);
    }
  };

  // Handler para fin de gesture
  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      setInitialDistance(0);
    }
  };

  // Handler para seleccionar música
  const handleMusicSelect = (music) => {
    setSelectedMusic(music);
    setShowMusicSelector(false);
    toast({
      title: "🎵 Música agregada",
      description: `${music.title} - ${music.artist}`,
    });
  };

  // Publicar historia
  const handlePublishStory = async () => {
    if (!storedMediaFile) {
      toast({
        title: "Error",
        description: "No hay contenido para publicar",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);

    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

      // 1. Convertir base64 a Blob
      const base64Data = storedMediaFile.split(',')[1];
      const mimeType = storedMediaFile.split(',')[0].split(':')[1].split(';')[0];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Crear File con el tipo correcto
      const fileName = storedFileName || 'story.' + (mediaType === 'image' ? 'jpg' : 'mp4');
      const file = new File([blob], fileName, { type: mimeType });

      console.log('Subiendo archivo:', fileName, 'tipo:', mimeType, 'tamaño:', blob.size);

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`${backendUrl}/api/stories/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        console.error('Error en upload:', errorData);
        throw new Error(errorData.detail || 'Error al subir el archivo');
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload exitoso:', uploadData);

      // 2. Crear la historia
      const storyData = {
        media_type: uploadData.media_type,
        media_url: uploadData.media_url,
        thumbnail_url: uploadData.thumbnail_url,
        text_overlays: textOverlays,
        stickers: stickers,
        music_id: selectedMusic?.id || null,
        duration: 86400
      };

      console.log('Creando historia:', storyData);

      const createResponse = await fetch(`${backendUrl}/api/stories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storyData)
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        console.error('Error al crear historia:', errorData);
        throw new Error(errorData.detail || 'Error al crear la historia');
      }

      // Limpiar sessionStorage
      sessionStorage.removeItem('storyMediaType');
      sessionStorage.removeItem('storyMediaPreview');
      sessionStorage.removeItem('storyMediaFile');
      sessionStorage.removeItem('storyFileName');

      toast({
        title: "¡Historia publicada!",
        description: "Tu historia se ha publicado exitosamente",
      });

      setTimeout(() => {
        navigate('/feed');
      }, 1000);

    } catch (error) {
      console.error('Error al publicar historia:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo publicar la historia. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Header con botón de volver */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-3 px-4">
        <div className="flex items-start justify-start">
          {/* Botón volver a la izquierda */}
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Área de contenido central con imagen */}
      {mediaPreview ? (
        /* Vista previa del contenido con bordes curvos arriba y abajo */
        <div className="absolute top-0 left-0 right-0 bottom-32">
          <div 
            className="relative w-full h-full bg-black rounded-3xl overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            {/* Preview de imagen o video con zoom */}
            <div
              ref={contentRef}
              className="w-full h-full"
              style={{
                transform: `translate(${posX}px, ${posY}px) scale(${scale})`,
                transition: initialDistance === 0 && scale === 1 ? 'transform 0.3s ease-out' : 'none',
                transformOrigin: 'center center'
              }}
            >
              {mediaType === 'image' ? (
                <img
                  src={mediaPreview}
                  alt="Story preview"
                  className="w-full h-full object-cover pointer-events-none select-none"
                  draggable={false}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={mediaPreview}
                  className="w-full h-full object-cover"
                  controls={scale === 1}
                  draggable={false}
                  style={{ pointerEvents: scale > 1 ? 'none' : 'auto' }}
                />
              )}
            </div>

            {/* Overlays de texto (independientes del zoom) */}
            {textOverlays.map((text, index) => (
              <div
                key={index}
                className="absolute text-white font-bold text-2xl z-10 pointer-events-none"
                style={{
                  top: `${text.y}%`,
                  left: `${text.x}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {text.content}
              </div>
            ))}

            {/* Stickers (independientes del zoom) */}
            {stickers.map((sticker, index) => (
              <div
                key={index}
                className="absolute text-4xl z-10 pointer-events-none"
                style={{
                  top: `${sticker.y}%`,
                  left: `${sticker.x}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {sticker.emoji}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Estado inicial - sin contenido */
        <div className="absolute inset-0 flex items-center justify-center p-4 pt-24 pb-48">
          <div className="w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 text-center border-2 border-white/30">
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Añade contenido
                </h3>
                <p className="text-white/80 text-sm">
                  Sube una foto o video para comenzar tu historia
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-full transition-all flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-5 h-5" />
                  Foto
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-full transition-all flex items-center justify-center gap-2"
                >
                  <Video className="w-5 h-5" />
                  Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Área inferior - Botones de edición y botón publicar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-2 px-4 pt-12">
        <div className="max-w-md mx-auto space-y-3">
          {/* Botones de edición en horizontal */}
          <div className="flex items-center justify-center gap-4 mb-3">
            {/* Texto "Aa" */}
            <button
              onClick={() => setShowTextEditor(!showTextEditor)}
              className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-all"
              title="Añadir texto"
            >
              <span className="text-white font-bold text-xl">Aa</span>
            </button>

            {/* Emoji */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-all"
              title="Añadir emoji"
            >
              <Smile className="w-5 h-5 text-white" />
            </button>

            {/* Stickers */}
            <button
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-all"
              title="Añadir sticker"
            >
              <Sticker className="w-5 h-5 text-white" />
            </button>

            {/* Música */}
            <button
              onClick={() => setShowMusicSelector(true)}
              className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-all"
              title="Añadir música"
            >
              <Music className="w-5 h-5 text-white" />
            </button>

            {/* Más opciones */}
            <button 
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-all"
              title="Más opciones"
            >
              <MoreHorizontal className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Botón de "Tu historia" estilo Instagram */}
          <div className="flex justify-end">
            <button
              onClick={handlePublishStory}
              disabled={!storedMediaFile || isPublishing}
              className="flex items-center gap-2 bg-gray-900/80 hover:bg-gray-800/80 disabled:bg-gray-900/40 disabled:cursor-not-allowed backdrop-blur-sm rounded-full px-3 py-1.5 transition-all"
            >
              {/* Avatar circular */}
              <div className="relative w-8 h-8 flex-shrink-0">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover border border-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center border border-white">
                    <span className="text-white text-sm font-bold">
                      {user?.username?.[0]?.toUpperCase() || 'T'}
                    </span>
                  </div>
                )}
                {isPublishing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              {/* Texto */}
              <span className="text-white font-medium text-sm pr-1">
                Tu historia
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modales y pickers */}
      {showTextEditor && (
        <TextEditorModal
          onClose={() => setShowTextEditor(false)}
          onAdd={(text) => {
            setTextOverlays([...textOverlays, { content: text, x: 50, y: 50 }]);
            setShowTextEditor(false);
          }}
        />
      )}

      {showEmojiPicker && (
        <EmojiPickerModal
          onClose={() => setShowEmojiPicker(false)}
          onSelect={(emoji) => {
            setStickers([...stickers, { emoji, x: 50, y: 50 }]);
            setShowEmojiPicker(false);
          }}
        />
      )}

      {showStickerPicker && (
        <StickerPickerModal
          onClose={() => setShowStickerPicker(false)}
          onSelect={(sticker) => {
            setStickers([...stickers, { emoji: sticker, x: 50, y: 50 }]);
            setShowStickerPicker(false);
          }}
        />
      )}

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
                pollTitle=""
              />
            </div>
          </div>
        </div>
      )}

      {showMoreOptions && (
        <MoreOptionsModal
          onClose={() => setShowMoreOptions(false)}
          onReset={() => {
            setScale(1);
            setPosX(0);
            setPosY(0);
            setTextOverlays([]);
            setStickers([]);
            setSelectedMusic(null);
            setShowMoreOptions(false);
            toast({
              title: "Reiniciado",
              description: "Todos los elementos han sido eliminados"
            });
          }}
        />
      )}
    </div>
  );
};

// Modal de editor de texto
const TextEditorModal = ({ onClose, onAdd }) => {
  const [text, setText] = useState('');
  const [color, setColor] = useState('#ffffff');

  const colors = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Añadir texto</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe tu texto aquí..."
          className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 resize-none"
          style={{ color }}
        />

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Color del texto</p>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-full border-2 ${color === c ? 'border-purple-500 scale-110' : 'border-gray-200'} transition-all`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => text.trim() && onAdd(text)}
          disabled={!text.trim()}
          className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 rounded-full transition-all"
        >
          Añadir texto
        </button>
      </div>
    </div>
  );
};

// Modal de emojis
const EmojiPickerModal = ({ onClose, onSelect }) => {
  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤩', '😭', '😱', '🔥', '💯', '❤️', '💕', '💪', '👏', '🙌', '✨', '⭐', '🎉', '🎊', '🎈'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Emojis</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {emojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => onSelect(emoji)}
              className="text-4xl hover:scale-125 transition-transform p-2"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Modal de stickers
const StickerPickerModal = ({ onClose, onSelect }) => {
  const stickers = ['🎸', '🎵', '🎤', '🎧', '🎬', '📸', '🌟', '💫', '✨', '🌈', '🦄', '🐶', '🐱', '🍕', '🍔', '☕', '🎮', '⚽', '🏀', '🎯'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Stickers</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {stickers.map((sticker, index) => (
            <button
              key={index}
              onClick={() => onSelect(sticker)}
              className="text-4xl hover:scale-125 transition-transform p-2"
            >
              {sticker}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Modal de más opciones
const MoreOptionsModal = ({ onClose, onReset }) => {
  const options = [
    { 
      id: 'reset',
      name: 'Reiniciar todo',
      description: 'Eliminar texto, stickers y música',
      icon: '🔄',
      action: onReset
    },
    {
      id: 'save_draft',
      name: 'Guardar borrador',
      description: 'Guardar para continuar después',
      icon: '💾',
      action: () => {
        // Funcionalidad futura
        onClose();
      }
    },
    {
      id: 'settings',
      name: 'Configuración',
      description: 'Ajustes de privacidad y duración',
      icon: '⚙️',
      action: () => {
        // Funcionalidad futura
        onClose();
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-white rounded-t-3xl p-6 w-full max-w-md animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Más opciones</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              className="w-full text-left p-4 rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-3"
            >
              <div className="text-3xl">
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{option.name}</p>
                <p className="text-sm text-gray-500">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryEditPage;
