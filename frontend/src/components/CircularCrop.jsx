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
      // Calcular escala inicial para que la imagen llene el círculo
      const imageAspect = img.width / img.height;
      const cropAspect = 1; // círculo es 1:1
      let initialScale;
      
      if (imageAspect > cropAspect) {
        // Imagen más ancha que el círculo
        initialScale = CROP_SIZE / img.height;
      } else {
        // Imagen más alta que el círculo
        initialScale = CROP_SIZE / img.width;
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

    // Limpiar canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Fondo oscuro semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Calcular dimensiones de la imagen escalada
    const scaledWidth = img.width * currentScale;
    const scaledHeight = img.height * currentScale;

    // Posición centrada + offset del drag
    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;
    const imageX = centerX - scaledWidth / 2 + currentPosition.x;
    const imageY = centerY - scaledHeight / 2 + currentPosition.y;

    // Crear clipping path circular
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, CROP_SIZE / 2, 0, 2 * Math.PI);
    ctx.clip();

    // Dibujar imagen dentro del círculo
    ctx.drawImage(img, imageX, imageY, scaledWidth, scaledHeight);
    
    ctx.restore();

    // Dibujar borde del círculo
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, CROP_SIZE / 2, 0, 2 * Math.PI);
    ctx.stroke();

    // Overlay con círculo transparente
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, CROP_SIZE / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.globalCompositeOperation = 'source-over';
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
      const cropAspect = 1;
      let initialScale;
      
      if (imageAspect > cropAspect) {
        initialScale = CROP_SIZE / image.height;
      } else {
        initialScale = CROP_SIZE / image.width;
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
    
    // Crear canvas temporal para el crop
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = CROP_SIZE;
    tempCanvas.height = CROP_SIZE;

    // Calcular dimensiones de la imagen escalada
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    // Posición de la imagen
    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;
    const imageX = centerX - scaledWidth / 2 + position.x;
    const imageY = centerY - scaledHeight / 2 + position.y;

    // Calcular qué parte de la imagen mostrar en el crop
    const cropStartX = (CANVAS_SIZE - CROP_SIZE) / 2 - imageX;
    const cropStartY = (CANVAS_SIZE - CROP_SIZE) / 2 - imageY;

    // Crear círculo clip
    tempCtx.beginPath();
    tempCtx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, 2 * Math.PI);
    tempCtx.clip();

    // Dibujar la porción recortada de la imagen
    tempCtx.drawImage(
      image,
      cropStartX / scale, cropStartY / scale,
      CROP_SIZE / scale, CROP_SIZE / scale,
      0, 0,
      CROP_SIZE, CROP_SIZE
    );

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
    <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-black text-white">
        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-semibold">Ajustar foto de perfil</h2>
        <button
          onClick={handleCropImage}
          disabled={!image || loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-4 py-2 rounded-full text-sm font-medium"
        >
          {loading ? 'Procesando...' : 'Guardar'}
        </button>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        {!image ? (
          <div className="text-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="bg-gray-800 hover:bg-gray-700 px-8 py-6 rounded-xl border-2 border-dashed border-gray-600">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-white text-lg">Selecciona una foto</p>
                <p className="text-gray-400 text-sm mt-2">JPG, PNG o GIF hasta 10MB</p>
              </div>
            </label>
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="border border-gray-600 rounded-lg cursor-move touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ maxWidth: '90vw', maxHeight: '60vh' }}
            />
            
            {/* Instrucciones */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center text-white">
              <p className="text-sm opacity-75">
                Arrastra para mover • Pellizca para hacer zoom
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {image && (
        <div className="bg-black px-4 py-6">
          <div className="flex justify-center items-center space-x-6">
            <button
              onClick={handleZoomOut}
              className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full"
            >
              <ZoomOut className="w-6 h-6 text-white" />
            </button>
            
            <div className="text-white text-center">
              <p className="text-xs opacity-75 mb-1">ZOOM</p>
              <p className="text-sm font-medium">{Math.round(scale * 100)}%</p>
            </div>
            
            <button
              onClick={handleZoomIn}
              className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full"
            >
              <ZoomIn className="w-6 h-6 text-white" />
            </button>
            
            <div className="w-px h-8 bg-gray-600"></div>
            
            <button
              onClick={handleReset}
              className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
            
            <label className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full cursor-pointer">
              <Upload className="w-6 h-6 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default CircularCrop;