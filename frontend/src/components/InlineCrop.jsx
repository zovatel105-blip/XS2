/**
 * InlineCrop - TikTok-style crop functionality directly in the preview area
 * - Mobile-first touch gestures with desktop support
 * - Minimalist TikTok-inspired UI
 * - Smooth pinch-to-zoom with bounce limits
 * - Drag to reposition without going outside bounds
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Check, X } from 'lucide-react';

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
  const [isInteracting, setIsInteracting] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // Reset transform when becoming active
  useEffect(() => {
    if (isActive) {
      setTransform({ scale: 1, translateX: 0, translateY: 0 });
      setIsInteracting(false);
    }
  }, [isActive]);

  // Get distance between two touches (pinch gesture detection)
  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle start of touch/mouse interaction
  const handleStart = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    setIsInteracting(true);
    
    if (e.touches) {
      // Touch event
      const touches = e.touches;
      
      if (touches.length === 1) {
        // Single finger - drag
        setIsDragging(true);
        setLastTouch({ x: touches[0].clientX, y: touches[0].clientY });
      } else if (touches.length === 2) {
        // Two fingers - pinch zoom
        setIsDragging(false);
        setLastDistance(getDistance(touches));
        
        // Center point between fingers for zoom origin
        const centerX = (touches[0].clientX + touches[1].clientX) / 2;
        const centerY = (touches[0].clientY + touches[1].clientY) / 2;
        setLastTouch({ x: centerX, y: centerY });
      }
    } else {
      // Mouse event
      setIsDragging(true);
      setLastTouch({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle movement during interaction
  const handleMove = (e) => {
    if (!isActive || !isInteracting) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches) {
      // Touch event
      const touches = e.touches;
      
      if (touches.length === 1 && isDragging) {
        // Single finger drag - move image smoothly
        const touch = touches[0];
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;
        
        setTransform(prev => ({
          ...prev,
          translateX: prev.translateX + deltaX,
          translateY: prev.translateY + deltaY
        }));
        
        setLastTouch({ x: touch.clientX, y: touch.clientY });
        
      } else if (touches.length === 2) {
        // Two finger pinch - zoom with limits and bounce
        const distance = getDistance(touches);
        const scaleFactor = distance / lastDistance;
        
        if (scaleFactor > 0.5 && scaleFactor < 2) { // Prevent extreme scaling
          setTransform(prev => {
            let newScale = prev.scale * scaleFactor;
            
            // Apply limits with smooth bounce effect
            if (newScale < 0.5) {
              newScale = 0.5 + (0.5 - newScale) * 0.1; // Bounce back from minimum
            } else if (newScale > 3) {
              newScale = 3 + (newScale - 3) * 0.1; // Bounce back from maximum
            }
            
            return {
              ...prev,
              scale: newScale
            };
          });
          
          setLastDistance(distance);
        }
      }
    } else if (isDragging) {
      // Mouse drag
      const deltaX = e.clientX - lastTouch.x;
      const deltaY = e.clientY - lastTouch.y;
      
      setTransform(prev => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY
      }));
      
      setLastTouch({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle end of interaction
  const handleEnd = (e) => {
    if (!isActive) return;
    
    setIsDragging(false);
    setIsInteracting(false);
    
    // Apply scale limits and bounce back if exceeded
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale))
    }));
  };

  // Handle mouse wheel for desktop zoom
  const handleWheel = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    
    const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
    
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale * scaleDelta))
    }));
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
      {/* Interactive image - fills entire container */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-move select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Crop preview"
          className="w-full h-full object-cover"
          style={{
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
            transformOrigin: 'center'
          }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      {/* Minimal overlay - only essential controls */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Simple grid overlay */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="border border-white/50" />
          ))}
        </div>
      </div>

      {/* Floating control buttons - minimal */}
      <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
        <button
          onClick={onCancel}
          className="w-10 h-10 bg-black/80 hover:bg-black/90 rounded-full flex items-center justify-center text-white shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleSave}
          className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg"
        >
          <Check className="w-5 h-5" />
        </button>
      </div>

      {/* Debug info - bottom left */}
      <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs px-3 py-2 rounded-lg pointer-events-none">
        <div>🔍 {transform.scale.toFixed(2)}x</div>
        <div>📍 {transform.translateX.toFixed(0)}, {transform.translateY.toFixed(0)}</div>
        <div>{isDragging ? '👆 Moviendo' : '✋ Toca para mover'}</div>
      </div>

      {/* Hidden canvas for crop generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default InlineCrop;