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
  Sparkle,
  Palette
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
    { id: 'white', name: 'Fondo blanco', style: { backgroundColor: 'rgba(255,255,255,0.95)', color: '#000000', padding: '4px 12px', borderRadius: '4px' } },
    { id: 'black', name: 'Fondo negro', style: { backgroundColor: 'rgba(0,0,0,0.85)', color: '#ffffff', padding: '4px 12px', borderRadius: '4px' } },
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
      {/* Header con botón de volver, controles de texto y botón Listo */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-3 px-4">
        <div className="flex items-center justify-center">
          {/* Botón volver a la izquierda - Solo visible cuando NO se está editando texto */}
          {!(isTextMode && editingTextIndex !== null) && (
            <button
              onClick={() => navigate(-1)}
              className="absolute left-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Botones de control de texto - Centrados cuando se está editando texto */}
          {isTextMode && editingTextIndex !== null && (
            <div className="flex gap-2 items-center">
              {/* Botón Aa - Selector de fuentes */}
              <button
                onClick={() => {
                  setShowFontPicker(!showFontPicker);
                  setShowColorPicker(false);
                  setShowAlignPicker(false);
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-base transition-all ${
                  showFontPicker ? 'bg-white text-black' : 'bg-white/20 backdrop-blur-sm text-white'
                }`}
              >
                Aa
              </button>

              {/* Botón paleta de color - Mejorado y adaptado al círculo */}
              <button
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowFontPicker(false);
                  setShowAlignPicker(false);
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all overflow-hidden ${
                  showColorPicker ? 'bg-white scale-110' : 'bg-white/20 backdrop-blur-sm'
                }`}
              >
                <svg width="36" height="36" viewBox="0 0 36 36" className="absolute">
                  {/* Fondo del círculo con degradado cónico */}
                  <defs>
                    <radialGradient id="colorWheel">
                      <stop offset="0%" stopColor="white" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  {/* Segmentos de color formando la rueda */}
                  <circle cx="18" cy="18" r="18" fill="url(#colorWheel)" opacity="0"/>
                  {/* Círculo rojo */}
                  <circle cx="18" cy="5" r="3" fill="#FF0000"/>
                  {/* Círculo naranja */}
                  <circle cx="27" cy="9" r="3" fill="#FF8800"/>
                  {/* Círculo amarillo */}
                  <circle cx="31" cy="18" r="3" fill="#FFFF00"/>
                  {/* Círculo verde lima */}
                  <circle cx="27" cy="27" r="3" fill="#00FF00"/>
                  {/* Círculo cyan */}
                  <circle cx="18" cy="31" r="3" fill="#00FFFF"/>
                  {/* Círculo azul */}
                  <circle cx="9" cy="27" r="3" fill="#0000FF"/>
                  {/* Círculo magenta */}
                  <circle cx="5" cy="18" r="3" fill="#FF00FF"/>
                  {/* Círculo rosa */}
                  <circle cx="9" cy="9" r="3" fill="#FF0088"/>
                  {/* Círculo central blanco con borde */}
                  <circle cx="18" cy="18" r="5" fill="white" stroke={showColorPicker ? '#000' : '#fff'} strokeWidth="1.5"/>
                </svg>
              </button>

              {/* Botón A con fondo - Mejorado y adaptado al círculo */}
              <button
                onClick={() => {
                  const nextBg = currentTextBg === 'none' ? 'white' : currentTextBg === 'white' ? 'black' : 'none';
                  handleBgChange(nextBg);
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all overflow-hidden ${
                  currentTextBg === 'white' ? 'bg-white' : currentTextBg === 'black' ? 'bg-black border border-white/30' : 'bg-white/20 backdrop-blur-sm'
                }`}
              >
                <svg width="36" height="36" viewBox="0 0 36 36" className="absolute">
                  {currentTextBg === 'none' && (
                    <>
                      {/* Sin fondo - Solo letra A blanca */}
                      <text x="18" y="24" 
                            fontSize="16" 
                            fontWeight="bold" 
                            textAnchor="middle" 
                            fill="#ffffff"
                            style={{ fontFamily: 'Arial, sans-serif' }}>
                        A
                      </text>
                    </>
                  )}
                  {currentTextBg === 'white' && (
                    <>
                      {/* Fondo blanco - Rectángulo blanco con letra negra */}
                      <rect x="9" y="11" width="18" height="14" rx="3" fill="#ffffff"/>
                      <text x="18" y="22" 
                            fontSize="14" 
                            fontWeight="bold" 
                            textAnchor="middle" 
                            fill="#000000"
                            style={{ fontFamily: 'Arial, sans-serif' }}>
                        A
                      </text>
                    </>
                  )}
                  {currentTextBg === 'black' && (
                    <>
                      {/* Fondo negro - Rectángulo negro con letra blanca */}
                      <rect x="9" y="11" width="18" height="14" rx="3" fill="#000000" stroke="#ffffff" strokeWidth="1"/>
                      <text x="18" y="22" 
                            fontSize="14" 
                            fontWeight="bold" 
                            textAnchor="middle" 
                            fill="#ffffff"
                            style={{ fontFamily: 'Arial, sans-serif' }}>
                        A
                      </text>
                    </>
                  )}
                </svg>
              </button>

              {/* Botón alineación - Tres líneas */}
              <button
                onClick={() => {
                  setShowAlignPicker(!showAlignPicker);
                  setShowFontPicker(false);
                  setShowColorPicker(false);
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  showAlignPicker ? 'bg-white text-black' : 'bg-white/20 backdrop-blur-sm text-white'
                }`}
              >
                {currentTextAlign === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                {currentTextAlign === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                {currentTextAlign === 'right' && <AlignRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
          
          {/* Botón Listo - Posición absoluta a la derecha */}
          {editingTextIndex !== null && (
            <button
              onClick={() => handleFinishEditing(editingTextIndex)}
              className="absolute right-4 px-4 py-2 text-white font-semibold hover:text-gray-200 transition-all"
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
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-40">
              <div className="bg-black/60 backdrop-blur-sm rounded-full p-3 flex flex-col items-center gap-3" style={{ width: '44px' }}>
                {/* Slider vertical para tamaño */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-white text-xs font-bold">{currentTextSize}</span>
                  <input
                    type="range"
                    min="16"
                    max="72"
                    value={currentTextSize}
                    onChange={(e) => handleSizeChange(Number(e.target.value))}
                    className="slider-vertical"
                    style={{
                      writingMode: 'bt-lr',
                      WebkitAppearance: 'slider-vertical',
                      width: '6px',
                      height: '200px',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paneles de selección movidos a la parte inferior, encima del teclado */}
          
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
                      <span
                        ref={(el) => {
                          if (el) {
                            el.focus();
                            // Mover cursor al final del texto
                            const range = document.createRange();
                            const sel = window.getSelection();
                            if (el.childNodes.length > 0) {
                              range.setStart(el.childNodes[0], el.textContent.length);
                              range.collapse(true);
                              sel.removeAllRanges();
                              sel.addRange(range);
                            }
                          }
                        }}
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onInput={(e) => handleTextChange(index, e.target.textContent)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleFinishEditing(index);
                          }
                        }}
                        className={`bg-transparent border-none outline-none ${styleConfig.font}`}
                        style={{ 
                          color: text.color,
                          fontSize: `${text.size || 36}px`,
                          textAlign: text.align || 'center',
                          caretColor: text.color,
                          display: 'inline-block',
                          minWidth: text.content ? 'auto' : '50px',
                          whiteSpace: 'nowrap',
                          ...styleConfig.style,
                          ...effectConfig.style,
                          ...bgConfig.style
                        }}
                      >
                        {text.content || 'Escribe aquí...'}
                      </span>
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

      {/* Área inferior - Paneles de selección encima del teclado + Botones de edición y botón publicar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-2 px-4">
        <div className="max-w-md mx-auto space-y-3">
          {/* Paneles de selección - Aparecen encima del teclado cuando se está editando texto */}
          {isTextMode && editingTextIndex !== null && (
            <div className="space-y-2 mb-3">
              {/* Panel de fuentes - Horizontal scroll */}
              {showFontPicker && (
                <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-3">
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {textStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          handleStyleChange(style.id);
                          setShowFontPicker(false);
                        }}
                        className={`px-5 py-2 rounded-full whitespace-nowrap font-semibold transition-all flex-shrink-0 ${
                          currentTextStyle === style.id
                            ? 'bg-white text-black'
                            : 'bg-white/20 backdrop-blur-sm text-white'
                        }`}
                        style={style.style}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Panel de colores - Grid compacto */}
              {showColorPicker && (
                <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-3">
                  <div className="grid grid-cols-8 gap-2 mb-3">
                    {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', 
                      '#ffa500', '#ff69b4', '#8b4513', '#9370db', '#20b2aa', '#ff6347', '#4169e1', '#32cd32'].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className={`w-9 h-9 rounded-full border-2 transition-all ${
                          currentTextColor === color ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-center">
                    <input
                      type="color"
                      value={currentTextColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Panel de alineación - 3 botones */}
              {showAlignPicker && (
                <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-3">
                  <div className="flex gap-2 justify-center">
                    {['left', 'center', 'right'].map((align) => (
                      <button
                        key={align}
                        onClick={() => {
                          handleAlignChange(align);
                          setShowAlignPicker(false);
                        }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          currentTextAlign === align
                            ? 'bg-white text-black'
                            : 'bg-white/20 backdrop-blur-sm text-white'
                        }`}
                      >
                        {align === 'left' && <AlignLeft className="w-5 h-5" />}
                        {align === 'center' && <AlignCenter className="w-5 h-5" />}
                        {align === 'right' && <AlignRight className="w-5 h-5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
