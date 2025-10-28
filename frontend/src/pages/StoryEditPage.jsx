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
  X,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkle
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
  const [isTextMode, setIsTextMode] = useState(false);
  const [currentTextStyle, setCurrentTextStyle] = useState('classic');
  const [currentTextColor, setCurrentTextColor] = useState('#ffffff');
  const [currentTextSize, setCurrentTextSize] = useState(36);
  const [currentTextAlign, setCurrentTextAlign] = useState('center');
  const [currentTextBg, setCurrentTextBg] = useState('none');
  const [currentTextEffect, setCurrentTextEffect] = useState('none');
  const [editingTextIndex, setEditingTextIndex] = useState(null);
  const [showGifEmojiPicker, setShowGifEmojiPicker] = useState(false);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showAlignPicker, setShowAlignPicker] = useState(false);
  const [showEffectPicker, setShowEffectPicker] = useState(false);

  // Estados para zoom y pan (pinch-to-zoom estilo Instagram)
  const [scale, setScale] = useState(1);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [lastPanX, setLastPanX] = useState(0);
  const [lastPanY, setLastPanY] = useState(0);

  // Estilos de texto disponibles - 10+ fuentes variadas
  const textStyles = [
    { id: 'classic', name: 'Classic', font: 'font-sans' },
    { id: 'bold', name: 'Bold', font: 'font-black' },
    { id: 'typewriter', name: 'Typewriter', font: 'font-mono' },
    { id: 'neon', name: 'Neon', font: 'font-bold' },
    { id: 'strong', name: 'Strong', font: 'font-extrabold' },
    { id: 'serif', name: 'Serif', font: 'font-serif' },
    { id: 'script', name: 'Script', font: 'font-cursive', style: { fontFamily: 'cursive' } },
    { id: 'modern', name: 'Modern', font: 'font-sans', style: { fontFamily: 'system-ui' } },
    { id: 'elegant', name: 'Elegant', font: 'font-serif', style: { fontFamily: 'Georgia, serif' } },
    { id: 'playful', name: 'Playful', font: 'font-sans', style: { fontFamily: 'Comic Sans MS, cursive' } },
    { id: 'tech', name: 'Tech', font: 'font-mono', style: { fontFamily: 'Courier New, monospace' } },
    { id: 'display', name: 'Display', font: 'font-bold', style: { fontFamily: 'Impact, sans-serif' } },
  ];

  // Efectos de texto disponibles
  const textEffects = [
    { id: 'none', name: 'Sin efecto', style: {} },
    { id: 'shadow', name: 'Sombra', style: { textShadow: '2px 2px 4px rgba(0,0,0,0.8)' } },
    { id: 'glow', name: 'Resplandor', style: { textShadow: '0 0 10px currentColor, 0 0 20px currentColor' } },
    { id: 'outline', name: 'Contorno', style: { 
      textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
      WebkitTextStroke: '1px black'
    } },
    { id: 'double', name: 'Doble', style: { textShadow: '3px 3px 0 rgba(0,0,0,0.3)' } },
    { id: 'neon-glow', name: 'Neón', style: { 
      textShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor, 0 0 20px currentColor' 
    } },
  ];

  // Opciones de fondo de texto
  const textBackgrounds = [
    { id: 'none', name: 'Sin fondo', style: {} },
    { id: 'solid', name: 'Sólido', style: { backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '4px' } },
    { id: 'semi', name: 'Semi', style: { backgroundColor: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: '4px' } },
    { id: 'gradient', name: 'Degradado', style: { 
      background: 'linear-gradient(90deg, rgba(147,51,234,0.8) 0%, rgba(219,39,119,0.8) 100%)',
      padding: '4px 12px',
      borderRadius: '4px'
    } },
  ];

  // Handler para activar modo texto - Crea texto inmediatamente en el centro
  const handleTextMode = () => {
    if (!isTextMode) {
      // Activar modo texto y crear nuevo texto en el centro
      const newText = {
        content: '',
        x: 50,
        y: 50,
        color: currentTextColor,
        style: currentTextStyle,
        size: currentTextSize,
        align: currentTextAlign,
        bg: currentTextBg,
        effect: currentTextEffect,
        isEditing: true
      };
      
      setTextOverlays([...textOverlays, newText]);
      setEditingTextIndex(textOverlays.length);
      setIsTextMode(true);
    } else {
      // Desactivar modo texto
      setIsTextMode(false);
      setEditingTextIndex(null);
    }
  };

  // Handler para añadir texto al tocar la pantalla (opcional, para añadir más textos)
  const handleScreenTap = (e) => {
    if (!isTextMode) return;
    if (editingTextIndex !== null) return; // No crear nuevo si ya hay uno editando
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newText = {
      content: '',
      x,
      y,
      color: currentTextColor,
      style: currentTextStyle,
      size: currentTextSize,
      align: currentTextAlign,
      bg: currentTextBg,
      effect: currentTextEffect,
      isEditing: true
    };
    
    setTextOverlays([...textOverlays, newText]);
    setEditingTextIndex(textOverlays.length);
  };

  // Handler para actualizar texto
  const handleTextChange = (index, newContent) => {
    const updated = [...textOverlays];
    updated[index].content = newContent;
    setTextOverlays(updated);
  };
  
  // Handler para cambiar estilo del texto actual
  const handleStyleChange = (newStyle) => {
    setCurrentTextStyle(newStyle);
    if (editingTextIndex !== null) {
      const updated = [...textOverlays];
      updated[editingTextIndex].style = newStyle;
      setTextOverlays(updated);
    }
  };
  
  // Handler para cambiar color del texto actual
  const handleColorChange = (newColor) => {
    setCurrentTextColor(newColor);
    if (editingTextIndex !== null) {
      const updated = [...textOverlays];
      updated[editingTextIndex].color = newColor;
      setTextOverlays(updated);
    }
  };

  // Handler para cambiar tamaño del texto
  const handleSizeChange = (newSize) => {
    setCurrentTextSize(newSize);
    if (editingTextIndex !== null) {
      const updated = [...textOverlays];
      updated[editingTextIndex].size = newSize;
      setTextOverlays(updated);
    }
  };

  // Handler para cambiar alineación del texto
  const handleAlignChange = (newAlign) => {
    setCurrentTextAlign(newAlign);
    if (editingTextIndex !== null) {
      const updated = [...textOverlays];
      updated[editingTextIndex].align = newAlign;
      setTextOverlays(updated);
    }
  };

  // Handler para cambiar fondo del texto
  const handleBgChange = (newBg) => {
    setCurrentTextBg(newBg);
    if (editingTextIndex !== null) {
      const updated = [...textOverlays];
      updated[editingTextIndex].bg = newBg;
      setTextOverlays(updated);
    }
  };

  // Handler para cambiar efecto del texto
  const handleEffectChange = (newEffect) => {
    setCurrentTextEffect(newEffect);
    if (editingTextIndex !== null) {
      const updated = [...textOverlays];
      updated[editingTextIndex].effect = newEffect;
      setTextOverlays(updated);
    }
  };

  // Handler para finalizar edición de texto
  const handleFinishEditing = (index) => {
    const updated = [...textOverlays];
    if (updated[index].content.trim() === '') {
      // Eliminar si está vacío
      updated.splice(index, 1);
    } else {
      updated[index].isEditing = false;
    }
    setTextOverlays(updated);
    setEditingTextIndex(null);
    setIsTextMode(false);
  };

  // Handler para eliminar texto
  const handleDeleteText = (index) => {
    const updated = [...textOverlays];
    updated.splice(index, 1);
    setTextOverlays(updated);
  };
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
      {/* Header con botón de volver y botón Listo */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-3 px-4">
        <div className="flex items-start justify-between">
          {/* Botón volver a la izquierda */}
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          
          {/* Botón Listo - Solo visible cuando se está editando texto */}
          {editingTextIndex !== null && (
            <button
              onClick={() => handleFinishEditing(editingTextIndex)}
              className="px-4 py-2 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-all"
            >
              Listo
            </button>
          )}
        </div>
      </div>

      {/* Área de contenido central con imagen */}
      {mediaPreview ? (
        /* Vista previa del contenido con bordes curvos arriba y abajo */
        <div className="absolute top-0 left-0 right-0 bottom-32">
          {/* Barra lateral izquierda - Control de tamaño del texto */}
          {isTextMode && editingTextIndex !== null && (
            <div className="absolute left-4 top-1/4 bottom-1/4 z-40 flex flex-col items-center">
              <div className="bg-black/60 backdrop-blur-sm rounded-full p-2 flex flex-col items-center gap-2">
                {/* Slider vertical para tamaño */}
                <div className="flex flex-col-reverse items-center h-48 relative">
                  <input
                    type="range"
                    min="16"
                    max="72"
                    value={currentTextSize}
                    onChange={(e) => handleSizeChange(Number(e.target.value))}
                    className="slider-vertical w-48 h-1"
                    style={{
                      writingMode: 'bt-lr',
                      WebkitAppearance: 'slider-vertical',
                      width: '4px',
                      height: '180px',
                      cursor: 'pointer'
                    }}
                  />
                  <span className="text-white text-xs font-bold mb-2">{currentTextSize}</span>
                </div>
                <span className="text-white text-xs font-semibold mt-1">Tamaño</span>
              </div>
            </div>
          )}

          {/* Barra de herramientas de texto - Solo visible en modo texto */}
          {isTextMode && editingTextIndex !== null && (
            <div className="absolute top-20 left-0 right-0 z-40 px-4">
              <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-3 space-y-3">
                {/* Fila 1: Fuente, Color, Fondo, Efectos, Alineación */}
                <div className="flex gap-2 justify-center items-center">
                  {/* Botón Aa - Selector de fuentes */}
                  <button
                    onClick={() => setShowFontPicker(!showFontPicker)}
                    className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-lg transition-all"
                    title="Cambiar fuente"
                  >
                    Aa
                  </button>

                  {/* Botón rueda de color */}
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-10 h-10 rounded-full border-2 border-white hover:scale-110 transition-all"
                    style={{ 
                      background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
                    }}
                    title="Cambiar color"
                  />

                  {/* Botón //A - Fondo de texto */}
                  <button
                    onClick={() => {
                      const nextBg = currentTextBg === 'none' ? 'solid' : currentTextBg === 'solid' ? 'semi' : currentTextBg === 'semi' ? 'gradient' : 'none';
                      handleBgChange(nextBg);
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold transition-all"
                    title="Cambiar fondo"
                  >
                    <span className="text-sm">//A</span>
                  </button>

                  {/* Botón A con puntos - Efectos */}
                  <button
                    onClick={() => setShowEffectPicker(!showEffectPicker)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
                    title="Efectos de texto"
                  >
                    <Sparkle className="w-5 h-5" />
                  </button>

                  {/* Botón tres líneas - Alineación */}
                  <button
                    onClick={() => setShowAlignPicker(!showAlignPicker)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
                    title="Alinear texto"
                  >
                    {currentTextAlign === 'left' && <AlignLeft className="w-5 h-5" />}
                    {currentTextAlign === 'center' && <AlignCenter className="w-5 h-5" />}
                    {currentTextAlign === 'right' && <AlignRight className="w-5 h-5" />}
                  </button>
                </div>

                {/* Panel de fuentes expandido */}
                {showFontPicker && (
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {textStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          handleStyleChange(style.id);
                          setShowFontPicker(false);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                          currentTextStyle === style.id
                            ? 'bg-white text-black'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                        style={style.style}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Panel de colores expandido - Selector completo */}
                {showColorPicker && (
                  <div className="space-y-2">
                    {/* Selector de color HTML5 nativo */}
                    <div className="flex items-center justify-center gap-3">
                      <input
                        type="color"
                        value={currentTextColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="w-16 h-16 rounded-full cursor-pointer border-2 border-white"
                        title="Selector de color personalizado"
                      />
                      <div className="text-white text-sm">
                        <p className="font-semibold">Color actual:</p>
                        <p className="font-mono">{currentTextColor}</p>
                      </div>
                    </div>
                    {/* Colores predefinidos */}
                    <div className="grid grid-cols-8 gap-2">
                      {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', 
                        '#ffa500', '#ff69b4', '#8b4513', '#9370db', '#20b2aa', '#ff6347', '#4169e1', '#32cd32'].map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            handleColorChange(color);
                          }}
                          className={`w-10 h-10 rounded-full border-2 ${
                            currentTextColor === color ? 'border-white scale-110 ring-2 ring-white' : 'border-gray-400'
                          } transition-all`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Panel de efectos expandido */}
                {showEffectPicker && (
                  <div className="grid grid-cols-3 gap-2">
                    {textEffects.map((effect) => (
                      <button
                        key={effect.id}
                        onClick={() => {
                          handleEffectChange(effect.id);
                          setShowEffectPicker(false);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                          currentTextEffect === effect.id
                            ? 'bg-white text-black'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                        style={effect.style}
                      >
                        {effect.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Panel de alineación expandido */}
                {showAlignPicker && (
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        handleAlignChange('left');
                        setShowAlignPicker(false);
                      }}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        currentTextAlign === 'left'
                          ? 'bg-white text-black'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <AlignLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        handleAlignChange('center');
                        setShowAlignPicker(false);
                      }}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        currentTextAlign === 'center'
                          ? 'bg-white text-black'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <AlignCenter className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        handleAlignChange('right');
                        setShowAlignPicker(false);
                      }}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        currentTextAlign === 'right'
                          ? 'bg-white text-black'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <AlignRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div 
            className="relative w-full h-full bg-black rounded-3xl overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleScreenTap}
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

            {/* Overlays de texto - Ahora editables inline con todos los estilos */}
            {textOverlays.map((text, index) => {
              const styleConfig = textStyles.find(s => s.id === text.style) || textStyles[0];
              const effectConfig = textEffects.find(e => e.id === text.effect) || textEffects[0];
              const bgConfig = textBackgrounds.find(b => b.id === text.bg) || textBackgrounds[0];
              
              return (
                <div
                  key={index}
                  className="absolute z-20"
                  style={{
                    top: `${text.y}%`,
                    left: `${text.x}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {text.isEditing || editingTextIndex === index ? (
                    <div className="flex flex-col items-center">
                      <textarea
                        value={text.content}
                        onChange={(e) => handleTextChange(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleFinishEditing(index);
                          }
                        }}
                        autoFocus
                        placeholder="Escribe aquí..."
                        rows={1}
                        className={`bg-transparent border-b-2 border-white outline-none resize-none ${styleConfig.font}`}
                        style={{ 
                          color: text.color,
                          fontSize: `${text.size || 36}px`,
                          textAlign: text.align || 'center',
                          minWidth: '200px',
                          maxWidth: '350px',
                          caretColor: text.color,
                          ...styleConfig.style,
                          ...effectConfig.style,
                          ...bgConfig.style
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTextIndex(index);
                        setIsTextMode(true);
                        // Cargar configuración del texto actual
                        setCurrentTextColor(text.color);
                        setCurrentTextStyle(text.style);
                        setCurrentTextSize(text.size || 36);
                        setCurrentTextAlign(text.align || 'center');
                        setCurrentTextBg(text.bg || 'none');
                        setCurrentTextEffect(text.effect || 'none');
                      }}
                      className={`cursor-pointer ${styleConfig.font}`}
                      style={{
                        color: text.color,
                        fontSize: `${text.size || 36}px`,
                        textAlign: text.align || 'center',
                        ...styleConfig.style,
                        ...effectConfig.style,
                        ...bgConfig.style
                      }}
                    >
                      {text.content}
                    </div>
                  )}
                </div>
              );
            })}

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
            
            {/* Indicador de modo texto - Solo si no hay texto editándose */}
            {isTextMode && editingTextIndex === null && (
              <div className="absolute inset-0 pointer-events-none border-4 border-dashed border-white/50 rounded-3xl z-10">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-full">
                  <p className="text-white text-sm font-medium">Toca para añadir más texto</p>
                </div>
              </div>
            )}
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
              onClick={handleTextMode}
              className={`w-12 h-12 rounded-full backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-all ${
                isTextMode ? 'bg-white' : 'bg-black/60'
              }`}
              title="Añadir texto"
            >
              <span className={`font-bold text-xl ${isTextMode ? 'text-black' : 'text-white'}`}>Aa</span>
            </button>

            {/* GIFs y Emojis */}
            <button
              onClick={() => setShowGifEmojiPicker(!showGifEmojiPicker)}
              className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-all"
              title="GIFs y Emojis"
            >
              <Smile className="w-5 h-5 text-white" />
            </button>

            {/* Filtros */}
            <button
              onClick={() => setShowFilterPicker(!showFilterPicker)}
              className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-all"
              title="Filtros"
            >
              <Sparkles className="w-5 h-5 text-white" />
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
      {showGifEmojiPicker && (
        <GifEmojiPickerModal
          onClose={() => setShowGifEmojiPicker(false)}
          onSelect={(emoji) => {
            setStickers([...stickers, { emoji, x: 50, y: 50 }]);
            setShowGifEmojiPicker(false);
          }}
        />
      )}

      {showFilterPicker && (
        <FilterPickerModal
          onClose={() => setShowFilterPicker(false)}
          onSelect={(filter) => {
            toast({
              title: "Filtro aplicado",
              description: `Filtro ${filter} seleccionado`,
            });
            setShowFilterPicker(false);
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

// Modal de GIFs y emojis
const GifEmojiPickerModal = ({ onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState('emojis');
  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤩', '😭', '😱', '🔥', '💯', '❤️', '💕', '💪', '👏', '🙌', '✨', '⭐', '🎉', '🎊', '🎈'];
  const gifs = ['🎸', '🎵', '🎤', '🎧', '🎬', '📸', '🌟', '💫', '✨', '🌈', '🦄', '🐶', '🐱', '🍕', '🍔', '☕', '🎮', '⚽', '🏀', '🎯'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">GIFs y Emojis</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('emojis')}
            className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${
              activeTab === 'emojis' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Emojis
          </button>
          <button
            onClick={() => setActiveTab('gifs')}
            className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${
              activeTab === 'gifs' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            GIFs
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {(activeTab === 'emojis' ? emojis : gifs).map((item, index) => (
            <button
              key={index}
              onClick={() => onSelect(item)}
              className="text-4xl hover:scale-125 transition-transform p-2"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Modal de filtros
const FilterPickerModal = ({ onClose, onSelect }) => {
  const filters = [
    { id: 'normal', name: 'Normal', emoji: '📷' },
    { id: 'vintage', name: 'Vintage', emoji: '📼' },
    { id: 'bw', name: 'Blanco y Negro', emoji: '⚫' },
    { id: 'sepia', name: 'Sepia', emoji: '🟤' },
    { id: 'vivid', name: 'Vívido', emoji: '🌈' },
    { id: 'warm', name: 'Cálido', emoji: '🔥' },
    { id: 'cool', name: 'Frío', emoji: '❄️' },
    { id: 'dramatic', name: 'Dramático', emoji: '🎭' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Filtros</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onSelect(filter.name)}
              className="p-4 rounded-2xl bg-gray-100 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all text-center"
            >
              <div className="text-3xl mb-2">{filter.emoji}</div>
              <div className="font-medium text-sm">{filter.name}</div>
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
