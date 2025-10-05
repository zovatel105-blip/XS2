import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, CheckCircle, Upload } from 'lucide-react';

const CircularCrop = ({ isOpen, onClose, onImageCropped, initialImage = null }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [loading, setLoading] = useState(false);

  // Configuración del crop circular
  const CANVAS_SIZE = 300;
  const CROP_SIZE = 300; // Círculo del mismo tamaño que el canvas
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  useEffect(() => {
    if (initialImage) {
      handleImageLoad(initialImage);
    }
  }, [initialImage, isOpen]);

  const handleImageLoad = (imageSrc) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      // Calcular escala inicial para que la imagen llene el círculo completo
      const imageAspect = img.width / img.height;
      let initialScale;
      
      if (imageAspect > 1) {
        // Imagen más ancha que alta - escalar por altura
        initialScale = CANVAS_SIZE / img.height;
      } else {
        // Imagen más alta que ancha - escalar por ancho
        initialScale = CANVAS_SIZE / img.width;
      }
      
      setScale(Math.max(initialScale, MIN_SCALE));
      setPosition({ x: 0, y: 0 });
      drawCanvas(img, Math.max(initialScale, MIN_SCALE), { x: 0, y: 0 });
    };
    img.src = imageSrc;
  };

  const drawCanvas = useCallback((img = image, currentScale = scale, currentPosition = position) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Limpiar canvas completamente
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Calcular dimensiones de la imagen escalada
    const scaledWidth = img.width * currentScale;
    const scaledHeight = img.height * currentScale;

    // Posición centrada + offset del drag
    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;
    const imageX = centerX - scaledWidth / 2 + currentPosition.x;
    const imageY = centerY - scaledHeight / 2 + currentPosition.y;

    // Crear clipping path circular que ocupa todo el canvas
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, CANVAS_SIZE / 2, 0, 2 * Math.PI);
    ctx.clip();

    // Dibujar imagen dentro del círculo
    ctx.drawImage(img, imageX, imageY, scaledWidth, scaledHeight);
    
    ctx.restore();

    // Dibujar borde del círculo (opcional, más sutil)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, CANVAS_SIZE / 2 - 1, 0, 2 * Math.PI);
    ctx.stroke();
  }, [image, scale, position]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Funciones de zoom
  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.2, MAX_SCALE);
    setScale(newScale);
    drawCanvas(image, newScale, position);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale * 0.8, MIN_SCALE);
    setScale(newScale);
    drawCanvas(image, newScale, position);
  };

  const handleReset = () => {
    if (image) {
      const imageAspect = image.width / image.height;
      let initialScale;
      
      if (imageAspect > 1) {
        initialScale = CANVAS_SIZE / image.height;
      } else {
        initialScale = CANVAS_SIZE / image.width;
      }
      
      const newScale = Math.max(initialScale, MIN_SCALE);
      const newPosition = { x: 0, y: 0 };
      setScale(newScale);
      setPosition(newPosition);
      drawCanvas(image, newScale, newPosition);
    }
  };

  // Funciones de drag (mouse)
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastPanPoint(position);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    const newPosition = {
      x: lastPanPoint.x + deltaX,
      y: lastPanPoint.y + deltaY
    };
    
    setPosition(newPosition);
    drawCanvas(image, scale, newPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Funciones táctiles
  const getTouchDistance = (touches) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touches = e.touches;
    
    if (touches.length === 1) {
      // Drag con un dedo
      setIsDragging(true);
      setDragStart({ x: touches[0].clientX, y: touches[0].clientY });
      setLastPanPoint(position);
    } else if (touches.length === 2) {
      // Zoom con dos dedos
      setIsDragging(false);
      const distance = getTouchDistance(touches);
      setLastTouchDistance(distance);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touches = e.touches;
    
    if (touches.length === 1 && isDragging) {
      // Drag con un dedo
      const deltaX = touches[0].clientX - dragStart.x;
      const deltaY = touches[0].clientY - dragStart.y;
      const newPosition = {
        x: lastPanPoint.x + deltaX,
        y: lastPanPoint.y + deltaY
      };
      
      setPosition(newPosition);
      drawCanvas(image, scale, newPosition);
    } else if (touches.length === 2) {
      // Zoom con dos dedos
      const distance = getTouchDistance(touches);
      if (lastTouchDistance > 0) {
        const scaleChange = distance / lastTouchDistance;
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * scaleChange));
        setScale(newScale);
        drawCanvas(image, newScale, position);
      }
      setLastTouchDistance(distance);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setLastTouchDistance(0);
  };

  // Función para recortar imagen
  const handleCropImage = () => {
    if (!image) return;
    
    setLoading(true);
    
    // Crear canvas temporal para el crop circular
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = CANVAS_SIZE;
    tempCanvas.height = CANVAS_SIZE;

    // Calcular dimensiones de la imagen escalada
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    // Posición de la imagen
    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;
    const imageX = centerX - scaledWidth / 2 + position.x;
    const imageY = centerY - scaledHeight / 2 + position.y;

    // Crear círculo clip que ocupa todo el canvas
    tempCtx.beginPath();
    tempCtx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, 2 * Math.PI);
    tempCtx.clip();

    // Dibujar la imagen completa escalada y posicionada
    tempCtx.drawImage(image, imageX, imageY, scaledWidth, scaledHeight);

    // Convertir a blob y llamar callback
    tempCanvas.toBlob((blob) => {
      const croppedImageUrl = URL.createObjectURL(blob);
      onImageCropped(croppedImageUrl, blob);
      setLoading(false);
      onClose();
    }, 'image/png', 0.9);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleImageLoad(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      {/* Header - Nuevo diseño blanco */}
      <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200 safe-area-top">
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Ajustar foto de perfil</h2>
        <button
          onClick={handleCropImage}
          disabled={!image || loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-4 py-2 rounded-full text-sm font-medium text-white shadow-sm"
        >
          {loading ? 'Procesando...' : 'Guardar'}
        </button>
      </div>

      {/* Canvas Container - Fondo blanco limpio */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
        {!image ? (
          <div className="text-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="bg-white hover:bg-gray-50 px-8 py-12 rounded-2xl border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-200 shadow-sm">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <p className="text-gray-900 text-xl font-medium mb-2">Selecciona una foto</p>
                <p className="text-gray-500 text-sm">JPG, PNG o GIF hasta 10MB</p>
              </div>
            </label>
          </div>
        ) : (
          <div className="relative">
            {/* Canvas con sombra elegante */}
            <div className="bg-white rounded-full p-4 shadow-2xl">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="cursor-move touch-none rounded-full ring-4 ring-white"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ 
                  maxWidth: '80vw', 
                  maxHeight: '50vh',
                  aspectRatio: '1/1'
                }}
              />
            </div>
            
            {/* Instrucciones en diseño blanco */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600">
                  Arrastra para mover • Pellizca para hacer zoom
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls - Diseño blanco moderno */}
      {image && (
        <div className="bg-white border-t border-gray-200 px-4 py-6 safe-area-bottom">
          <div className="flex justify-center items-center space-x-6">
            <button
              onClick={handleZoomOut}
              className="bg-gray-100 hover:bg-gray-200 p-3 rounded-xl transition-all duration-200 shadow-sm"
            >
              <ZoomOut className="w-6 h-6 text-gray-700" />
            </button>
            
            <div className="text-gray-700 text-center bg-gray-50 px-4 py-2 rounded-lg">
              <p className="text-xs text-gray-500 mb-1 font-medium">ZOOM</p>
              <p className="text-sm font-semibold">{Math.round(scale * 100)}%</p>
            </div>
            
            <button
              onClick={handleZoomIn}
              className="bg-gray-100 hover:bg-gray-200 p-3 rounded-xl transition-all duration-200 shadow-sm"
            >
              <ZoomIn className="w-6 h-6 text-gray-700" />
            </button>
            
            <div className="w-px h-8 bg-gray-300"></div>
            
            <button
              onClick={handleReset}
              className="bg-gray-100 hover:bg-gray-200 p-3 rounded-xl transition-all duration-200 shadow-sm"
            >
              <RotateCcw className="w-6 h-6 text-gray-700" />
            </button>
            
            <label className="bg-blue-50 hover:bg-blue-100 p-3 rounded-xl cursor-pointer transition-all duration-200 shadow-sm border border-blue-200">
              <Upload className="w-6 h-6 text-blue-600" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          
          {/* Botón adicional de confirmación más prominente */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleCropImage}
              disabled={!image || loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-8 py-3 rounded-2xl text-base font-medium text-white shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Procesando imagen...
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Aplicar recorte
                </div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CircularCrop;