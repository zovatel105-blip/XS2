/**
 * InlineCrop - Crop functionality directly in the preview area
 * - No modal, works directly over the existing image
 * - Overlay controls on the preview
 * - Touch gestures for repositioning and zoom
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Check, X, RotateCcw, Move } from 'lucide-react';

const InlineCrop = ({
  isActive = false,
  imageSrc = '',
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  // Transform state for the image
  const [transform, setTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });

  // Touch interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [lastDistance, setLastDistance] = useState(0);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // Reset transform when becoming active
  useEffect(() => {
    if (isActive) {
      setTransform({ scale: 1, translateX: 0, translateY: 0 });
    }
  }, [isActive]);

  // Get distance between two touches
  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle touch start
  const handleTouchStart = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const touches = e.touches;
    console.log(`🎯 Inline crop touch start: ${touches.length} fingers`);
    
    if (touches.length === 1) {
      setIsDragging(true);
      setLastTouch({ x: touches[0].clientX, y: touches[0].clientY });
    } else if (touches.length === 2) {
      setIsDragging(false);
      setLastDistance(getDistance(touches));
    }
  };

  // Handle touch move
  const handleTouchMove = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const touches = e.touches;
    
    if (touches.length === 1 && isDragging) {
      // Single finger drag - move image
      const deltaX = touches[0].clientX - lastTouch.x;
      const deltaY = touches[0].clientY - lastTouch.y;
      
      setTransform(prev => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY
      }));
      
      setLastTouch({ x: touches[0].clientX, y: touches[0].clientY });
      console.log(`🔄 Inline drag: ${deltaX.toFixed(1)}, ${deltaY.toFixed(1)}`);
      
    } else if (touches.length === 2) {
      // Two finger pinch - zoom image
      const distance = getDistance(touches);
      const scaleFactor = distance / lastDistance;
      
      if (scaleFactor > 0.1 && scaleFactor < 10) {
        setTransform(prev => ({
          ...prev,
          scale: Math.max(0.5, Math.min(3, prev.scale * scaleFactor))
        }));
        
        setLastDistance(distance);
        console.log(`🔍 Inline zoom: ${(transform.scale * scaleFactor).toFixed(2)}x`);
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    console.log('✋ Inline touch ended');
  };

  // Reset transform
  const handleReset = () => {
    setTransform({ scale: 1, translateX: 0, translateY: 0 });
  };

  // Generate cropped image
  const generateCrop = useCallback(async () => {
    if (!imageRef.current || !containerRef.current || !canvasRef.current) {
      return null;
    }

    const img = imageRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Set canvas size to container size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Apply transform to draw the image as it appears to user
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(transform.scale, transform.scale);
    ctx.translate(
      transform.translateX / transform.scale,
      transform.translateY / transform.scale
    );

    // Draw image centered
    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );

    ctx.restore();

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.95);
    });
  }, [transform]);

  // Handle save
  const handleSave = async () => {
    const croppedBlob = await generateCrop();
    if (croppedBlob) {
      const reader = new FileReader();
      reader.onload = () => {
        onSave({
          blob: croppedBlob,
          base64: reader.result
        });
      };
      reader.readAsDataURL(croppedBlob);
    }
  };

  if (!isActive) {
    // Normal image display when not cropping
    return (
      <img
        src={imageSrc}
        alt="Preview"
        className={`w-full h-full object-cover ${className}`}
        onDragStart={(e) => e.preventDefault()}
      />
    );
  }

  // Crop mode - interactive overlay
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Interactive image */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-move select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Crop preview"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
            transformOrigin: 'center'
          }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      {/* Crop overlay controls */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid overlay */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="border border-white/30" />
          ))}
        </div>

        {/* Corner indicators */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-white" />
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-white" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-white" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-white" />

        {/* Center move indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
          <Move className="w-4 h-4 text-black" />
        </div>
      </div>

      {/* Control buttons */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex gap-2 pointer-events-auto">
        <button
          onClick={onCancel}
          className="w-8 h-8 bg-black/70 hover:bg-black/80 rounded-full flex items-center justify-center text-white border border-white/20"
        >
          <X className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleReset}
          className="w-8 h-8 bg-black/70 hover:bg-black/80 rounded-full flex items-center justify-center text-white border border-white/20"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleSave}
          className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>

      {/* Debug info */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
        <div>Zoom: {transform.scale.toFixed(2)}x</div>
        <div>X: {transform.translateX.toFixed(0)}, Y: {transform.translateY.toFixed(0)}</div>
        <div>{isDragging ? '👆 Arrastrando' : '✋ Listo'}</div>
      </div>

      {/* Hidden canvas for crop generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default InlineCrop;